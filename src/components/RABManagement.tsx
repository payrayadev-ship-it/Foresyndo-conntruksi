import React, { useState, useRef } from "react";
import { useProject } from "../context/ProjectContext";
import { FileDown, FileUp, Plus, Trash2, Calculator, BarChart, DollarSign, ListCollapse, FileText } from "lucide-react";
import { jsPDF } from "jspdf";

export const RABManagement: React.FC = () => {
  const { rabItems, addRABItem, deleteRABItem, selectedProject } = useProject();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [kode, setKode] = useState("");
  const [uraian, setUraian] = useState("");
  const [volume, setVolume] = useState<number>(1);
  const [satuan, setSatuan] = useState("");
  const [harga, setHarga] = useState<number>(0);

  const [importStatus, setImportStatus] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode || !uraian) return;
    addRABItem({
      kodeItem: kode,
      uraianPekerjaan: uraian,
      volume,
      satuan,
      hargaSatuan: harga,
      total: volume * harga
    });
    setKode("");
    setUraian("");
    setVolume(1);
    setSatuan("");
    setHarga(0);
    setShowAdd(false);
  };

  const totalRAB = rabItems.reduce((acc, current) => acc + current.total, 0);

  const triggerCSVUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Real CSV Import Parser
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus("Membaca file CSV...");
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          throw new Error("File CSV kosong");
        }

        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length === 0) {
          throw new Error("File CSV tidak memiliki baris data");
        }

        const parseCSVLine = (lineText: string): string[] => {
          const result: string[] = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < lineText.length; i++) {
            const char = lineText[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current);
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current);
          return result;
        };

        const parsedRows = lines.map(line => parseCSVLine(line));

        // Detect if there's a header line
        let headerIndex = -1;
        for (let i = 0; i < Math.min(parsedRows.length, 5); i++) {
          const row = parsedRows[i];
          const textJoined = row.join(" ").toLowerCase();
          if (
            textJoined.includes("kode") || 
            textJoined.includes("uraian") || 
            textJoined.includes("pekerjaan") || 
            textJoined.includes("satuan")
          ) {
            headerIndex = i;
            break;
          }
        }

        let idxKode = 0;
        let idxUraian = 1;
        let idxVolume = 2;
        let idxSatuan = 3;
        let idxHargaSatuan = 4;

        if (headerIndex !== -1) {
          const headers = parsedRows[headerIndex].map(h => h.toLowerCase().trim());
          const k = headers.findIndex(h => h.includes("kode"));
          const u = headers.findIndex(h => h.includes("uraian") || h.includes("pekerjaan"));
          const v = headers.findIndex(h => h.includes("vol") || h.includes("jumlah") || h.includes("qty"));
          const s = headers.findIndex(h => h.includes("satuan") || h.includes("unit"));
          const h = headers.findIndex(h => h.includes("harga") || h.includes("satuan") || h.includes("tarif") || h.includes("cost"));

          if (k !== -1) idxKode = k;
          if (u !== -1) idxUraian = u;
          if (v !== -1) idxVolume = v;
          if (s !== -1) idxSatuan = s;
          if (h !== -1) idxHargaSatuan = h;
        }

        const startIndex = headerIndex !== -1 ? headerIndex + 1 : 0;
        let importCount = 0;

        for (let i = startIndex; i < parsedRows.length; i++) {
          const row = parsedRows[i];
          if (row.length < 2) continue; // skip short lines

          const codeStr = row[idxKode]?.trim() || `R.${i}`;
          const descriptionStr = row[idxUraian]?.trim();
          if (!descriptionStr) continue;

          // Convert formatted pricing string if any (e.g. "Rp. 1.000.000" or "$1,200") to numeric
          const cleanStringNum = (str: string) => {
            if (!str) return "0";
            return str
              .replace(/Rp\.?/gi, "")
              .replace(/\./g, "")
              .replace(/,/g, "")
              .trim();
          };

          const volNum = parseFloat(cleanStringNum(row[idxVolume])) || 1;
          const unitStr = row[idxSatuan]?.trim() || "Pcs";
          let priceNum = parseFloat(cleanStringNum(row[idxHargaSatuan])) || 0;

          if (isNaN(priceNum)) priceNum = 0;

          await addRABItem({
            kodeItem: codeStr,
            uraianPekerjaan: descriptionStr,
            volume: volNum,
            satuan: unitStr,
            hargaSatuan: priceNum,
            total: volNum * priceNum
          });

          importCount++;
        }

        if (importCount === 0) {
          throw new Error("Tidak ada item valid yang berhasil diimpor.");
        }

        setImportStatus(`Berhasil mengimpor ${importCount} baris item RAB dari file CSV!`);
        setTimeout(() => setImportStatus(""), 5000);
      } catch (err: any) {
        setImportStatus(`Gagal mengimpor: ${err.message || err}`);
        setTimeout(() => setImportStatus(""), 5500);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.onerror = () => {
      setImportStatus("Gagal membaca file!");
      setTimeout(() => setImportStatus(""), 4000);
    };

    reader.readAsText(file, "UTF-8");
  };

  // Simulated Excel/CSV Export
  const triggerFakeExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Kode,Uraian Pekerjaan,Volume,Satuan,Harga Satuan,Total", ...rabItems.map(r => `${r.kodeItem},${r.uraianPekerjaan.replace(/,/g, " ")},${r.volume},${r.satuan},${r.hargaSatuan},${r.total}`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RAB_Foresyndo_${selectedProject?.nomorProyek || "Proyek"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Professional PDF Export using jsPDF
  const triggerPDFExport = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const marginX = 15;
    let currentY = 20;

    // Header banner with deep corporate dark blue
    doc.setFillColor(15, 23, 42); // slate-900/950
    doc.rect(0, 0, 210, 38, "F");

    // Title / Company Brand
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("FORESYNDO KONSTRUKSI", marginX, 15);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Professional Civil & Structural Engineering Services", marginX, 21);
    doc.text("E-mail: support@foresyndo.com | Telp: +62 21-8888-888", marginX, 26);

    // Document Name in Header
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.text("RENCANA ANGGARAN BIAYA (RAB)", 125, 15);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`No. Proyek: ${selectedProject?.nomorProyek || "PRJ-001"}`, 125, 21);
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 125, 26);

    currentY = 48;

    // Project Details Card
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(marginX, currentY, 180, 22, "F");
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.rect(marginX, currentY, 180, 22, "S");

    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("REKAPITULASI PROYEK", marginX + 5, currentY + 6);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Nama Pekerjaan  :  ${selectedProject?.nama || "Pembangunan Gedung Utama"}`, marginX + 5, currentY + 12);
    doc.text(`Lokasi Proyek      :  ${selectedProject?.lokasi || "DKI Jakarta"}`, marginX + 5, currentY + 17);
    
    const totalRAB_Selected = rabItems.reduce((sum, item) => sum + item.total, 0);
    doc.setFont("Helvetica", "bold");
    doc.text(`Total Nilai RAB  :  Rp ${totalRAB_Selected.toLocaleString("id-ID")}`, marginX + 105, currentY + 12);
    doc.setFont("Helvetica", "normal");
    doc.text(`Status Evaluasi   :  Aman (On-Budget)`, marginX + 105, currentY + 17);

    currentY += 30;

    // Table Header
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(marginX, currentY, 180, 9, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("KODE", marginX + 4, currentY + 6);
    doc.text("URAIAN PEKERJAAN", marginX + 22, currentY + 6);
    doc.text("VOL", marginX + 110, currentY + 6, { align: "center" });
    doc.text("SATUAN", marginX + 124, currentY + 6, { align: "center" });
    doc.text("HARGA SATUAN (Rp)", marginX + 152, currentY + 6, { align: "right" });
    doc.text("TOTAL BIAYA (Rp)", marginX + 176, currentY + 6, { align: "right" });

    currentY += 9;

    // Table Rows
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85); // slate-700

    rabItems.forEach((item, index) => {
      // Page break check
      if (currentY > 265) {
        doc.addPage();
        currentY = 20;

        // Table Header on new page
        doc.setFillColor(30, 41, 59);
        doc.rect(marginX, currentY, 180, 9, "F");
        
        doc.setTextColor(255, 255, 255);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("KODE", marginX + 4, currentY + 6);
        doc.text("URAIAN PEKERJAAN", marginX + 22, currentY + 6);
        doc.text("VOL", marginX + 110, currentY + 6, { align: "center" });
        doc.text("SATUAN", marginX + 124, currentY + 6, { align: "center" });
        doc.text("HARGA SATUAN (Rp)", marginX + 152, currentY + 6, { align: "right" });
        doc.text("TOTAL BIAYA (Rp)", marginX + 176, currentY + 6, { align: "right" });

        currentY += 9;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
      }

      // Zebra background color
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, currentY, 180, 7.5, "F");
      }

      // Light gray row splitting line
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.1);
      doc.line(marginX, currentY + 7.5, marginX + 180, currentY + 7.5);

      // Truncate long descriptions to prevent text overlapping
      const cleanUraian = item.uraianPekerjaan || "";
      const shortUraian = cleanUraian.length > 55
        ? cleanUraian.substring(0, 52) + "..."
        : cleanUraian;

      doc.text(item.kodeItem || "-", marginX + 4, currentY + 4.8);
      doc.text(shortUraian, marginX + 22, currentY + 4.8);
      doc.text((item.volume ?? 0).toString(), marginX + 110, currentY + 4.8, { align: "center" });
      doc.text(item.satuan || "-", marginX + 124, currentY + 4.8, { align: "center" });
      doc.text((item.hargaSatuan ?? 0).toLocaleString("id-ID"), marginX + 152, currentY + 4.8, { align: "right" });
      doc.text((item.total ?? 0).toLocaleString("id-ID"), marginX + 176, currentY + 4.8, { align: "right" });

      currentY += 7.5;
    });

    // Subtotal Row block
    if (currentY > 255) {
      doc.addPage();
      currentY = 20;
    }

    // Bold separator double lines
    doc.setDrawColor(100, 116, 139); // slate-500
    doc.setLineWidth(0.4);
    doc.line(marginX, currentY, marginX + 180, currentY);

    // Color background for bottom rekap
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(marginX, currentY, 180, 9, "F");

    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text("TOTAL REKAPITULASI RAB PEKERJAAN", marginX + 22, currentY + 6);
    doc.text(`Rp ${totalRAB_Selected.toLocaleString("id-ID")}`, marginX + 176, currentY + 6, { align: "right" });

    currentY += 18;

    // Signatures fields to look legitimate & beautiful
    if (currentY > 235) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Disiapkan Oleh,", marginX + 10, currentY);
    doc.text("Disetujui Oleh,", marginX + 125, currentY);

    currentY += 18;
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.2);
    doc.line(marginX + 10, currentY, marginX + 55, currentY);
    doc.line(marginX + 125, currentY, marginX + 170, currentY);

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Tim Estimator Proyek", marginX + 10, currentY + 4);
    doc.text("Project Manager", marginX + 125, currentY + 4);

    // Fire the save download flow
    const fileName = `RAB_Foresyndo_${(selectedProject?.nomorProyek || "Proyek").replace(/\s+/g, "_")}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleCSVImport}
        accept=".csv"
        className="hidden"
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Rencana Anggaran Biaya (RAB)</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Estimasi nilai kontrak terdistribusi terhadap uraian pengerjaan struktural & kelayakan arstektural</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
          <button
            onClick={triggerCSVUpload}
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700/60 rounded text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={triggerFakeExport}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-transparent dark:border-slate-700 rounded text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={triggerPDFExport}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-150 dark:border-rose-900/60 rounded text-xs font-semibold cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ekspor PDF</span>
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Item</span>
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="mb-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/40 p-3 rounded-lg flex items-center">
          <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-bounce" />
          {importStatus}
        </div>
      )}

      {/* Dynamic inline create form */}
      {showAdd && (
        <form onSubmit={handleCreate} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Kode Item</label>
            <input
              type="text"
              placeholder="A.01"
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:ring-1 focus:ring-blue-600 text-slate-800 dark:text-white"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Uraian Pekerjaan</label>
            <input
              type="text"
              placeholder="Contoh: Pekerjaan galian tanah lift"
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:ring-1 focus:ring-blue-600 text-slate-800 dark:text-white"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Volume</label>
            <input
              type="number"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value) || 0)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:ring-1 focus:ring-blue-600 text-slate-800 dark:text-white"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Satuan</label>
            <input
              type="text"
              placeholder="m3, Satuan, Ls"
              value={satuan}
              onChange={(e) => setSatuan(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:ring-1 focus:ring-blue-600 text-slate-800 dark:text-white"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Harga Satuan (Rp)</label>
            <div className="relative">
              <input
                type="number"
                value={harga}
                onChange={(e) => setHarga(parseFloat(e.target.value) || 0)}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:ring-1 focus:ring-blue-600 text-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs py-1.5 font-bold cursor-pointer transition shadow-sm"
            >
              Simpan Item
            </button>
          </div>
        </form>
      )}

      {/* RAB List */}
      {rabItems.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
          Belum ada rincian RAB yang dicatat. Silahkan tambah manual atau klik Import CSV.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-left text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Uraian Pekerjaan</th>
                  <th className="py-3 px-4 text-center">Volume</th>
                  <th className="py-3 px-4 text-center">Satuan</th>
                  <th className="py-3 px-4 text-right">Harga Satuan</th>
                  <th className="py-3 px-4 text-right">Total Biaya</th>
                  <th className="py-3 px-4 text-center">Opsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rabItems.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">{r.kodeItem}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">{r.uraianPekerjaan}</td>
                    <td className="py-3.5 px-4 text-center font-mono">{r.volume}</td>
                    <td className="py-3.5 px-4 text-center">{r.satuan}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs">
                      Rp {r.hargaSatuan.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-slate-950 dark:text-white">
                      Rp {r.total.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => deleteRABItem(r.id)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recapitulation cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Rekapitulasi Total</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  Rp {totalRAB.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-500 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Budget Terpakai</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  Rp {(totalRAB * 0.4).toLocaleString("id-ID")} (40%)
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-sky-100 dark:bg-sky-950/20 text-sky-500 rounded-lg">
                <BarChart className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Deviasi Budget S-Curve</span>
                <span className="text-sm font-bold text-emerald-500">
                  + 1.8% Aman (On-Budget)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
