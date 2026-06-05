// pdfjs-dist v5 is ESM-only; expose on window for the CJS renderer bundle.
import * as pdfjsLib from "./pdf.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdf.worker.mjs";
window.pdfjsLib = pdfjsLib;
window.dispatchEvent(new Event("pdfjs-ready"));
