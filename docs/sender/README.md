# Home Theater Audio Interop Web Sender

This is a minimal Google Cast Web Sender for the project's custom receiver application ID `111463A9`.

It can:

- discover/select a Cast device,
- launch the custom receiver,
- show basic session state,
- stop the Cast session.

It does not request, receive, store, or transmit Audible credentials, audiobook data, listening history, DRM keys, or license responses.

This sender exists as an independent sender application for the interoperability project and is not affiliated with or endorsed by Audible or Amazon.

When GitHub Pages is enabled from `main` / `/docs`, the sender URL is:

`https://objectinspace.github.io/audible-HT-Atmos/sender/`

That URL can be used as the Web Sender application URL in the Google Cast SDK Developer Console for the receiver application.
