# Audible Home Theater Atmos patch

Unofficial interoperability project for Audible for Android. This project is independent and is **not affiliated with, endorsed by, or sponsored by Audible or Amazon**.

## What it does

Audible 26.36.09 can advertise both AC-4 and E-AC-3/JOC spatial-audio support on capable Android devices. On the tested Google TV Streamer, Audible selected the AC-4 immersive-stereo asset, which Android rendered to two-channel output. Suppressing Audible's AC-4 capability result while leaving E-AC-3/JOC support intact causes the same title to play as Dolby Atmos through the home-theater path.

This repository contains a deliberately **version-locked Morphe patch** for:

- Package: `com.audible.application`
- Version name: `26.36.09`
- Version code: `2090263609`
- Tested APK: APKMirror universal APK, minSdk 28, arm64-v8a/armeabi-v7a/x86/x86_64, nodpi

The implementation reproduces the single-byte DEX change from the already-tested prototype. It validates the complete SHA-256 of `classes5.dex` before writing anything, so it fails rather than patching an unexpected build. After changing the instruction byte, it regenerates the DEX SHA-1 signature and Adler-32 checksum.

## Scope

The patch changes codec capability selection only. It does **not** bypass Audible authentication, entitlement checks, Widevine, or content encryption, and it does not extract or redistribute audiobook media.

Users must have legitimate access to any Audible content they play. This project does not provide Audible accounts, credentials, licenses, decryption keys, or audiobook files.

## Privacy and security

The project does not operate a backend service and does not collect or retain Audible credentials, access tokens, listening history, audiobook content, DRM keys, or license responses.

The optional Cast receiver is hosted as static client-side code. Authentication and content requests remain between the user's Cast device and Audible/Amazon services. The repository does not contain or distribute Audible APKs, decrypted media, signing material, access tokens, or DRM secrets.

## Tested behavior

Before the patch:

`Audible spatial title -> AC-4 -> Android/MS12 -> 2-channel output`

After the patch:

`Audible spatial title -> E-AC-3/JOC -> Android Dolby pipeline -> Dolby Atmos`

On the tested setup, the Sony Bravia Theater Quad reports Dolby Atmos after the patch.

## Morphe

This project targets the current Morphe patch toolchain rather than ReVanced.

The patch source is:

`patches/src/main/kotlin/app/morphe/patches/audible/PreferJocSpatialAudioPatch.kt`

The project uses Morphe patches Gradle plugin 1.3.4 and Morphe Patcher 1.13.0.

### Build

Morphe's build task is:

```bash
gradle buildAndroid
```

or, when the Gradle wrapper from the Morphe template is present:

```bash
./gradlew buildAndroid
```

The generated bundle is written under:

`patches/build/libs/*.mpp`

GitHub Actions also runs `buildAndroid` on pushes and pull requests and uploads the resulting `.mpp` as the `audible-ht-atmos-morphe-patch` workflow artifact.

The current source has been successfully built by GitHub Actions as `patches-0.1.0.mpp`.

### Applying for testing

Use Morphe Manager or Morphe Desktop with the original supported Audible 26.36.09 APK and this `.mpp` bundle. Select **Prefer E-AC-3/JOC spatial audio** and patch the APK normally. The strict DEX hash guard will reject an APK whose `classes5.dex` is not the tested build.

Because the output APK is re-signed, an installed stock Audible build signed by Amazon generally must be uninstalled before installing the patched APK.

## Safety / compatibility

Do not remove the hash guard merely to make a newer Audible build patch. The byte offset is specific to the tested 26.36.09 DEX. Future versions should be analyzed and either given a new guarded raw patch or migrated to a semantic bytecode fingerprint once the equivalent method is identified and verified.

## Distribution

Distribute patch source and patch bundles only. Do not distribute Audible APKs, Audible assets, decrypted media, signing material, access tokens, DRM keys, or other DRM-related secrets.

The Cast receiver under `docs/cast-receiver/` is an experimental interoperability component and should be evaluated independently before any public Cast application publication.