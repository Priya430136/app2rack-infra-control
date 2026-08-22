import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

export function exportCSV(rows: ReadonlyArray<Record<string, unknown>>, filename: string) {
  if (!rows.length) {
    toast.error("Nothing to export");
    return;
  }
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast.success("CSV downloaded", { description: filename });
}

export function exportPDF(opts: {
  title: string;
  subtitle?: string;
  rows: ReadonlyArray<Record<string, unknown>>;
  filename: string;
}) {
  const { title, subtitle, rows, filename } = opts;
  if (!rows.length) {
    toast.error("Nothing to export");
    return;
  }
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(
    `${subtitle ?? "App2Rack Infrastructure Report"} · ${new Date().toLocaleString()}`,
    40,
    58,
  );

  const headers = Object.keys(rows[0]);
  autoTable(doc, {
    startY: 80,
    head: [headers],
    body: rows.map((r) => headers.map((h) => String(r[h] ?? ""))),
    styles: { fontSize: 8, cellPadding: 6 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 40, right: 40 },
  });

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
  toast.success("PDF downloaded", { description: filename });
}
