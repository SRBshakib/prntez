import React, { useState, useEffect, useRef } from 'react';
import {
  X, Printer, ChevronLeft, ChevronRight, Loader2, FileText, Image as ImageIcon,
  ZoomIn, ZoomOut, Maximize2, Download
} from 'lucide-react';

// Subcomponent: Individual PDF Page Canvas for Continuous Multi-Page Scrolling
function PdfPageItem({ pdf, pageNum, scale }) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    let isMounted = true;

    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch (_) {}
    }

    setRendering(true);
    pdf.getPage(pageNum).then((page) => {
      if (!isMounted || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const pixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: scale * pixelRatio });

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.style.height = `${viewport.height / pixelRatio}px`;
      canvas.style.width = `${viewport.width / pixelRatio}px`;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;

      task.promise
        .then(() => {
          if (isMounted) setRendering(false);
        })
        .catch((err) => {
          if (err?.name !== 'RenderingCancelledException') {
            console.warn(`Page ${pageNum} render error:`, err);
          }
          if (isMounted) setRendering(false);
        });
    });

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch (_) {}
      }
    };
  }, [pdf, pageNum, scale]);

  return (
    <div
      id={`pdf-page-${pageNum}`}
      data-page={pageNum}
      className="bg-white rounded-xl shadow-lg p-2.5 sm:p-3 border border-slate-200 transition-all shrink-0 flex flex-col items-center relative"
    >
      <canvas ref={canvasRef} className="rounded shadow-2xs" />
      <div className="w-full flex items-center justify-between text-[11px] text-slate-400 font-semibold px-2 pt-2 border-t border-slate-100 mt-2">
        <span>Page {pageNum} of {pdf?.numPages || 1}</span>
        {rendering && <span className="text-blue-500 animate-pulse text-[10px]">Rendering...</span>}
      </div>
    </div>
  );
}

