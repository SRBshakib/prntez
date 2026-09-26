import React, { useState } from "react";
import { X, Download, FileSpreadsheet, FileText, Table2, Calendar, CheckCircle2, Clock, Printer } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// helpers
function formatDateLabel(isoStr) {
  if (!isoStr) return "";
  try {
    return new Date(isoStr).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true
    });
  } catch (_) { return isoStr; }
}

function paymentLabel(job) {
  if (job.payment_status === "paid" || job.payment_status === "paid_cash") return "Paid (Cash)";
  if (job.payment_status === "paid_bkash") return "Paid (bKash)";
  if (job.payment_status === "paid_online_pending_verify") return "Pending Verify";
  return "Unpaid";
}

function buildRows(jobs) {
  return jobs.map(j => ({
    "Job #": j.job_code || "",
    "Auth Code": j.auth_code || "",
    "Customer": j.customer_name || "Guest",
    "Phone": j.customer_phone || "",
    "Files": j.total_files || 0,
    "Pages": j.total_pages || 0,
    "Price (BDT)": parseFloat(j.total_price || 0).toFixed(2),
    "Discount (BDT)": parseFloat(j.discount_applied || 0).toFixed(2),
    "Payment": paymentLabel(j),
    "Status": (j.status || "").toUpperCase(),
    "Created": formatDateLabel(j.created_at),
    "Completed": j.completed_at ? formatDateLabel(j.completed_at) : "-",
  }));
}

function triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportCSV(jobs, filename) {
  const rows = buildRows(jobs);
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map(r => headers.map(h => `"${String(r[h]).replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename + ".csv");
}

function exportXLSX(jobs, filename, shopName, dateLabel) {
  const rows = buildRows(jobs);
  const ws = XLSX.utils.json_to_sheet(rows);
  const colWidths = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String(r[key]).length)) + 2
  }));
  ws["!cols"] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Daily Jobs");
  const totalRevenue = jobs.filter(j => j.status === "done").reduce((s, j) => s + parseFloat(j.total_price || 0), 0);
  const summaryData = [
    ["Shop", shopName || "My Shop"],
    ["Export Date", dateLabel],
    ["Total Orders", jobs.length],
    ["Done Orders", jobs.filter(j => j.status === "done").length],
    ["Pending", jobs.filter(j => j.status === "pending").length],
    ["Printing", jobs.filter(j => j.status === "printing").length],
    ["Revenue (Done only)", "Tk " + totalRevenue.toFixed(2)],
    ["Paid Orders", jobs.filter(j => j.payment_status && j.payment_status.startsWith("paid")).length],
    ["Unpaid Orders", jobs.filter(j => !j.payment_status || !j.payment_status.startsWith("paid")).length],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 22 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
  const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbOut], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  triggerDownload(blob, filename + ".xlsx");
}

function exportPDF(jobs, filename, shopName, dateLabel) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 297, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("prntez - Daily Jobs Report", 14, 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Shop: " + (shopName || "My Shop") + "   |   Date: " + dateLabel + "   |   Total Orders: " + jobs.length, 14, 19);
  const done = jobs.filter(j => j.status === "done").length;
  const revenue = jobs.filter(j => j.status === "done").reduce((s, j) => s + parseFloat(j.total_price || 0), 0);
  const pending = jobs.filter(j => j.status === "pending").length;
  const printing = jobs.filter(j => j.status === "printing").length;
  const paid = jobs.filter(j => j.payment_status && j.payment_status.startsWith("paid")).length;
  const unpaid = jobs.filter(j => !j.payment_status || !j.payment_status.startsWith("paid")).length;
  doc.setTextColor(50, 50, 50);
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 22, 297, 10, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Done: " + done + "   Pending: " + pending + "   Printing: " + printing + "   Revenue (Done): BDT " + revenue.toFixed(2) + "   Paid: " + paid + "   Unpaid: " + unpaid, 14, 28.5);
  const rows = buildRows(jobs);
  const headers = Object.keys(rows[0] || {});
  const body = rows.map(r => headers.map(h => r[h]));
  autoTable(doc, {
    head: [headers],
    body,
    startY: 34,
    styles: { fontSize: 7, cellPadding: 1.5, overflow: "linebreak" },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 18 },
      2: { cellWidth: 26 },
      3: { cellWidth: 22 },
      4: { cellWidth: 12 },
      5: { cellWidth: 12 },
      6: { cellWidth: 20 },
      7: { cellWidth: 20 },
      8: { cellWidth: 28 },
      9: { cellWidth: 18 },
      10: { cellWidth: 32 },
      11: { cellWidth: 32 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 9) {
        const val = String(data.cell.raw);
        if (val === "DONE") data.cell.styles.textColor = [5, 150, 105];
        else if (val === "PENDING") data.cell.styles.textColor = [217, 119, 6];
        else if (val === "PRINTING") data.cell.styles.textColor = [37, 99, 235];
      }
    },
    margin: { left: 10, right: 10 }
  });
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("prntez.com - Page " + i + " of " + pageCount, 148, 206, { align: "center" });
  }
  doc.save(filename + ".pdf");
}

export default function ExportJobsModal({ jobs, shop, onClose }) {
  const [selectedFormat, setSelectedFormat] = useState("xlsx");
  const [selectedScope, setSelectedScope] = useState("today");
  const [exporting, setExporting] = useState(false);

  const todayStr = new Date().toDateString();
  const todayJobs = jobs.filter(j => new Date(j.created_at).toDateString() === todayStr);
  const allJobs = jobs;
  const scopedJobs = selectedScope === "today" ? todayJobs : allJobs;
  const dateLabel = selectedScope === "today"
    ? new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : "All Loaded Records";
  const shopName = shop && shop.name ? shop.name : "My Shop";
  const baseFilename = "prntez_" + shopName.replace(/\s+/g, "_") + "_" + (selectedScope === "today" ? new Date().toISOString().slice(0, 10) : "all_jobs");

  const s = {
    total: scopedJobs.length,
    done: scopedJobs.filter(j => j.status === "done").length,
    pending: scopedJobs.filter(j => j.status === "pending").length,
    revenue: scopedJobs.filter(j => j.status === "done").reduce((acc, j) => acc + parseFloat(j.total_price || 0), 0),
  };

  const handleExport = async () => {
    if (scopedJobs.length === 0) return;
    setExporting(true);
    try {
      await new Promise(r => setTimeout(r, 80));
      if (selectedFormat === "csv") exportCSV(scopedJobs, baseFilename);
      else if (selectedFormat === "xlsx") exportXLSX(scopedJobs, baseFilename, shopName, dateLabel);
      else if (selectedFormat === "pdf") exportPDF(scopedJobs, baseFilename, shopName, dateLabel);
    } finally {
      setExporting(false);
    }
  };

  const formats = [
    { id: "xlsx", label: "Excel (.xlsx)", desc: "Spreadsheet with summary tab — ideal for accounting", icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600" />, borderActive: "border-emerald-400 bg-emerald-50", iconBgActive: "bg-emerald-100" },
    { id: "csv", label: "CSV (.csv)", desc: "Universal format — works with Google Sheets, Excel", icon: <Table2 className="w-5 h-5 text-blue-600" />, borderActive: "border-blue-400 bg-blue-50", iconBgActive: "bg-blue-100" },
    { id: "pdf", label: "PDF Report (.pdf)", desc: "Printable formatted report with shop header", icon: <FileText className="w-5 h-5 text-rose-600" />, borderActive: "border-rose-400 bg-rose-50", iconBgActive: "bg-rose-100" },
  ];

  const scopes = [
    { id: "today", label: "Today's Jobs", count: todayJobs.length, icon: <Calendar className="w-4 h-4" /> },
    { id: "all", label: "All Loaded Jobs", count: allJobs.length, icon: <Printer className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-sm">Export Jobs Report</h2>
              <p className="text-[11px] text-slate-400 font-medium">Download daily jobs as spreadsheet or PDF</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Scope */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              {scopes.map(sc => (
                <button key={sc.id} onClick={() => setSelectedScope(sc.id)}
                  className={"flex flex-col items-start gap-1 p-3 rounded-2xl border-2 transition text-left " + (selectedScope === sc.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300 bg-white")}>
                  <div className={"flex items-center gap-1.5 text-xs font-bold " + (selectedScope === sc.id ? "text-blue-700" : "text-slate-700")}>
                    {sc.icon} {sc.label}
                  </div>
                  <span className={"text-[11px] font-semibold px-2 py-0.5 rounded-full " + (selectedScope === sc.id ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500")}>
                    {sc.count} orders
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Total</p>
              <p className="text-lg font-extrabold text-slate-800">{s.total}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Done</p>
              <p className="text-lg font-extrabold text-emerald-600">{s.done}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Revenue</p>
              <p className="text-lg font-extrabold text-emerald-700">Tk {s.revenue.toFixed(0)}</p>
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">Export Format</label>
            <div className="space-y-2">
              {formats.map(f => (
                <button key={f.id} onClick={() => setSelectedFormat(f.id)}
                  className={"w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition text-left " + (selectedFormat === f.id ? f.borderActive : "border-slate-200 hover:border-slate-300 bg-white")}>
                  <div className={"w-9 h-9 rounded-xl flex items-center justify-center shrink-0 " + (selectedFormat === f.id ? f.iconBgActive : "bg-slate-100")}>
                    {f.icon}
                  </div>
                  <div className="min-w-0">
                    <p className={"text-xs font-bold " + (selectedFormat === f.id ? "text-slate-900" : "text-slate-700")}>{f.label}</p>
                    <p className="text-[11px] text-slate-400">{f.desc}</p>
                  </div>
                  {selectedFormat === f.id && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Download button */}
          <button onClick={handleExport} disabled={scopedJobs.length === 0 || exporting}
            className={"w-full py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] " + (scopedJobs.length === 0 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm")}>
            {exporting ? (<><Clock className="w-4 h-4 animate-spin" /> Generating...</>) : (<><Download className="w-4 h-4" /> Download {selectedFormat.toUpperCase()} &mdash; {s.total} Orders</>)}
          </button>
          {scopedJobs.length === 0 && <p className="text-center text-[11px] text-slate-400">No jobs found for selected scope.</p>}
        </div>
      </div>
    </div>
  );
}
