# QRGB Studio v4

An experimental five-color data matrix format using white, black, red, green, and blue modules. **Not compatible with standard QR scanners.**

## Run

Open `index.html` on a computer to generate and decode lossless QRGB PNGs. To use the phone camera, host the file on **HTTPS**, such as GitHub Pages, because browsers usually prohibit camera access from insecure origins.

**Live scan (automatic):** Start camera → pick the grid size → tap **Live scan** and point at a code. The scanner finds the three colored finder patterns itself, locks onto the grid, and decodes — no tapping. Hold the code roughly upright and fill a good part of the frame with it; it retries continuously as you adjust, and vibrates on success. A torch toggle appears on devices that support it. Heavy error correction is the more forgiving level for camera scans. Manual corner selection remains available as a fallback: "Capture frame", then tap the code's four grid corners in this order: top-left, top-right, bottom-right, bottom-left (corners of the colored grid, excluding the white quiet-zone margin). Uploaded photos with manual corners also get the automatic grid refinement. Camera scanning is an experimental feature.

## Capabilities

- Generate text or binary payloads in 81 × 81, 177 × 177, 577 × 577, or 666 × 666 modules (666 × 666 holds 118,528 bytes ≈ 115.8 KiB — above even the v1 no-error-correction maximum of 95,048 bytes at 577).
- Base-5 packing: 14 color modules per 4 data bytes.
- Version 2 embeds Reed–Solomon RS(255,239) parity (up to 8 corrupted bytes per 255-byte codeword), plus CRC-32 integrity verification.
- Version 3 stores the original filename (up to 255 bytes, extension preserved when truncating) between the header and the payload, inside the same error correction — recovered files download under their real name instead of `qrgb-recovered.bin`. Text payloads are stored as `message.txt`.
- Version 4 adds a selectable **Heavy** error-correction level: RS(255,127) — half of every 255-byte block is parity, correcting up to 64 corrupted bytes per block (vs 8 for Standard). The level is flagged in the header and the reader detects it automatically. Cost: about half the capacity (at 666 × 666, Heavy holds 62,976 bytes vs 118,528 for Standard), so a 91.4 KiB file needs Standard at 666, or Heavy at a smaller file size.
- Recover bytes from an exported PNG, a live camera scan, or a photo: the reader auto-detects the finder patterns, fits the perspective warp to sub-module accuracy (finder cross-section matching, then a whole-grid lock scored by classification confidence, known finder digits, and Reed–Solomon correction margin), and classifies colors against references calibrated from the finders in the same image.
- Version 1, 2, and 3 PNGs remain supported for decoding. (The reverse is not true: older readers reject newer codes.)
- All processing is performed locally in the browser.

## Limitations

- Live scan works at 81 × 81 and 177 × 177 in testing; the code must be roughly upright in the frame (strong roll/keystone poses are refused rather than misread — the scanner keeps retrying as you align). Dense 577 × 577 and 666 × 666 codes put only ~1–2 px on each module in a phone frame and are not realistically scannable — decode those from the exported PNG.
- RS correction is byte-level, and large perspective errors or strong blur can overwhelm it.
- The exported PNG is not a standard ISO QR code; no ordinary QR scanner can decode it.
- The format is experimental, without a finalized interoperable specification.

## Checks

Run `node test_core.cjs` to check encode/decode round trips at 81, 177, and 577 modules (including a 75,000-byte payload), successful correction of 1, 4, or 8 corrupted bytes and rejection of 9 errors in one codeword, v3 filename round trips (including the 255-byte cap with extension preserved), a 93,594-byte (91.4 KiB) payload round trip at 666 × 666, and v4 Heavy correction limits (64 corrupted bytes per block corrected, 65 rejected) plus end-to-end digit-damage recovery at both levels. The suite also renders synthetic camera photos (perspective warp, shading, white-balance shift, sensor noise, blur) and verifies the full auto-detect → refine → decode pipeline end to end at 81 × 81 (Heavy) and 177 × 177 (Heavy and Standard), plus detection refusal on a blank frame and on an extreme pose.

Live scanning is verified against those synthetic photos; real phone optics (lens distortion, moiré, rolling shutter, autofocus hunting) still need field testing on physical devices.
