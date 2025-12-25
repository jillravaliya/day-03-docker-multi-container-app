import React from "react";

function App() {
  const convertToPDF = async () => {
    try {
      const response = await fetch("http://backend:3000/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: "https://via.placeholder.com/300"
        }),
      });

      if (!response.ok) {
        throw new Error("Backend failed");
      }

      // IMPORTANT PART (this is what you were missing)
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("PDF conversion failed:", err);
      alert("PDF generation failed");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Image → PDF Converter</h1>
      <button onClick={convertToPDF}>
        Convert Image to PDF
      </button>
    </div>
  );
}

export default App;