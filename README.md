# Audible Home Theater Atmos patch

Private Morphe patch for Audible for Android.

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

The project currently uses the Morphe patches Gradle plugin declared in `settings.gradle.kts`.

## Safety / compatibility

Do not remove the hash guard merely to make a newer Audible build patch. The byte offset is specific to the tested 26.36.09 DEX. Future versions should be analyzed and either given a new guarded raw patch or migrated to a semantic bytecode fingerprint once the equivalent method is identified and verified.

## Distribution

Keep this repository private for now. If it is ever published, distribute patch source/bundles only, not Audible APKs, Audible assets, decrypted media, signing material, or DRM-related secrets.
