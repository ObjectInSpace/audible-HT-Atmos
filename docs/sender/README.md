# Home Theater Audio Interop Web Sender

This is a minimal Google Cast Web Sender for testing a user-owned Custom Web Receiver.

It can:

- accept a user-supplied Cast application ID,
- discover/select a Cast device,
- launch that receiver,
- show basic session state,
- stop the Cast session.

It does not request, receive, store, or transmit Audible credentials, audiobook data, listening history, DRM keys, or license responses.

This sender exists as an independent test utility for the interoperability project and is not affiliated with or endorsed by Audible or Amazon.

When GitHub Pages is enabled from `main` / `/docs`, the sender URL is:

`https://objectinspace.github.io/audible-HT-Atmos/sender/`

Enter your own Cast application ID on that page, or supply it in the URL:

`https://objectinspace.github.io/audible-HT-Atmos/sender/?appId=YOUR_APP_ID`

## Recommended distribution model

This project does not require a shared public Cast application. Each user can:

1. host or fork the receiver under HTTPS,
2. register their own Custom Web Receiver in the Google Cast SDK Developer Console,
3. register their own Cast test devices,
4. use the resulting application ID in this Web Sender and in their local Audible sender patch.

The repository intentionally does not treat any one Cast application ID as the public/global receiver for the project.