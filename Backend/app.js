const express = require("express");
const multer = require("multer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Temporary upload folder
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer config (store image temporarily)
const upload = multer({ dest: uploadDir });

// Health check
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Image → PDF route
app.post("/convert", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No image uploaded");
  }

  const pdfPath = path.join(uploadDir, `${Date.now()}.pdf`);
  const doc = new PDFDocument();

  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  // Add image to PDF
  doc.image(req.file.path, {
    fit: [500, 700],
    align: "center",
    valign: "center",
  });

  doc.end();

  stream.on("finish", () => {
    res.download(pdfPath, "converted.pdf", () => {
      // Cleanup temp files
      fs.unlinkSync(req.file.path);
      fs.unlinkSync(pdfPath);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
