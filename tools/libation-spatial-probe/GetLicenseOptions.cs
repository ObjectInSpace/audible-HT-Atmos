using ApplicationServices;
using AudibleApi;
using AudibleApi.Common;
using CommandLine;
using DataLayer;
using FileLiberator;
using LibationFileManager;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System;
using System.Threading.Tasks;

namespace LibationCli.Options;

[Verb("get-license", HelpText = "Get the license information for a book.")]
internal class GetLicenseOptions : OptionsBase
{
    [Value(0, MetaName = "[asin]", HelpText = "Product ID of book to request license for.", Required = true)]
    public string? Asin { get; set; }

    [Option("probe-spatial", Required = false, HelpText = "Probe an Audible spatial content license without starting Widevine license negotiation. Values: ec3 or ac4.")]
    public string? ProbeSpatialCodec { get; set; }

    protected override async Task ProcessAsync()
    {
        if (string.IsNullOrWhiteSpace(Asin))
        {
            Console.Error.WriteLine("ASIN is required.");
            return;
        }

        if (DbContexts.GetLibraryBook_Flat_NoTracking(Asin) is not LibraryBook libraryBook)
        {
            Console.Error.WriteLine($"Book not found with asin={Asin}");
            return;
        }

        var api = await libraryBook.GetApiAsync();

        if (!string.IsNullOrWhiteSpace(ProbeSpatialCodec))
        {
            var requested = ProbeSpatialCodec.Trim().ToLowerInvariant();
            var codec = requested switch
            {
                "ec3" or "ec+3" or "eac3" => Codecs.EC_3,
                "ac4" or "ac-4" => Codecs.AC_4,
                _ => throw new ArgumentException("--probe-spatial must be ec3 or ac4")
            };

            // Deliberately stop after Audible's content-license request. This does not
            // instantiate a CDM, create a Widevine challenge, request DRM keys, download
            // media segments, or decrypt content.
            var contentLicense = await api.GetDownloadLicenseAsync(
                Asin,
                DownloadQuality.High,
                ChapterTitlesType.Tree,
                DrmType.Widevine,
                spatial: true,
                Codecs.AAC_LC,
                codec);

            var probe = new
            {
                Asin,
                RequestedCodec = requested,
                Spatial = true,
                Quality = "High",
                contentLicense.DrmType,
                ManifestUrl = contentLicense.LicenseResponse,
                ContentReference = contentLicense.ContentMetadata?.ContentReference,
                HasContentMetadata = contentLicense.ContentMetadata is not null,
                HasManifestUrl = !string.IsNullOrWhiteSpace(contentLicense.LicenseResponse)
            };

            Console.WriteLine(JsonConvert.SerializeObject(probe, Formatting.Indented, new StringEnumConverter()));
            return;
        }

        var license = await DownloadOptions.GetDownloadLicenseAsync(api, libraryBook, Configuration.Instance, default);

        var jsonSettings = new JsonSerializerSettings
        {
            NullValueHandling = NullValueHandling.Ignore,
            Converters = [new StringEnumConverter(), new ByteArrayHexConverter()]
        };

        var licenseJson = JsonConvert.SerializeObject(license, Formatting.Indented, jsonSettings);
        Console.WriteLine(licenseJson);
    }
}

class ByteArrayHexConverter : JsonConverter
{
    public override bool CanConvert(Type objectType) => objectType == typeof(byte[]);

    public override bool CanRead => false;
    public override bool CanWrite => true;

    public override object? ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
        => throw new NotSupportedException();

    public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
    {
        if (value is byte[] array)
        {
            writer.WriteValue(Convert.ToHexStringLower(array));
        }
    }
}
