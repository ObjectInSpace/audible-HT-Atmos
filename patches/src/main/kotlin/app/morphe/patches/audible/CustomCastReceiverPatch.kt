package app.morphe.patches.audible

import app.morphe.patcher.patch.ApkFileType
import app.morphe.patcher.patch.AppTarget
import app.morphe.patcher.patch.Compatibility
import app.morphe.patcher.patch.PatchException
import app.morphe.patcher.patch.rawResourcePatch
import app.morphe.patcher.patch.stringOption

private const val CAST_TARGET_DEX = "classes6.dex"
private const val AUDIBLE_CAST_APP_ID = "25456794"

private val AUDIBLE_CAST_26_36_09 = Compatibility(
    name = "Audible",
    packageName = "com.audible.application",
    apkFileType = ApkFileType.APK,
    appIconColor = 0xF58220,
    targets = listOf(
        AppTarget(version = "26.36.09")
    )
)

@Suppress("unused")
val customCastReceiverPatch = rawResourcePatch(
    name = "Use custom Cast receiver",
    description = "Replaces Audible's production Cast application ID with a user-supplied Custom Web Receiver application ID.",
    default = false,
) {
    compatibleWith(AUDIBLE_CAST_26_36_09)

    val receiverApplicationId = stringOption(
        key = "receiverApplicationId",
        default = "",
        title = "Custom Cast receiver application ID"
    )

    execute {
        val replacement = receiverApplicationId.value?.trim().orEmpty().uppercase()

        if (!replacement.matches(Regex("^[0-9A-F]{8}$"))) {
            throw PatchException(
                "Custom Cast receiver application ID must be exactly 8 hexadecimal characters, " +
                    "for example 111463A9. Register your own Custom Web Receiver in the Google Cast SDK Developer Console first."
            )
        }

        if (replacement == AUDIBLE_CAST_APP_ID) {
            throw PatchException("The replacement Cast application ID is still Audible's production ID.")
        }

        val dex = get(CAST_TARGET_DEX, true)
        if (!dex.exists()) throw PatchException("$CAST_TARGET_DEX was not found")

        val bytes = dex.readBytes()
        val needle = AUDIBLE_CAST_APP_ID.toByteArray(Charsets.US_ASCII)
        val replacementBytes = replacement.toByteArray(Charsets.US_ASCII)

        val matches = mutableListOf<Int>()
        var i = 0
        while (i <= bytes.size - needle.size) {
            var matched = true
            for (j in needle.indices) {
                if (bytes[i + j] != needle[j]) {
                    matched = false
                    break
                }
            }
            if (matched) matches += i
            i++
        }

        if (matches.size != 1) {
            throw PatchException(
                "Expected exactly one Audible Cast application ID in $CAST_TARGET_DEX, found ${matches.size}. " +
                    "Refusing to patch an unexpected build."
            )
        }

        replacementBytes.copyInto(bytes, destinationOffset = matches.single())

        // Recompute the DEX SHA-1 signature and Adler-32 checksum after the in-place string replacement.
        val signature = java.security.MessageDigest.getInstance("SHA-1")
            .digest(bytes.copyOfRange(32, bytes.size))
        signature.copyInto(bytes, destinationOffset = 12)

        val adler32 = java.util.zip.Adler32().apply {
            update(bytes, 12, bytes.size - 12)
        }.value.toInt()

        bytes[8] = (adler32 and 0xff).toByte()
        bytes[9] = ((adler32 ushr 8) and 0xff).toByte()
        bytes[10] = ((adler32 ushr 16) and 0xff).toByte()
        bytes[11] = ((adler32 ushr 24) and 0xff).toByte()

        dex.writeBytes(bytes)
    }
}
