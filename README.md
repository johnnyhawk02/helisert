# Helisert 5.0

An ambient buffer looper that runs in the browser (Web Audio API + AudioWorklet).

Capture from the microphone, load an audio file or start from the built-in demo pad, then loop it with variable speed (⅛× to 8×), reverse, crossfaded loop points, tape-style speed glide (Skid), overdub, reverb (Space) and a low-pass Tone control. Record Output saves what you hear as a .webm file.

Shortcuts: Space play/stop · T trigger · C capture · R reverse · S skid.

## Run locally

    npx wrangler dev        # or: cd public && python3 -m http.server 8000

The microphone needs localhost or HTTPS.

## Deploy to Cloudflare

    npx wrangler deploy

This publishes `public/` as static assets on a Cloudflare Worker named `helisert` (see `wrangler.jsonc`).

## Files

- `public/index.html`: page shell
- `public/helisert.js`: UI and audio engine (the DSP worklet is inlined)
- `public/helisert-worklet.js`: standalone copy of the worklet, used as a fallback loader
