# Audible Cast Atmos test receiver

This is a test-only Google Cast Web Receiver for the Audible Home Theater Atmos investigation.

It loads Google's hosted Cast Application Framework, then loads Audible's production Cast receiver JavaScript from its CloudFront URL. Before Audible's receiver starts, `patch.js` adds `ec+3` to the existing `supported_media_features` object used for the content-license request.

## GitHub Pages

Configure this repository's Pages source as:

- Branch: `main`
- Folder: `/docs`

The receiver URL will then be:

`https://objectinspace.github.io/audible-HT-Atmos/cast-receiver/`

Use that URL when registering an unpublished Custom Web Receiver in the Google Cast SDK Developer Console.

The production Audible Cast application ID remains `25456794`; for testing, the Audible Android sender must be pointed at the new custom receiver application ID assigned by Google.
