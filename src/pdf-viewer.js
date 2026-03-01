import * as pdfjsLib from "pdfjs-dist";

// ---------------------------------------------------------------
// ROOT CAUSE FIX: configure the PDF.js worker source.
//
// PDF.js offloads heavy parsing to a Web Worker. If the worker
// file cannot be located at runtime the library throws:
//
//   "could not load pdf support. the vendor file may be missing."
//
// The fix is to explicitly set `GlobalWorkerOptions.workerSrc`
// to a URL that resolves to the worker bundle.
//
// Using Vite's `?url` import suffix gives us a hashed, cache-
// friendly URL that is guaranteed to exist after the build.
// ---------------------------------------------------------------
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Fetch a PDF from `url` and render every page as a <canvas>
 * appended to `container`.
 */
export async function renderPdf(url, container) {
  const pdf = await pdfjsLib.getDocument({ url, withCredentials: false })
    .promise;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 1.5;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    container.appendChild(canvas);

    await page.render({
      canvasContext: canvas.getContext("2d"),
      viewport,
    }).promise;
  }
}
