(() => {
  const nativeStringify = JSON.stringify;
  const AAC_LC = "mp4a.40.2";
  const XHE_AAC = "mp4a.40.42";
  const EC3_JOC = "ec+3";
  const AC4 = "ac-4";

  function supportsEc3() {
    try {
      const context = cast.framework.CastReceiverContext.getInstance();
      return context.canDisplayType('audio/mp4; codecs="ec-3"') === true;
    } catch (_) {
      // If capability detection is unavailable, prefer the safe AAC path.
      return false;
    }
  }

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
        const ec3Supported = supportsEc3();

        // Start from the receiver's existing list, but remove spatial codecs so
        // this shim controls when they are advertised.
        const codecs = Array.isArray(features.codecs)
          ? features.codecs.filter(codec => codec !== EC3_JOC && codec !== AC4)
          : [];

        // Keep broadly compatible Audible fallbacks available.
        if (!codecs.includes(AAC_LC)) codecs.push(AAC_LC);
        if (!codecs.includes(XHE_AAC)) codecs.push(XHE_AAC);

        // Audible uses ec+3 for E-AC-3/JOC. Advertise it only when the Cast
        // receiver reports E-AC-3 support. AC-4 is intentionally never added.
        if (ec3Supported && !codecs.includes(EC3_JOC)) codecs.push(EC3_JOC);

        features.codecs = codecs;

        value = {
          ...value,
          spatial: ec3Supported,
          supported_media_features: features,
        };

        console.info(
          "[Audible Atmos test] E-AC-3 support:",
          ec3Supported,
          "advertising codecs:",
          features.codecs,
          "spatial:",
          value.spatial
        );
      }
    } catch (_) {
      // Preserve the production receiver behavior if the test shim cannot inspect a value.
    }

    return nativeStringify.call(JSON, value, replacer, space);
  };
})();
