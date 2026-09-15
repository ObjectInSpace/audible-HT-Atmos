# Audible Home Theater Atmos patch

Unofficial interoperability project for Audible for Android. This project is independent and is **not affiliated with, endorsed by, or sponsored by Audible or Amazon**.

## Two independent workflows

This project provides two optional Morphe patches for Audible 26.36.09. Users can apply either patch independently, or both.

### 1. Local Android / Google TV playback

**Prefer E-AC-3/JOC spatial audio** suppresses Audible's AC-4 capability result while leaving E-AC-3/JOC available. On the tested Google TV Streamer, this changes Audible's spatial selection from the AC-4 immersive-stereo asset to the E-AC-3/JOC Atmos representation.

This is useful when running the regular Android Audible app directly on an Android/Google TV device. Audible does not provide a native Android TV app; this workflow uses the sideloaded regular Android app.

### 2. Cast playback

**Use custom Cast receiver** replaces Audible's production Cast application ID (`25456794`) with a user-supplied Google Cast application ID.

The project hosts the receiver code at:

`https://objectinspace.github.io/audible-HT-Atmos/cast-receiver/`

Users do **not** need to fork or host the receiver code themselves. Each user registers their own unpublished Custom Web Receiver in the Google Cast SDK Developer Console and points it at the URL above. Google assigns that user an 8-character Cast application ID, which is entered as the Morphe patch option.

This keeps Cast registration and test-device authorization under each user's own Google account while allowing everyone to use the same open receiver code.

## Supported Audible build

Both patches are currently version-locked to:

- Package: `com.audible.application`
- Version name: `26.36.09`
- Version code: `2090263609`
- Tested APK: APKMirror universal APK, minSdk 28, arm64-v8a/armeabi-v7a/x86/x86_64, nodpi

The patches fail rather than silently modifying an unexpected build.

## Cast setup

For the Cast workflow:

1. Open the Google Cast SDK Developer Console.
2. Register an **unpublished Custom Web Receiver** whose receiver URL is:
   `https://objectinspace.github.io/audible-HT-Atmos/cast-receiver/`
3. Register the Cast/Google TV device(s) you want to use for development testing.
4. Copy the 8-character Cast application ID assigned by Google.
5. In Morphe Manager or Morphe Desktop, select **Use custom Cast receiver** and enter that ID in **Custom Cast receiver application ID**.
6. Patch and install Audible.
7. Cast normally from Audible. The patched sender launches the user's own Cast registration, which loads the shared receiver code above.

The optional Web Sender at:

`https://objectinspace.github.io/audible-HT-Atmos/sender/`

can also launch any user-supplied receiver ID for testing. It accepts the ID interactively or via `?appId=YOUR_APP_ID`.

## Receiver audio policy

The receiver modifies Audible's content-license request rather than proxying media or credentials. It dynamically checks whether the Cast playback environment supports E-AC-3.

- If E-AC-3 is supported, it advertises AAC-LC (`mp4a.40.2`), xHE-AAC (`mp4a.40.42`), and E-AC-3/JOC (`ec+3`) and requests spatial playback.
- If E-AC-3 is not supported, it advertises AAC-LC and xHE-AAC and does not request spatial playback.
- It deliberately does not advertise AC-4, because Audible may prefer its AC-4 immersive-stereo representation even where E-AC-3/JOC is the preferable home-theater source.

## Privacy and security

The project does not operate a backend service and does not collect or retain Audible credentials, access tokens, listening history, audiobook content, DRM keys, or license responses.

The Cast receiver is static client-side code. Authentication and content requests remain between the user's Cast device and Audible/Amazon services. The repository does not contain or distribute Audible APKs, decrypted media, signing material, access tokens, or DRM secrets.

The patches do **not** bypass Audible authentication, entitlement checks, Widevine, or content encryption, and they do not extract or redistribute audiobook media. Users must have legitimate access to any Audible content they play.

## Morphe

Patch sources:

- `patches/src/main/kotlin/app/morphe/patches/audible/PreferJocSpatialAudioPatch.kt`
- `patches/src/main/kotlin/app/morphe/patches/audible/CustomCastReceiverPatch.kt`

The project uses Morphe patches Gradle plugin 1.3.4 and Morphe Patcher 1.13.0.

### Build

```bash
gradle buildAndroid
```

or, with the Gradle wrapper:

```bash
./gradlew buildAndroid
```

The generated bundle is written under `patches/build/libs/*.mpp`. GitHub Actions also builds the bundle on pushes and pull requests and uploads it as a workflow artifact.

Because a patched APK is re-signed, an installed stock Audible build signed by Amazon generally must be uninstalled before installing the patched APK.

## Safety / compatibility

Do not remove version/hash/structure guards merely to make a newer Audible build patch. Future Audible versions should be analyzed and verified before compatibility is expanded.

## Distribution

Distribute patch source and patch bundles only. Do not distribute Audible APKs, Audible assets, decrypted media, signing material, access tokens, DRM keys, or other DRM-related secrets.
