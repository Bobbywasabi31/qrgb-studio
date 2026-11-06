# QRGB Studio v3

An experimental five-color data matrix format using white, black, red, green, and blue modules. **Not compatible with standard QR scanners.**

## Run

Open `index.html` on a computer to generate and decode lossless QRGB PNGs. To use the phone camera, host the file on **HTTPS**, such as GitHub Pages, because browsers usually prohibit camera access from insecure origins. Use "Capture frame" and manually tap the code's four grid corners in this order: top-left, top-right, bottom-right, bottom-left. Select corners of the colored grid, excluding its white quiet-zone margin, then choose the grid size and decode. Camera scanning is an experimental feature.

## Capabilities

- Generate text or binary payloads in 81 × 81, 177 × 177, 577 × 577, or 666 × 666 modules (666 × 666 holds 118,528 bytes ≈ 115.8 KiB — above even the v1 no-error-correction maximum of 95,048 bytes at 577).
- Base-5 packing: 14 color modules per 4 data bytes.
- Version 2 embeds Reed–Solomon RS(255,239) parity (up to 8 corrupted bytes per 255-byte codeword), plus CRC-32 integrity verification.
- Version 3 stores the original filename (up to 255 bytes, extension preserved when truncating) between the header and the payload, inside the same error correction — recovered files download under their real name instead of `qrgb-recovered.bin`. Text payloads are stored as `message.txt`.
- Recover bytes from exported PNG or a photo with perspective correction and calibrated color classification.
- Version 1 and 2 PNGs remain supported for decoding. (The reverse is not true: a v2 reader rejects v3 codes.)
- All processing is performed locally in the browser.

## Limitations

- Camera/photo decoding requires manual corner selection and sufficiently sharp, well-lit source images. Dense 577 × 577 codes are unlikely to scan reliably from normal smartphone photos without very high effective spatial resolution.
- RS correction is byte-level, and large perspective errors or strong blur can overwhelm it.
- The exported PNG is not a standard ISO QR code; no ordinary QR scanner can decode it.
- The format is experimental, without a finalized interoperable specification.

## Checks

Run `node test_core.cjs` to check encode/decode round trips at 81, 177, and 577 modules (including a 75,000-byte payload), successful correction of 1, 4, or 8 corrupted bytes and rejection of 9 errors in one codeword, v3 filename round trips (including the 255-byte cap with extension preserved), and a 93,594-byte (91.4 KiB) payload round trip at 666 × 666.

The photo/camera UI still needs field testing on physical devices.
