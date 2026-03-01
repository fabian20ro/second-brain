import { renderPdf } from "./pdf-viewer.js";

const form = document.getElementById("pdf-form");
const urlInput = document.getElementById("pdf-url");
const status = document.getElementById("status");
const viewer = document.getElementById("pdf-viewer");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const url = urlInput.value.trim();
  if (!url) return;

  viewer.innerHTML = "";
  status.className = "";
  status.textContent = "Loading PDF...";

  try {
    await renderPdf(url, viewer);
    status.textContent = "";
  } catch (err) {
    status.className = "error";
    status.textContent = `Failed to load PDF: ${err.message}`;
    console.error(err);
  }
});
