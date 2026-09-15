use jni::{
    objects::{JByteArray, JClass},
    sys::{jbyteArray, jint, jlong},
    JNIEnv,
};
use oxideav_core::{
    CodecId, CodecParameters, Decoder, Frame, Packet, SampleFormat, TimeBase,
};

struct Ac4Context {
    decoder: Box<dyn Decoder>,
    channels: i32,
    sample_rate: i32,
}

fn ptr_mut<'a>(p: jlong) -> &'a mut Ac4Context {
    assert_ne!(p, 0);
    unsafe { &mut *(p as *mut Ac4Context) }
}

fn throw(env: &mut JNIEnv, message: impl AsRef<str>) {
    let _ = env.throw_new("java/lang/IllegalStateException", message.as_ref());
}

#[no_mangle]
pub extern "system" fn Java_com_brouken_player_ac4_Ac4Decoder_nativeCreate(
    _env: JNIEnv,
    _class: JClass,
) -> jlong {
    // This first POC deliberately targets Dolby's 48 kHz stereo IMS fixture.
    let mut params = CodecParameters::audio(CodecId::new("ac4"));
    params.sample_rate = Some(48_000);
    params.channels = Some(2);
    params.sample_format = Some(SampleFormat::S16);

    let decoder: Box<dyn Decoder> =
        Box::new(oxideav_ac4::decoder::Ac4Decoder::new(&params));
    let ctx = Ac4Context {
        decoder,
        channels: 2,
        sample_rate: 48_000,
    };
    Box::into_raw(Box::new(ctx)) as jlong
}

#[no_mangle]
pub extern "system" fn Java_com_brouken_player_ac4_Ac4Decoder_nativeDecode(
    mut env: JNIEnv,
    _class: JClass,
    context: jlong,
    compressed: JByteArray,
) -> jbyteArray {
    let result = (|| {
        let ctx = ptr_mut(context);
        let bytes = env
            .convert_byte_array(&compressed)
            .map_err(|e| format!("JNI input copy failed: {e}"))?;

        // Media3's MP4 extractor supplies a bare ISO-BMFF raw_ac4_frame sample.
        let packet = Packet::new(0, TimeBase::new(1, 48_000), bytes);
        ctx.decoder
            .send_packet(&packet)
            .map_err(|e| e.to_string())?;

        let frame = ctx.decoder.receive_frame().map_err(|e| e.to_string())?;
        let Frame::Audio(audio) = frame else {
            return Err("OxideAV returned a non-audio frame".to_string());
        };

        // SampleFormat::S16 is interleaved, so the decoder returns one PCM plane.
        let pcm = audio
            .data
            .first()
            .ok_or_else(|| "OxideAV returned no PCM plane".to_string())?;

        let array = env
            .byte_array_from_slice(pcm)
            .map_err(|e| format!("JNI output allocation failed: {e}"))?;
        Ok::<jbyteArray, String>(array.into_raw())
    })();

    match result {
        Ok(array) => array,
        Err(e) => {
            throw(&mut env, format!("OxideAV AC-4 decode failed: {e}"));
            std::ptr::null_mut()
        }
    }
}

#[no_mangle]
pub extern "system" fn Java_com_brouken_player_ac4_Ac4Decoder_nativeGetChannelCount(
    _env: JNIEnv,
    _class: JClass,
    context: jlong,
) -> jint {
    ptr_mut(context).channels as jint
}

#[no_mangle]
pub extern "system" fn Java_com_brouken_player_ac4_Ac4Decoder_nativeGetSampleRate(
    _env: JNIEnv,
    _class: JClass,
    context: jlong,
) -> jint {
    ptr_mut(context).sample_rate as jint
}

#[no_mangle]
pub extern "system" fn Java_com_brouken_player_ac4_Ac4Decoder_nativeReset(
    mut env: JNIEnv,
    _class: JClass,
    context: jlong,
) {
    let ctx = ptr_mut(context);
    if let Err(e) = ctx.decoder.reset() {
        throw(&mut env, format!("OxideAV reset failed: {e}"));
    }
}

#[no_mangle]
pub extern "system" fn Java_com_brouken_player_ac4_Ac4Decoder_nativeRelease(
    _env: JNIEnv,
    _class: JClass,
    context: jlong,
) {
    if context != 0 {
        unsafe {
            drop(Box::from_raw(context as *mut Ac4Context));
        }
    }
}
