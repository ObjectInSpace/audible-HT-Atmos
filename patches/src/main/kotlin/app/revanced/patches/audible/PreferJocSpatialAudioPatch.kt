package app.revanced.patches.audible

import app.revanced.patcher.patch.PatchException
import app.revanced.patcher.patch.rawResourcePatch
import java.io.RandomAccessFile
import java.security.MessageDigest
import java.util.zip.Adler32

private const val TARGET_DEX = "classes5.dex"
private const val TARGET_DEX_SHA256 = "05712df84bb8c195faaf952728ac2c645da45b75e95f4d91aa2dd1c5534bdb10"
private const val PATCH_OFFSET = 5_429_448L
private const val EXPECTED_BYTE = 0x0e
private const val REPLACEMENT_BYTE = 0x72

@Suppress("unused")
val preferJocSpatialAudioPatch = rawResourcePatch(
    name = "Prefer E-AC-3/JOC spatial audio",
    description = "Suppresses Audible's AC-4 capability result so compatible spatial titles use the E-AC-3/JOC Atmos representation.",
) {
    compatibleWith("com.audible.application"("26.36.09"))

    execute {
        val dex = get(TARGET_DEX, true)
        if (!dex.exists()) throw PatchException("$TARGET_DEX was not found")

        val original = dex.readBytes()
        val sha256 = MessageDigest.getInstance("SHA-256")
            .digest(original)
            .joinToString("") { "%02x".format(it) }

        if (sha256 != TARGET_DEX_SHA256) {
            throw PatchException(
                "Unsupported $TARGET_DEX. Expected SHA-256 $TARGET_DEX_SHA256, got $sha256. " +
                    "This patch is intentionally locked to the tested Audible 26.36.09 APK."
            )
        }

        if ((original[PATCH_OFFSET.toInt()].toInt() and 0xff) != EXPECTED_BYTE) {
            throw PatchException(
                "Unexpected byte at patch offset 0x${PATCH_OFFSET.toString(16)}; refusing to patch."
            )
        }

        RandomAccessFile(dex, "rw").use { file ->
            file.seek(PATCH_OFFSET)
            file.write(REPLACEMENT_BYTE)
        }

        // A DEX stores a SHA-1 signature at bytes 12..31 over bytes 32..EOF,
        // then an Adler-32 checksum at bytes 8..11 over bytes 12..EOF.
        // Recompute both after changing the instruction byte.
        val patched = dex.readBytes()

        val signature = MessageDigest.getInstance("SHA-1")
            .digest(patched.copyOfRange(32, patched.size))
        signature.copyInto(patched, destinationOffset = 12)

        val adler32 = Adler32().apply {
            update(patched, 12, patched.size - 12)
        }.value.toInt()

        patched[8] = (adler32 and 0xff).toByte()
        patched[9] = ((adler32 ushr 8) and 0xff).toByte()
        patched[10] = ((adler32 ushr 16) and 0xff).toByte()
        patched[11] = ((adler32 ushr 24) and 0xff).toByte()

        dex.writeBytes(patched)
    }
}
