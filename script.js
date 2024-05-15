async function splitPdf() {
    const input = document.getElementById('pdfInput');
    const container = document.getElementById('canvas-container');
    container.innerHTML = ''; // Clear existing content

    if (!input.files.length) {
        alert("Please select a PDF file.");
        return;
    }

    const pdfFile = input.files[0];
    const loadingTask = pdfjsLib.getDocument(URL.createObjectURL(pdfFile));
    const pdf = await loadingTask.promise;

    const newPdfDoc = await PDFLib.PDFDocument.create();  // Create a new PDF document

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const scale = 2;  // Increase scale for better resolution
        const viewport = page.getViewport({ scale: 1 });
        const canvasFactor = 2;  // Increase for higher resolution on canvas

        const quarters = [
            { x: 0, y: 0 },
            { x: viewport.width / 2, y: 0 },
            { x: 0, y: viewport.height / 2 },
            { x: viewport.width / 2, y: viewport.height / 2 }
        ];

        for (const quarter of quarters) {
            const quarterViewport = page.getViewport({ scale: scale, offsetX: -quarter.x, offsetY: -quarter.y });
            const canvas = document.createElement('canvas');
            canvas.width = quarterViewport.width * canvasFactor;
            canvas.height = quarterViewport.height * canvasFactor;
            container.appendChild(canvas); // Ensure canvases are added to container
            const ctx = canvas.getContext('2d');
            ctx.scale(canvasFactor, canvasFactor);  // Scale context to increase resolution

            await page.render({ canvasContext: ctx, viewport: quarterViewport }).promise;

            const dataUrl = canvas.toDataURL('image/png');
            const quarterImage = await newPdfDoc.embedPng(dataUrl);
            const quarterPage = newPdfDoc.addPage([quarterImage.width, quarterImage.height]);
            quarterPage.drawImage(quarterImage, { x: 0, y: 0, width: quarterImage.width, height: quarterImage.height });
        }
    }

    const pdfBytes = await newPdfDoc.save();
    download(pdfBytes, "new-split-pdf.pdf", "application/pdf");
}

function download(pdfBytes, filename, mimeType) {
    const blob = new Blob([pdfBytes], { type: mimeType });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
}
