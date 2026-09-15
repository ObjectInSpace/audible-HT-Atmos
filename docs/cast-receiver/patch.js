(() => {
  const nativeStringify = JSON.stringify;

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

        if (!codecs.includes("ec+3")) codecs.push("ec+3");
        features.codecs = codecs;

        value = { ...value, supported_media_features: features };
        console.info("[Audible Atmos test] Advertising ec+3 in content license request");
      }
    } catch (_) {
      // Preserve the production receiver behavior if the test shim cannot inspect a value.
    }

    return nativeStringify.call(JSON, value, replacer, space);
  };
})();
