# Prntez — Feature Roadmap

> Features planned for future implementation. Prioritize based on user demand.

---

## Phase 1 — Shop & Customer Improvements

### 1. Print Job History & Receipts
- Customers receive email/SMS confirmation with job details and estimated time
- Shops get a full history log with filters (date, status, file type)
- Exportable as CSV/PDF

### 2. Job Queue Management
- Shops see all pending jobs in a real-time queue with priority ordering
- Drag-and-drop reordering for shop owners
- Estimated wait time shown to customers in real-time via WebSocket

### 3. Pricing Calculator
- Shops configure price per page (B&W vs Color, A4 vs A3, single/double-sided)
- Customer sees estimated cost before uploading
- Optional minimum charge setting

### 4. Customer Notifications (Push / Email)
- 'Your job is ready!' notification when status changes to done
- Powered by Firebase Cloud Messaging (push) or Nodemailer (email)
- Customer opts in during upload flow

### 5. File Format Restrictions per Shop
- Admin can restrict allowed file types per shop (e.g., PDF only, no DOCX)
- Max file size limits configurable per shop

---

## Phase 2 — Admin Power Features

### 6. Shop Approval System
- New shops go into a pending state after registration
- Admin reviews and approves/rejects with an optional reason message
- Email notification sent to shop on approval/rejection

### 7. Revenue & Usage Analytics Dashboard
- Total jobs per shop, per day/week/month
- Platform-wide stats (total files printed, total revenue estimated)
- Visualized with Chart.js or Recharts

### 8. Broadcast Announcements
- Admin sends a platform-wide message shown to all shops on login
- Supports scheduled announcements (e.g., maintenance notice)

### 9. Rate Limiting & Abuse Control
- Admin can suspend a shop account with one click
- Upload frequency limits (e.g., max 20 jobs/hour per shop)
- Automated alerts for unusual activity

---

## Phase 3 — PDF Tools Suite (Major Expansion)

> Transform Prntez into a full PDF productivity platform alongside printing.

### 10. PDF Merger
- Upload multiple PDFs, drag to reorder, merge into one
- Browser-side using pdf-lib (no server upload needed for privacy)

### 11. PDF Splitter
- Split a PDF by page range or extract individual pages
- Download split files as a ZIP

### 12. PDF Compressor
- Reduce file size before uploading for print

### 13. Image to PDF Converter
- Convert JPG/PNG images into a print-ready PDF
- Supports multi-image batch conversion

### 14. PDF to Image Converter
- Export PDF pages as PNG/JPG

### 15. Scanner Integration (Mobile PWA)
- Use device camera to scan documents
- Auto perspective correction and enhancement
- Save scan result as PDF instantly

### 16. OCR (Text Extraction)
- Extract text from scanned PDFs or images
- Powered by Tesseract.js (browser-based, free)

### 17. E-Signature
- Add a signature to a PDF before printing
- Draw, type, or upload signature image

### 18. PDF Page Organizer
- Visual drag-and-drop page arranger
- Delete, rotate, or duplicate pages

---

## Phase 4 — Mobile App

- Progressive Web App (PWA) first — works on Android & iOS from browser
- React Native app for deeper camera/scanner access
- Offline support for viewing job history

---

## Technical Notes

PDF tools in Phase 3 can run 100% in-browser using:
- pdf-lib (https://pdf-lib.js.org/) — merge, split, modify
- pdfjs-dist (https://github.com/mozilla/pdf.js) — render & convert
- Tesseract.js (https://tesseract.projectnaptha.com/) — OCR
- getUserMedia API — camera scanner (no native app needed)

This makes Prntez a 'Print + PDF Toolkit' platform — huge value add!
