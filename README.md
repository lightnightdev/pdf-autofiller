# PDF Autofill Project

## Developer Notes
- A few features are currently broken due to the current transition to a chrome-extension friendly rewrite. They are primarily CSP issues; all inline HTML Alpine functions need to be pushed to the back-end.
- Needs a full testing suite
- While AI was used to help create and debug parts of this app, I am the ultimate author and reviewer of every line of code in this repository. - Joseph Chang

## Overview
The PDF Autofill Project is a browser-based tool for positioning CSV data onto a PDF template and exporting personalized, flattened documents in bulk. It is built entirely with client-side technologies (no server component required) using:

- [Alpine.js] to manage state
- [PDF.js](https://mozilla.github.io/pdf.js/) for on-screen PDF rendering
- [pdf-lib](https://pdf-lib.js.org/) plus Fontkit for editing and embedding fonts
- [Papa Parse](https://www.papaparse.com/) for CSV parsing
- [JSZip](https://stuk.github.io/jszip/) for bundling generated PDFs into a single ZIP download

## Key Features
- **Interactive placement**: Click anywhere on the PDF canvas to bind a CSV column to that location. Each column is previewed as a card showing sample values.
- **Custom fonts & sizes**: Choose between monospace, standard, and signature-style fonts with adjustable point sizes when placing text.
- **Bulk export**: Generate one flattened PDF per CSV data row. Output files are zipped with sanitized filenames that include zero-padded row numbers.
- **Automatic PDF preparation**: Uploaded PDFs are flattened (or rasterized when modifications are restricted) and sanitized to remove forms, annotations, scripts, and other embedded content before export.
- **Persistent workspace**: The last-used PDF, CSV, and marker locations are automatically saved in IndexedDB and restored on load.
- **Auto Email Integration**: Export a JSON file to be used for autopay sending via Google Sheets Apps Script.

## CSV Requirements
- The **first row** must contain headers. Header names are used for marker labels when data is missing.
- Each **subsequent row** generates one output PDF.
- Empty rows are ignored. Cells that are blank in a data row render as empty strings in the exported PDFs.
- You can use the provided `sample*.csv` files for quick testing.

## Fonts
Three custom fonts are bundled with the project (monospace, standard, and signature style). Their binary data is loaded from Base64 strings in `js/utils.js` and embedded in exported PDFs via Fontkit. If embedding fails, the code falls back to built-in Helvetica/Courier fonts. To add custom fonts, the font data needs to be entered into font_data.js. The binary data should be saved as a Base64 strings, and the font stypeascender and stypodescender need to be hard coded into `FONT_STYPOASCENDERS` and `FONT_STYPODESCENDERS`.

## Troubleshooting
- **Nothing happens when clicking the canvas**: Ensure a column card is selected first. The log sidebar will remind you if not.
- **Markers disappear after reload**: Check the browser console for IndexedDB errors. IndexedDB must be available for persistence.
- **PDF download size is large**: Locked PDFs are rasterized into images, which can produce larger files. Use editable PDFs when possible.
- **Fonts look wrong in the output**: Verify that Fontkit loads (network access required for the CDN scripts). If custom fonts fail to embed, the fallback fonts will be used.

## Development Notes
- The app uses plain ES5/ES6 scripts loaded directly in the `.html` file. No build step is required.
- Logging goes to the left sidebar logbox and the browser console. See helper functions in `js/log.js`.
- The project intentionally avoids external dependencies beyond the CDN-hosted libraries noted above. You can self-host those libraries if offline access is required.

## License

**Copyright © 2026 Joseph Chang. All Rights Reserved.**

This project is licensed under the [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/).

### What this means:
* **Allowed:** You may view, clone, study, and run this code for personal, educational, or non-commercial research purposes.
* **Prohibited:** You may not use this code or its algorithms for commercial purposes, sell it, or redistribute it as part of a commercial product without explicit permission.

For the full license terms, see the [LICENSE](LICENSE) file in this repository.
