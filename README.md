# QRGB Studio

Encode text or any file into a five-color matrix — **white, black, red, green, blue** — then decode the PNG back to the original bytes. Single self-contained HTML file, everything runs in the browser, offline.

**Open `index.html` in any browser to use it.** No build step, no dependencies.

## The QRGB format (v1)

- Every data module is one of five symbols (base 5). Each group of **14 modules stores 4 bytes** (5¹⁴ > 2³²).
- Three finder markers identify the corners, each with a distinct RGB center (red, green, blue) so orientation is unambiguous.
- A 16-byte header stores the magic `QRGB`, format version, content length, and a CRC-32 checksum. The reader verifies the checksum before accepting recovered data.
- Grid sizes: 81 × 81, 177 × 177 (QR-sized), and 577 × 577 (~75 KB payload).

## Limitations

- This is a **new format, not a standard QR code** — ordinary phone QR readers cannot scan it.
- **No forward error correction yet.** Decoding requires the original lossless PNG at exact dimensions; camera photos, screenshots with borders, and scaled/compressed images won't read.
- Camera/print scanning will need calibration, perspective correction, and error correction — future work.

## Status

Prototype v1. Generator and reader are both in `index.html`.