export default function PrintModal({ file, job, preview, onClose, onPrint }) {
  const activeFile = file || preview?.file;
  const activeJob = job || preview?.job;

  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0); // Default to 100%
  const [useNativeViewer, setUseNativeViewer] = useState(false);

  const pdfDocRef = useRef(null);
  const containerRef = useRef(null);

  const fileName = activeFile?.original_name || '';
  const fileExt = fileName.split('.').pop().toLowerCase();
  const isPdf = fileExt === 'pdf' || (activeFile?.file_type || '').toLowerCase() === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt);
  const isDocx = ['docx', 'doc'].includes(fileExt);
  const fileUrl = activeFile?.id ? `/api/jobs/serve/${activeFile.id}` : null;
  const docxContainerRef = useRef(null);

  // 1. Initial Load of PDF / DOCX Document
  useEffect(() => {
    if (!activeFile || !fileUrl) return;

    let isMounted = true;
    setLoading(true);
    setPageNumber(1);

    if (isDocx) {
      fetch(fileUrl)
        .then(res => res.arrayBuffer())
        .then(async (buffer) => {
          if (!isMounted) return;
          try {
            const { renderAsync } = await import('docx-preview');
            if (docxContainerRef.current) {
              docxContainerRef.current.innerHTML = '';
              await renderAsync(buffer, docxContainerRef.current, null, {
                className: 'docx-preview-content',
                inWrapper: false
              });
            }
          } catch (e) {
            try {
              const mammoth = await import('mammoth');
              const res = await mammoth.convertToHtml({ arrayBuffer: buffer });
              if (docxContainerRef.current) {
                docxContainerRef.current.innerHTML = res.value;
              }
            } catch (mErr) {
              console.warn('DOCX preview failed:', mErr);
            }
          } finally {
            if (isMounted) setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
      return () => { isMounted = false; };
    }

    if (isPdf && !useNativeViewer) {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        window.pdfjsLib
          .getDocument(fileUrl)
          .promise.then((pdf) => {
            if (!isMounted) return;
            pdfDocRef.current = pdf;
            setNumPages(pdf.numPages);
            setLoading(false);
          })
          .catch((err) => {
            console.warn('PDF.js parse failed, falling back to browser viewer:', err);
            if (isMounted) {
              setUseNativeViewer(true);
              setLoading(false);
            }
          });
      } else {
        setUseNativeViewer(true);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
      pdfDocRef.current = null;
    };
  }, [activeFile, useNativeViewer, isDocx]);

  // Track active page as user scrolls through pages
  const handleScroll = () => {
    if (!containerRef.current || numPages <= 1) return;
    const containerTop = containerRef.current.getBoundingClientRect().top;
    for (let i = 1; i <= numPages; i++) {
      const el = document.getElementById(`pdf-page-${i}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > containerTop + 80) {
          setPageNumber(i);
          break;
        }
      }
    }
  };

  // Scroll directly to a specific page
  const scrollToPage = (targetPage) => {
    const clamped = Math.max(1, Math.min(numPages, targetPage));
    setPageNumber(clamped);
    const targetEl = document.getElementById(`pdf-page-${clamped}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Fit to Width Handler
  const handleFitWidth = () => {
    if (!containerRef.current || !pdfDocRef.current) {
      setScale(1.0);
      return;
    }
    pdfDocRef.current.getPage(1).then((page) => {
      const containerWidth = containerRef.current.clientWidth - 56; // padding
      const unscaledViewport = page.getViewport({ scale: 1 });
      const fitScale = Math.max(0.5, Math.min(2.0, containerWidth / unscaledViewport.width));
      setScale(parseFloat(fitScale.toFixed(2)));
    });
  };

  if (!activeFile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl flex flex-col w-full max-w-5xl h-[90vh] max-h-[850px] overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600 shrink-0">
              {isPdf ? <FileText className="w-5 h-5 text-red-500" /> : <ImageIcon className="w-5 h-5 text-blue-500" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight truncate max-w-md">
                {activeFile.original_name}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {activeJob ? `Order #${activeJob.job_code} · ` : ''}
                {activeFile.copies || 1}x copy · {(activeFile.color_mode || 'bw').toUpperCase()} · {activeFile.paper_size || 'A4'} · {activeFile.sides || 'single'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Controls */}
            {isPdf && !useNativeViewer && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setScale((s) => Math.max(0.5, parseFloat((s - 0.15).toFixed(2))))}
                  className="p-1 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleFitWidth}
                  className="px-1.5 font-mono text-[11px] font-bold text-slate-700 hover:text-blue-600 transition"
                  title="Click to Fit Width"
                >
                  {Math.round(scale * 100)}%
                </button>
                <button
                  onClick={() => setScale((s) => Math.min(2.5, parseFloat((s + 0.15).toFixed(2))))}
                  className="p-1 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Print Action Button */}
            <button
              onClick={() => onPrint && onPrint(activeFile, activeJob)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition font-bold"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-auto bg-slate-100/80 p-4 sm:p-6 flex flex-col items-center justify-start min-h-[350px] relative custom-scrollbar scroll-smooth"
        >
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/90 z-10 gap-2 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-xs font-semibold">Loading document...</span>
            </div>
          )}

          {/* 1. PDF Continuous Multi-Page Canvas Viewer */}
          {isPdf && !useNativeViewer && pdfDocRef.current && (
            <div className="w-full flex flex-col items-center gap-6 py-4 pb-24">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pNum) => (
                <PdfPageItem
                  key={pNum}
                  pdf={pdfDocRef.current}
                  pageNum={pNum}
                  scale={scale}
                />
              ))}
            </div>
          )}

          {/* 2. PDF Native Browser Fallback */}
          {isPdf && useNativeViewer && !loading && (
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=0`}
              className="w-full h-full rounded-xl border border-slate-200 shadow-md bg-white min-h-[500px]"
              title="PDF Preview"
            />
          )}

          {/* 3. Image Viewer */}
          {!loading && isImage && (
            <div className="max-h-full max-w-full flex items-center justify-center p-2 my-auto">
              <img
                src={fileUrl}
                alt={activeFile.original_name}
                style={{ transform: `scale(${scale})` }}
                className="max-h-[65vh] max-w-full rounded-xl shadow-lg border border-slate-200 object-contain transition-transform duration-100"
              />
            </div>
          )}

          {/* 3.5 Word Document Live Preview */}
          {!loading && isDocx && (
            <div className="w-full bg-white rounded-xl shadow-lg p-6 sm:p-10 border border-slate-200 overflow-auto my-auto max-w-4xl max-h-[75vh]">
              <div ref={docxContainerRef} className="text-slate-800" />
            </div>
          )}

          {/* 4. Other Non-PDF / Non-Image Fallback */}
          {!loading && !isPdf && !isImage && !isDocx && (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center max-w-md space-y-4 my-auto">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{activeFile.original_name}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Document format preview not supported directly.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <a
                  href={fileUrl}
                  download={activeFile.original_name}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Download File
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / PDF Page Navigation */}
        {isPdf && !useNativeViewer && numPages > 1 && (
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-200 bg-white shrink-0">
            <span className="text-xs text-slate-500 font-medium">
              Page <strong className="text-slate-800">{pageNumber}</strong> of {numPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollToPage(pageNumber - 1)}
                disabled={pageNumber <= 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollToPage(pageNumber + 1)}
                disabled={pageNumber >= numPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
