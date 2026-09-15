(() => {
  const nativeStringify = JSON.stringify;
  const preferredCodecs = ["mp4a.40.2", "mp4a.40.42", "ec+3"];

  JSON.stringify = function(value, replacer, space) {
    try {
      if (
        value &&
        typeof value === "object" &&
        value.supported_media_features &&
        value.supported_media_features.previews === true &&
        value.supported_media_features.catalog_samples === true
      ) {
        const features = { ...value.supported_media_features };
        const codecs = Array.isArray(features.codecs) ? [...features.codecs] : [];

        for (const codec of preferredCodecs) {
          if (!codecs.includes(codec)) codecs.push(codec);
        }

        // Do not advertise AC-4. The goal is to make E-AC-3/JOC the
        // available spatial representation while retaining AAC fallbacks.
        features.codecs = codecs.filter(codec => codec !== "ac-4");

        value = {
          ...value,
          spatial: true,
          supported_media_features: features,
        };

        console.info(
          "[Audible Atmos test] Advertising spatial playback with codecs:",
          features.codecs
        );
      }
    } catch (_) {
      // Preserve the production receiver behavior if the test shim cannot inspect a value.
    }

    return nativeStringify.call(JSON, value, replacer, space);
  };
})();
