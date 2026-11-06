# QRGB Studio v2

An experimental five-color data matrix format using white, black, red, green, and blue modules. **Not compatible with standard QR scanners.**

## Run

Open `index.html` on a computer to generate and decode lossless QRGB PNGs. To use the phone camera, host the file on **HTTPS**, such as GitHub Pages, because browsers usually prohibit camera access from insecure origins. Use "Capture frame" and manually tap the code's four grid corners in this order: top-left, top-right, bottom-right, bottom-left. Select corners of the colored grid, excluding its white quiet-zone margin, then choose the grid size and decode. Camera scanning is an experimental feature.

## Capabilities

- Generate text or binary payloads in 81 × 81, 177 × 177, or 577 × 577 modules.
- Base-5 packing: 14 color modules per 4 data bytes.
- Version 2 embeds Reed–Solomon RS(255,239) parity (up to 8 corrupted bytes per 255-byte codeword), plus CRC-32 integrity verification.
- Recover bytes from exported PNG or a photo with perspective correction and calibrated color classification.
- Old version 1 PNGs remain supported for decoding.
- All processing is performed locally in the browser.

## Limitations

- Camera/photo decoding requires manual corner selection and sufficiently sharp, well-lit source images. Dense 577 × 577 codes are unlikely to scan reliably from normal smartphone photos without very high effective spatial resolution.
- RS correction is byte-level, and large perspective errors or strong blur can overwhelm it.
- The exported PNG is not a standard ISO QR code; no ordinary QR scanner can decode it.
- The format is experimental, without a finalized interoperable specification.

## Checks

Run `node test_core.cjs` to check encode/decode round trips at 81, 177, and 577 modules (including a 75,000-byte payload), plus successful correction of 1, 4, or 8 corrupted bytes and rejection of 9 errors in one codeword.

The photo/camera UI still needs field testing on physical devices.
