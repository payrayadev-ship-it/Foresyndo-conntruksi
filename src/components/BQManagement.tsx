import React, { useState, useEffect } from "react";
import { useProject } from "../context/ProjectContext";
import { 
  FileSpreadsheet, Plus, Trash2, Calculator, BarChart3, 
  Ruler, Wrench, RefreshCw, FileText, Download, 
  Layers, CheckCircle2, ChevronRight, Hash, Info, FileUp, Filter
} from "lucide-react";
import { jsPDF } from "jspdf";

interface BQMeasurement {
  id: string;
  description: string;
  p: number; // Panjang (m)
  l: number; // Lebar (m)
  t: number; // Tinggi (m)
  qtyMultiplier: number; // Faktor kali
  totalVolume: number;
}

interface AHSPItem {
  type: "material" | "labor" | "equipment";
  name: string;
  coefficient: number;
  unit: string;
  unitPrice: number;
}

interface BQItem {
  id: string;
  division: string;
  code: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  measurements: BQMeasurement[]; // Back-up Measurement Sheet
  ahsp: AHSPItem[]; // Analisa Harga Satuan Pekerjaan (Labor, Material, Equipment)
}

const INITIAL_BQ_DATA: Record<string, BQItem[]> = {
  "proj-001": [
    {
      id: "bq-p1-1",
      division: "DIVISI 1 - PEKERJAAN PERSIAPAN",
      code: "1.01",
      name: "Pembuatan Pagar Pengaman Sementara Seng Gelombang t = 2m",
      qty: 120,
      unit: "m1",
      unitPrice: 385000,
      total: 46200000,
      measurements: [
        { id: "m-p1", description: "Batas Utara Proyek", p: 50, l: 1, t: 1, qtyMultiplier: 1, totalVolume: 50 },
        { id: "m-p2", description: "Batas Barat Proyek", p: 70, l: 1, t: 1, qtyMultiplier: 1, totalVolume: 70 }
      ],
      ahsp: [
        { type: "material", name: "Seng Gelombang BJLS 30", coefficient: 1.2, unit: "lembar", unitPrice: 85000 },
        { type: "material", name: "Kayu Usuk 5/7 Meranti", coefficient: 0.012, unit: "m3", unitPrice: 4200000 },
        { type: "labor", name: "Pekerja Terampil", coefficient: 0.2, unit: "OH", unitPrice: 120000 },
        { type: "labor", name: "Tukang Kayu", coefficient: 0.1, unit: "OH", unitPrice: 150000 }
      ]
    },
    {
      id: "bq-p2-1",
      division: "DIVISI 2 - PEKERJAAN TANAH & PONDASI",
      code: "2.01",
      name: "Galian Tanah Pondasi Bore Pile & Pile Cap Basement",
      qty: 480,
      unit: "m3",
      unitPrice: 82500,
      total: 39600000,
      measurements: [
        { id: "m-t1", description: "Galian Pile Cap Zona A", p: 15, l: 8, t: 2.5, qtyMultiplier: 1, totalVolume: 300 },
        { id: "m-t2", description: "Galian Pondasi Tangki Lift", p: 6, l: 6, t: 2.5, qtyMultiplier: 2, totalVolume: 180 }
      ],
      ahsp: [
        { type: "labor", name: "Pekerja Gali", coefficient: 0.75, unit: "OH", unitPrice: 110000 },
        { type: "labor", name: "Mandor Pengawas", coefficient: 0.025, unit: "OH", unitPrice: 160000 }
      ]
    },
    {
      id: "bq-p3-1",
      division: "DIVISI 3 - PEKERJAAN STRUKTUR BETON",
      code: "3.01",
      name: "Beton Bertulang K-350 Struktur Kolom Utama Lantai 1",
      qty: 180,
      unit: "m3",
      unitPrice: 3250000,
      total: 585000000,
      measurements: [
        { id: "m-b1", description: "Kolom Utama K1 (600x600)", p: 0.6, l: 0.6, t: 4.2, qtyMultiplier: 80, totalVolume: 120.96 },
        { id: "m-b2", description: "Kolom Praktis KP (400x400)", p: 0.4, l: 0.4, t: 4.2, qtyMultiplier: 88, totalVolume: 59.136 }
      ],
      ahsp: [
        { type: "material", name: "Ready Mix K-350 Slump 12", coefficient: 1.02, unit: "m3", unitPrice: 1250000 },
        { type: "material", name: "Besi Beton Ulir D-19 (BJTS 40)", coefficient: 135, unit: "kg", unitPrice: 12500 },
        { type: "material", name: "Bekisting Multiplek 12mm", coefficient: 4.2, unit: "m2", unitPrice: 95000 },
        { type: "labor", name: "Pekerja Besi & Beton", coefficient: 2.5, unit: "OH", unitPrice: 120000 }
      ]
    },
    {
      id: "bq-p4-1",
      division: "DIVISI 4 - PEKERJAAN ARSITEKTURAL",
      code: "4.01",
      name: "Pasangan Dinding Bata Ringan (Hebel) tebal 10 cm",
      qty: 1560,
      unit: "m2",
      unitPrice: 145000,
      total: 226200000,
      measurements: [
        { id: "m-a1", description: "Dinding Partisi Kamar Utama", p: 18, l: 3.2, t: 1, qtyMultiplier: 12, totalVolume: 691.2 },
        { id: "m-a2", description: "Dinding Koridor Utama Sisi Kiri", p: 45, l: 3.2, t: 1, qtyMultiplier: 6, totalVolume: 864 }
      ],
      ahsp: [
        { type: "material", name: "Bata Ringan Hebel AAC 10cm", coefficient: 0.086, unit: "m3", unitPrice: 750000 },
        { type: "material", name: "Semen Mortar Perekat (Instant)", coefficient: 4.5, unit: "kg", unitPrice: 3200 },
        { type: "labor", name: "Tukang Batu", coefficient: 0.15, unit: "OH", unitPrice: 150000 },
        { type: "labor", name: "Pekerja Bantu", coefficient: 0.2, unit: "OH", unitPrice: 110000 }
      ]
    }
  ],
  "proj-002": [
    {
      id: "bq-p2-01",
      division: "DIVISI 1 - MEKANIKAL, ELEKTRIKAL & PLUMBING",
      code: "1.01",
      name: "Instalasi Pengkabelan & Daya Panel MDP 3-Phase",
      qty: 4,
      unit: "Set",
      unitPrice: 18500000,
      total: 74000000,
      measurements: [
        { id: "m-m1", description: "Gedung A Lantai 1-4", p: 1, l: 1, t: 1, qtyMultiplier: 4, totalVolume: 4 }
      ],
      ahsp: [
        { type: "material", name: "Kabel NYY 4x16mm Supreme", coefficient: 55, unit: "meter", unitPrice: 185000 },
        { type: "material", name: "Panel MDP Metal Box Kosong", coefficient: 1, unit: "unit", unitPrice: 3200000 },
        { type: "labor", name: "Spesialis Elektrikal", coefficient: 4, unit: "OH", unitPrice: 220000 }
      ]
    }
  ]
};

export const BQManagement: React.FC = () => {
  const { selectedProject, loginUser, rabItems, addRABItem } = useProject();
  const activeProjId = selectedProject?.id || "proj-001";

  const [bqList, setBqList] = useState<Record<string, BQItem[]>>(() => {
    const saved = localStorage.getItem("fos_bq_items");
    return saved ? JSON.parse(saved) : INITIAL_BQ_DATA;
  });

  const [selectedBq, setSelectedBq] = useState<string | null>(null);
  const [filterDivision, setFilterDivision] = useState<string>("ALL");

  // CSV Import & mail state variables
  const [showBqImport, setShowBqImport] = useState(false);
  const [bqImportLog, setBqImportLog] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("payrayadev@gmail.com");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStep, setEmailStep] = useState<string>("");

  // Local Form state for main BQ
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDivision, setNewDivision] = useState("DIVISI 3 - PEKERJAAN STRUKTUR BETON");
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("m3");
  const [newUnitPrice, setNewUnitPrice] = useState<number>(0);
  const [newQty, setNewQty] = useState<number>(1);

  // Local state for Backup volume calculator
  const [calcDesc, setCalcDesc] = useState("");
  const [calcP, setCalcP] = useState<number>(1);
  const [calcL, setCalcL] = useState<number>(1);
  const [calcT, setCalcT] = useState<number>(1);
  const [calcMult, setCalcMult] = useState<number>(1);

  // Local state for AHSP sub-items
  const [newAhspType, setNewAhspType] = useState<"material" | "labor" | "equipment">("material");
  const [newAhspName, setNewAhspName] = useState("");
  const [newAhspCoeff, setNewAhspCoeff] = useState<number>(0);
  const [newAhspUnit, setNewAhspUnit] = useState("");
  const [newAhspRate, setNewAhspRate] = useState<number>(0);

  // Notification success alerts
  const [alert, setAlert] = useState<{ msg: string; type: "success" | "info" } | null>(null);

  useEffect(() => {
    localStorage.setItem("fos_bq_items", JSON.stringify(bqList));
  }, [bqList]);

  const items = bqList[activeProjId] || [];

  const divisions: string[] = ["ALL", ...(Array.from(new Set(items.map(i => i.division))) as string[])];

  const totalBQ = items.reduce((sum, item) => sum + item.total, 0);

  const handleCreateBQItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;

    const newItem: BQItem = {
      id: `bq-${Date.now()}`,
      division: newDivision,
      code: newCode,
      name: newName,
      qty: newQty,
      unit: newUnit,
      unitPrice: newUnitPrice,
      total: newQty * newUnitPrice,
      measurements: [],
      ahsp: []
    };

    setBqList(prev => {
      const current = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [...current, newItem] };
    });

    setNewCode("");
    setNewName("");
    setNewUnit("m3");
    setNewQty(1);
    setNewUnitPrice(0);
    setShowAddForm(false);
    showAlert("Item Bill of Quantities (BQ) baru berhasil ditambahkan!", "success");
  };

  const handleDeleteBQItem = (id: string) => {
    if (selectedBq === id) setSelectedBq(null);
    setBqList(prev => {
      const current = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: current.filter(item => item.id !== id) };
    });
    showAlert("Item BQ berhasil dihapus dari daftar.", "info");
  };

  const showAlert = (msg: string, type: "success" | "info") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // Measurement Backup sheet triggers
  const handleAddMeasurement = (bqId: string) => {
    if (!calcDesc) return;
    const vol = Number((calcP * calcL * calcT * calcMult).toFixed(3));
    const newMeas: BQMeasurement = {
      id: `m-${Date.now()}`,
      description: calcDesc,
      p: calcP,
      l: calcL,
      t: calcT,
      qtyMultiplier: calcMult,
      totalVolume: vol
    };

    setBqList(prev => {
      const current = prev[activeProjId] || [];
      const updated = current.map(item => {
        if (item.id === bqId) {
          const arr = [...item.measurements, newMeas];
          const newQtySum = Number(arr.reduce((sum, m) => sum + m.totalVolume, 0).toFixed(3));
          return {
            ...item,
            measurements: arr,
            qty: newQtySum,
            total: Number((newQtySum * item.unitPrice).toFixed(0))
          };
        }
        return item;
      });
      return { ...prev, [activeProjId]: updated };
    });

    setCalcDesc("");
    setCalcP(1);
    setCalcL(1);
    setCalcT(1);
    setCalcMult(1);
    showAlert("Backup Volume terhitung & otomatis disinkronkan ke Qty utama BQ!", "success");
  };

  const handleDeleteMeasurement = (bqId: string, measId: string) => {
    setBqList(prev => {
      const current = prev[activeProjId] || [];
      const updated = current.map(item => {
        if (item.id === bqId) {
          const arr = item.measurements.filter(m => m.id !== measId);
          const newQtySum = arr.length > 0 
            ? Number(arr.reduce((sum, m) => sum + m.totalVolume, 0).toFixed(3))
            : item.qty; // Keep original if array becomes empty or reset to 0
          return {
            ...item,
            measurements: arr,
            qty: arr.length > 0 ? newQtySum : 0,
            total: Number(((arr.length > 0 ? newQtySum : 0) * item.unitPrice).toFixed(0))
          };
        }
        return item;
      });
      return { ...prev, [activeProjId]: updated };
    });
    showAlert("Baris hitungan backup volume berhasil dihapus.", "info");
  };

  // AHSP triggers
  const handleAddAHSPItem = (bqId: string) => {
    if (!newAhspName || !newAhspCoeff) return;
    const itemToAdd: AHSPItem = {
      type: newAhspType,
      name: newAhspName,
      coefficient: newAhspCoeff,
      unit: newAhspUnit || "OH",
      unitPrice: newAhspRate
    };

    setBqList(prev => {
      const current = prev[activeProjId] || [];
      const updated = current.map(item => {
        if (item.id === bqId) {
          const arr = [...item.ahsp, itemToAdd];
          // Recalculate BQ Unit price based on AHSP sum (material cost + labor cost + equipment cost)
          const newUnitPriceCalculated = Math.round(
            arr.reduce((sum, sub) => sum + (sub.coefficient * sub.unitPrice), 0)
          );
          return {
            ...item,
            ahsp: arr,
            unitPrice: newUnitPriceCalculated,
            total: Number((item.qty * newUnitPriceCalculated).toFixed(0))
          };
        }
        return item;
      });
      return { ...prev, [activeProjId]: updated };
    });

    setNewAhspName("");
    setNewAhspCoeff(0);
    setNewAhspUnit("");
    setNewAhspRate(0);
    showAlert("Analisa Harga Satuan (AHSP) diupdate, Harga Satuan BQ terhitung otomatis!", "success");
  };

  const handleDeleteAHSPItem = (bqId: string, ahspIndex: number) => {
    setBqList(prev => {
      const current = prev[activeProjId] || [];
      const updated = current.map(item => {
        if (item.id === bqId) {
          const arr = item.ahsp.filter((_, i) => i !== ahspIndex);
          const newUnitPriceCalculated = arr.length > 0
            ? Math.round(arr.reduce((sum, sub) => sum + (sub.coefficient * sub.unitPrice), 0))
            : item.unitPrice;
          return {
            ...item,
            ahsp: arr,
            unitPrice: newUnitPriceCalculated,
            total: Number((item.qty * newUnitPriceCalculated).toFixed(0))
          };
        }
        return item;
      });
      return { ...prev, [activeProjId]: updated };
    });
    showAlert("Sub-item analisa harga satuan telah dihapus.", "info");
  };

  // Sync to Core RAB
  const handleTransferToRAB = (bqItem: BQItem) => {
    // Check if there is duplication in primary RAB
    const exists = rabItems.some(r => r.kodeItem === bqItem.code);
    if (exists) {
      alert?.msg;
      showAlert(`Gagal: Kode Item ${bqItem.code} sudah terdaftar di Rencana Anggaran Biaya (RAB) utama.`, "info");
      return;
    }

    addRABItem({
      kodeItem: bqItem.code,
      uraianPekerjaan: `[BQ] ${bqItem.name}`,
      volume: bqItem.qty,
      satuan: bqItem.unit,
      hargaSatuan: bqItem.unitPrice,
      total: bqItem.total
    });

    showAlert(`Sukses menyalin item '${bqItem.code}' ke Modul RAB Utama proyek!`, "success");
  };

  // CSV Import/Export & Email Sender Helper for BOQ
  const downloadBQTemplate = () => {
    const headers = "Divisi,Kode,Nama Pekerjaan,Volume,Satuan,Harga Satuan";
    const sampleRow = "DIVISI 1 - PEKERJAAN PERSIAPAN,1.05,Pagar Seng Konstruksi Sementara h=2m,150,m1,125000";
    const csvContent = "\uFEFF" + [headers, sampleRow].join("\n"); // prepend BOM for Excel compatibility
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Template_BOQ_Import.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert("Template CSV BOQ berhasil diunduh.", "success");
  };

  const handleImportBQCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBqImportLog("Membaca file CSV BOQ...");
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error("File kosong");

        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length <= 1) throw new Error("File tidak memiliki baris data");

        const splitLine = (l: string) => {
          const cells: string[] = [];
          let current = "";
          let insideQuotes = false;
          for (let i = 0; i < l.length; i++) {
            const char = l[i];
            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
              cells.push(current);
              current = "";
            } else {
              current += char;
            }
          }
          cells.push(current);
          return cells;
        };

        const cleanVal = (str: string) => str ? str.replace(/^"|"$/g, '').trim() : "";
        const cleanNum = (str: string) => {
          if (!str) return 0;
          const cleanStr = str.replace(/^"|"$/g, '').replace(/\./g, "").replace(/,/g, "").trim();
          return parseFloat(cleanStr) || 0;
        };

        const parsedRows = lines.map(splitLine);
        let headerIndex = 0;
        for (let i = 0; i < Math.min(parsedRows.length, 3); i++) {
          const joinedLow = parsedRows[i].join(" ").toLowerCase();
          if (joinedLow.includes("divisi") || joinedLow.includes("kode") || joinedLow.includes("uraian") || joinedLow.includes("pekerjaan")) {
            headerIndex = i;
            break;
          }
        }

        const startIndex = headerIndex + 1;
        let count = 0;
        const newBqItems: BQItem[] = [];

        for (let i = startIndex; i < parsedRows.length; i++) {
          const row = parsedRows[i];
          if (row.length < 3) continue;

          const division = cleanVal(row[0]) || "DIVISI UMUM - LAINNYA";
          const code = cleanVal(row[1]) || `BQ-${Math.floor(100 + Math.random() * 900)}`;
          const name = cleanVal(row[2]);
          if (!name) continue;

          const qty = cleanNum(row[3]) || 1;
          const unit = cleanVal(row[4]) || "Unit";
          const unitPrice = cleanNum(row[5]) || 0;
          const total = qty * unitPrice;

          newBqItems.push({
            id: `bq-import-${Math.random().toString(36).substring(2, 9)}`,
            division,
            code,
            name,
            qty,
            unit,
            unitPrice,
            total,
            measurements: [],
            ahsp: []
          });
          count++;
        }

        if (newBqItems.length > 0) {
          setBqList(prev => {
            const current = prev[activeProjId] || [];
            const existingCodes = new Set(current.map(c => c.code.toLowerCase()));
            const filteredNew = newBqItems.filter(item => !existingCodes.has(item.code.toLowerCase()));
            const updated = [...current, ...filteredNew];
            return { ...prev, [activeProjId]: updated };
          });
          showAlert(`Berhasil mengimpor ${count} item BQ!`, "success");
          setBqImportLog(`Impor Sukses! ${count} data terdaftar.`);
          setTimeout(() => setBqImportLog(""), 5000);
          setShowBqImport(false);
        } else {
          throw new Error("Tidak ada data valid yang bisa diimpor.");
        }
      } catch (err: any) {
        setBqImportLog(`Gagal: ${err.message || err}`);
        showAlert(`Gagal impor: ${err.message || err}`, "info");
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const triggerEmailBQ = () => {
    setEmailSubject(`[BOQ] Bill of Quantities - Proyek ${selectedProject?.namaProyek || "FGI BSD Office Tower"}`);
    setEmailBody(`Yth. Bapak/Ibu,\n\nBersama email ini kami lampirkan dokumen perencanaan Bill of Quantities (BQ) untuk Proyek: ${selectedProject?.namaProyek || "BSD Office Tower"}.\nTotal Estimasi Biaya Pekerjaan adalah sebesar Rp ${totalBQ.toLocaleString("id-ID")}.\n\nSilakan tinjau rincian lengkapnya pada lampiran file PDF.\n\nHormat kami,\nDivisi Estimator & Procurement\nPT Foresyndo Konstruksi Group`);
    setShowEmailModal(true);
  };

  const handleSendEmailSimulated = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);
    setEmailStep("Mempersiapkan dokumen PDF & lampiran...");
    
    setTimeout(() => {
      setEmailStep("Melakukan kompilasi PDF & lampiran...");
      setTimeout(() => {
        setEmailStep("Menghubungkan ke email relay (mail.foresyndo.com)...");
        setTimeout(() => {
          setEmailStep("Mengirim envelope dokumen ke penerima...");
          setTimeout(() => {
            setIsSendingEmail(false);
            setShowEmailModal(false);
            setEmailStep("");
            showAlert(`E-mail berhasil dikirim ke ${emailTo} dengan aman!`, "success");
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const handleExportBQPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const marginX = 15;
    let currentY = 20;

    // Premium Navy Banner
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, 297, 38, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("PT FORESYNDO KONSTRUKSI GROUP", marginX, 15);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Engineering, Procurement & Civil Estimator Services Suite", marginX, 21);
    doc.text("E-mail: support@foresyndo.com | Telp: +62 21-8888-888", marginX, 26);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.text("BILL OF QUANTITIES (BOQ / BQ)", 185, 15);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Proyek: ${selectedProject?.namaProyek || "BSD Office Tower"}`, 185, 21);
    doc.text(`Dicetak: ${new Date().toLocaleString()}`, 185, 26);

    currentY = 48;

    // Table view
    doc.setFillColor(241, 245, 249);
    doc.rect(marginX, currentY, 267, 8, "F");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    doc.text("KODE", marginX + 3, currentY + 5.5);
    doc.text("URAIAN PEKERJAAN & DETAIL SPESIFIKASI", marginX + 22, currentY + 5.5);
    doc.text("KUANTITAS", marginX + 152, currentY + 5.5);
    doc.text("SATUAN", marginX + 182, currentY + 5.5);
    doc.text("HARGA SATUAN (RP)", marginX + 212, currentY + 5.5, { align: "right" });
    doc.text("TOTAL BIAYA (RP)", marginX + 252, currentY + 5.5, { align: "right" });

    currentY += 8;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    const filtered = items.filter(i => filterDivision === "ALL" || i.division === filterDivision);

    filtered.forEach((item, index) => {
      if (currentY > 185) {
        doc.addPage();
        currentY = 20;
        doc.setFillColor(241, 245, 249);
        doc.rect(marginX, currentY, 267, 8, "F");
        doc.setFont("Helvetica", "bold");
        doc.text("KODE", marginX + 3, currentY + 5.5);
        doc.text("URAIAN PEKERJAAN & DETAIL SPESIFIKASI", marginX + 22, currentY + 5.5);
        doc.text("KUANTITAS", marginX + 152, currentY + 5.5);
        doc.text("SATUAN", marginX + 182, currentY + 5.5);
        doc.text("HARGA SATUAN (RP)", marginX + 212, currentY + 5.5, { align: "right" });
        doc.text("TOTAL BIAYA (RP)", marginX + 252, currentY + 5.5, { align: "right" });
        currentY += 8;
        doc.setFont("Helvetica", "normal");
      }

      doc.setDrawColor(241, 245, 249);
      doc.line(marginX, currentY, marginX + 267, currentY);

      doc.setFont("Helvetica", "bold");
      doc.text(item.code, marginX + 3, currentY + 5);
      
      let text = item.name;
      if (text.length > 70) text = text.substring(0, 68) + "...";
      doc.setFont("Helvetica", "normal");
      doc.text(text, marginX + 22, currentY + 5);

      doc.text(item.qty.toLocaleString(), marginX + 152, currentY + 5);
      doc.text(item.unit, marginX + 182, currentY + 5);
      doc.text(item.unitPrice.toLocaleString("id-ID"), marginX + 212, currentY + 5, { align: "right" });
      doc.setFont("Helvetica", "bold");
      doc.text(item.total.toLocaleString("id-ID"), marginX + 252, currentY + 5, { align: "right" });

      currentY += 8;
    });

    // Subtotal
    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.3);
    doc.line(marginX, currentY, marginX + 267, currentY);
    
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, currentY, 267, 9, "F");
    doc.setFont("Helvetica", "bold");
    doc.text("TOTAL NILAI ESTIMASI BILL OF QUANTITIES (BQ)", marginX + 22, currentY + 6);
    doc.text(`Rp ${totalBQ.toLocaleString("id-ID")}`, marginX + 252, currentY + 6, { align: "right" });

    doc.save(`Bill_of_Quantities_Foresyndo_${selectedProject?.nomorProyek || "PRJ"}.pdf`);
  };

  const selectedItem = items.find(i => i.id === selectedBq);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-mono">
            New Module
          </span>
          <h2 className="text-lg font-black text-slate-800 dark:text-white mt-2 flex items-center gap-2">
            <FileSpreadsheet className="w-5.5 h-5.5 text-blue-500" />
            Sistem Bill of Quantities (BQ) & Backup Volume Pekerjaan
          </h2>
          <p className="text-xs text-slate-400">
            Kalkulator volume estimasi (take-off sheet) & pembentuk Analisa Harga Satuan Pekerjaan (AHSP) standar konstruksi sipil.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Import CSV BoQ */}
          <button
            onClick={() => setShowBqImport(!showBqImport)}
            className={`py-2 px-3.5 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer ${
              showBqImport 
                ? "bg-amber-600 text-white" 
                : "bg-amber-500 hover:bg-amber-600 text-slate-950 font-black"
            }`}
          >
            <FileUp className="w-4 h-4" />
            <span>Impor CSV BQ</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportBQPDF}
            className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 font-mono cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-500" />
            Ekspor BQ PDF
          </button>

          {/* Email PDF */}
          <button
            onClick={triggerEmailBQ}
            className="py-2 px-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-white" />
            Kirim Email BQ
          </button>

          {/* Add Item Trigger */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1 bg-gradient-to-r cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Item BoQ</span>
          </button>
        </div>
      </div>

      {/* CSV IMPORT BQ DROPZONE PANEL */}
      {showBqImport && (
        <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs animate-in slide-in-from-top-6 text-left">
          <div className="space-y-1 text-left">
            <h3 className="font-bold text-slate-800 dark:text-amber-400 flex items-center gap-1.5 uppercase font-mono tracking-wider">
              <FileUp className="w-4 h-4 text-amber-500" />
              Impor Massal Bill of Quantities (BoQ) via CSV
            </h3>
            <p className="text-slate-500">
              Unggah file CSV dengan kolom header standar: <strong className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10.5px]">Divisi, Kode, Nama Pekerjaan, Volume, Satuan, Harga Satuan</strong>
            </p>
            {bqImportLog && (
              <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 animate-pulse mt-2">{bqImportLog}</p>
            )}
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            <button
              onClick={downloadBQTemplate}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
            >
              Unduh Template CSV
            </button>
            <label className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold rounded-xl transition cursor-pointer shadow-sm relative overflow-hidden">
              <span>Pilih File CSV...</span>
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleImportBQCSV} 
                className="absolute inset-0 opacity-0 cursor-pointer" 
              />
            </label>
          </div>
        </div>
      )}

      {/* ALERT COMPONENT */}
      {alert && (
        <div className={`p-4 rounded-xl border flex items-center gap-2 text-xs font-mono font-bold leading-relaxed shadow-sm animate-in fade-in ${
          alert.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
            : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{alert.msg}</span>
        </div>
      )}

      {/* DYNAMIC ADD MAIN BQ FORM */}
      {showAddForm && (
        <form onSubmit={handleCreateBQItem} className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-6 gap-4 animate-in slide-in-from-top-6">
          <div className="md:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Kode Item</label>
            <input
              type="text"
              placeholder="e.g. 1.01 atau 3.02"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Divisi Kelompok Kerja</label>
            <select
              value={newDivision}
              onChange={(e) => setNewDivision(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white font-mono"
            >
              <option value="DIVISI 1 - PEKERJAAN PERSIAPAN">DIVISI 1 - Pekerjaan Persiapan</option>
              <option value="DIVISI 2 - PEKERJAAN TANAH & PONDASI">DIVISI 2 - Pekerjaan Tanah & Pondasi</option>
              <option value="DIVISI 3 - PEKERJAAN STRUKTUR BETON">DIVISI 3 - Pekerjaan Struktur Beton</option>
              <option value="DIVISI 4 - PEKERJAAN ARSITEKTURAL">DIVISI 4 - Pekerjaan Arsitektural</option>
              <option value="DIVISI 5 - PEKERJAAN MEKANIKAL, ELEKTRIKAL & PLUMBING">DIVISI 5 - MEP</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Nama & Rincian Spesifikasi Item BoQ</label>
            <input
              type="text"
              placeholder="Contoh: Pekerjaan Plesteran Dinding Mortar t = 15mm 1:4"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
              required
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Kuantitas</label>
            <input
              type="number"
              value={newQty}
              onChange={(e) => setNewQty(Number(e.target.value) || 0)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white font-mono"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Satuan</label>
            <input
              type="text"
              placeholder="m3, m2, m1, Ls"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Harga Satuan Awal (Rp)</label>
            <input
              type="number"
              value={newUnitPrice}
              onChange={(e) => setNewUnitPrice(Number(e.target.value) || 0)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white font-mono"
            />
          </div>

          <div className="md:col-span-2 flex items-end gap-2 text-xs">
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer shadow-sm font-mono uppercase"
            >
              Simpan Item
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer font-mono uppercase"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* FILTER PANEL */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 font-mono">
          <Filter className="w-4 h-4 text-blue-500" />
          <span>Saring Berdasarkan Divisi:</span>
        </div>
        <div className="flex flex-wrap gap-1 w-full justify-start md:justify-end">
          {divisions.map(div => (
            <button
              key={div}
              onClick={() => setFilterDivision(div)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black font-mono transition uppercase ${
                filterDivision === div 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 border border-slate-200 dark:border-slate-800 cursor-pointer"
              }`}
            >
              {div === "ALL" ? "Semua Divisi" : div.split(" - ")[1] || div}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1: SPREADSHEET OF BQ (6/7 COLS) */}
        <div className="lg:col-span-8 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            <span>Daftar Utama Bill of Quantities</span>
            <span className="text-slate-400">Total: {items.length} Kelompok</span>
          </div>

          <div className="overflow-x-auto border border-slate-100 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-950">
            <table className="w-full text-left font-mono text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-3 w-[8%]">Kode</th>
                  <th className="py-3 px-3 w-[45%]">Deskripsi Pekerjaan BoQ</th>
                  <th className="py-3 px-3 text-right">Kuantitas</th>
                  <th className="py-3 px-3 text-center">Satuan</th>
                  <th className="py-3 px-3 text-right">Harga Satuan</th>
                  <th className="py-3 px-3 text-right">Total Biaya</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {items.filter(i => filterDivision === "ALL" || i.division === filterDivision).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Layers className="w-8 h-8 mx-auto text-slate-300 stroke-1 mb-2" />
                      Tidak ada data Bill of Quantities yang cocok dengan filter divisi.
                    </td>
                  </tr>
                ) : (
                  items
                    .filter(i => filterDivision === "ALL" || i.division === filterDivision)
                    .map((item) => {
                      const isSelected = selectedBq === item.id;
                      return (
                        <tr 
                          key={item.id} 
                          onClick={() => {
                            setSelectedBq(item.id);
                            // Clear calc states
                            setCalcDesc("");
                            setCalcP(1); setCalcL(1); setCalcT(1); setCalcMult(1);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isSelected 
                              ? "bg-blue-50/50 dark:bg-blue-950/20 border-l-2 border-l-blue-500" 
                              : "hover:bg-slate-50/40 dark:hover:bg-slate-900/40"
                          }`}
                        >
                          <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{item.code}</td>
                          <td className="py-3 px-3">
                            <div className="font-extrabold text-slate-800 dark:text-white leading-tight">{item.name}</div>
                            <div className="text-[9px] text-slate-400 mt-1 uppercase flex items-center gap-1.5 leading-none">
                              <span>{item.division}</span>
                              {item.measurements.length > 0 && (
                                <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-1 py-0.5 rounded font-black text-[8px]">
                                  {item.measurements.length} Backup Volume
                                </span>
                              )}
                              {item.ahsp.length > 0 && (
                                <span className="bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 px-1 py-0.5 rounded font-black text-[8px]">
                                  {item.ahsp.length} Sub AHSP
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-slate-100 select-all">
                            {item.qty.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500 font-bold">{item.unit}</td>
                          <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                            Rp {item.unitPrice.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">
                            Rp {item.total.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleTransferToRAB(item)}
                                className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9.5px] font-black flex items-center gap-0.5"
                                title="Salin item ini ke Rencana Anggaran Biaya utama proyek"
                              >
                                Terapkan ke RAB
                              </button>
                              <button
                                onClick={() => handleDeleteBQItem(item.id)}
                                className="text-slate-400 hover:text-rose-500 p-1 rounded transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          {/* SPREADSHEET BOTTOM TOTAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-slate-950 border border-slate-105 dark:border-slate-850 p-4 rounded-xl font-mono text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Info className="w-4 h-4 text-blue-500" />
              <span>Pilih baris estimasi BoQ untuk mengaktifkan kalkulator backup volume & analisa harga satuan di panel kanan.</span>
            </div>
            <div className="flex justify-between items-center text-right font-black text-slate-850 dark:text-white">
              <span>ESTIMASI AKUMULATIF BOQ PROYEK:</span>
              <span className="text-rose-500 text-sm">Rp {totalBQ.toLocaleString("id-ID")}</span>
            </div>
          </div>

        </div>

        {/* COLUMN 2: ANALYST PANEL (4 COLS) - Dynamic depending on Selected item */}
        <div className="lg:col-span-4 space-y-6">
          
          {!selectedItem ? (
            <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-3 bg-slate-50/50 dark:bg-slate-900/20">
              <Calculator className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
              <div className="text-xs font-bold uppercase tracking-wider font-mono">Workspace Engineer</div>
              <p className="text-[11px] leading-relaxed">
                Silahkan pilih salah satu item pekerjaan BoQ di samping untuk menganalisis backup hitungan detail volume (take-off sheet) & merinci Analisa Harga Satuan Pekerjaan (AHSP).
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in-50">
              
              {/* CURRENT SELECTED ITEM SUMMARY CARD */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-950 space-y-3.5">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase text-slate-400">
                  <span>Workspace Estimator Sipil</span>
                  <span className="bg-blue-600/30 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full font-black select-all">
                    ID: {selectedItem.id.toUpperCase().substring(0, 9)}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-blue-400 font-mono font-extrabold flex items-center gap-1.5">
                    <span>{selectedItem.code}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-450 truncate">({selectedItem.division})</span>
                  </div>
                  <h3 className="text-sm font-black text-white leading-tight">{selectedItem.name}</h3>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-3 text-center font-mono">
                  <div>
                    <span className="block text-[8px] text-slate-400 uppercase font-black uppercase">Vol Terkalkulasi</span>
                    <span className="text-xs font-extrabold text-blue-400">{selectedItem.qty} {selectedItem.unit}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-400 uppercase font-black uppercase">Harga Satuan</span>
                    <span className="text-xs font-extrabold text-slate-200">Rp {selectedItem.unitPrice.toLocaleString("id-ID")}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-400 uppercase font-black uppercase">Jumlah Biaya</span>
                    <span className="text-xs font-extrabold text-teal-400">Rp {selectedItem.total.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>

              {/* 1. INTERACTIVE MEASUREMENT BACKUP SHEET */}
              <div className="bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Ruler className="w-4 h-4 text-amber-500" />
                  Backup Volume & Take-Off Sheet (m)
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Gunakan formula dimensi fisik (Panjang x Lebar x Tinggi) x Faktor Kali untuk mengestimasi kuantitas gambar kerja (As-Built/Detail).
                </p>

                {/* CALCULATOR FIELD INLINES */}
                <div className="space-y-3.5 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div>
                    <label className="block text-[9px] font-black text-slate-450 uppercase mb-1 font-mono">Deskripsi Pekerjaan Fisik / Segmen Lokasi</label>
                    <input
                      type="text"
                      placeholder="Contoh: Galian Tanah Segmen S-10 atau Kolom K2"
                      value={calcDesc}
                      onChange={(e) => setCalcDesc(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500 text-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center font-mono text-[10px]">
                    <div>
                      <span className="block text-[8px] text-slate-400 mb-1">P (M)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={calcP}
                        onChange={(e) => setCalcP(Number(e.target.value) || 0)}
                        className="w-full text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-slate-850 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400 mb-1">L (M)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={calcL}
                        onChange={(e) => setCalcL(Number(e.target.value) || 0)}
                        className="w-full text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-slate-850 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400 mb-1">T/D (M)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={calcT}
                        onChange={(e) => setCalcT(Number(e.target.value) || 0)}
                        className="w-full text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-slate-850 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400 mb-1">KALI (QTY)</span>
                      <input
                        type="number"
                        value={calcMult}
                        onChange={(e) => setCalcMult(Number(e.target.value) || 1)}
                        className="w-full text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-slate-850 dark:text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-500 font-bold">
                    <span>Hasil Formula Hitung:</span>
                    <span className="text-amber-600 dark:text-amber-400 font-black">
                      {(calcP * calcL * calcT * calcMult).toFixed(3)} {selectedItem.unit}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddMeasurement(selectedItem.id)}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10.5px] rounded-xl flex items-center justify-center gap-1 transition cursor-pointer font-mono uppercase tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah & Update Volume BoQ
                  </button>
                </div>

                {/* CURRENT MEASUREMENT LIST */}
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                  {selectedItem.measurements.length === 0 ? (
                    <div className="text-center py-5 text-[10.5px] text-slate-400 font-mono border-2 border-dashed border-slate-100 dark:border-slate-900 rounded-xl">
                      Belum ada entri rincian backup volume.
                    </div>
                  ) : (
                    selectedItem.measurements.map(m => (
                      <div key={m.id} className="p-2.5 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-850 flex items-center justify-between gap-1 text-[10.5px] font-mono leading-tight">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 dark:text-slate-250 block">{m.description}</span>
                          <span className="text-[9px] text-slate-400 block font-normal">
                            ({m.p}m x {m.l}m x {m.t}m) x {m.qtyMultiplier} kali
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-bold select-all">
                          <span className="text-amber-500 font-black">{m.totalVolume.toLocaleString() || "0"}</span>
                          <button
                            onClick={() => handleDeleteMeasurement(selectedItem.id, m.id)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

              {/* 2. ANALISA HARGA SATUAN PEKERJAAN (AHSP) STANDAR SNI */}
              <div className="bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Wrench className="w-4 h-4 text-teal-500" />
                  Analisa Harga Satuan Pekerjaan (AHSP)
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Rincian koefisien SNI untuk upah tenaga kerja, material sediaan gudang, dan alat berat pelengkap pembentuk biaya satuan.
                </p>

                {/* ADD AHSP SUB-ITEM */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div>
                      <span className="block text-[8px] text-slate-400 mb-1">Tipe</span>
                      <select
                        value={newAhspType}
                        onChange={(e) => setNewAhspType(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-850 dark:text-white text-xs font-bold"
                      >
                        <option value="material">Material (Barang)</option>
                        <option value="labor">Labor (Upah Sipil)</option>
                        <option value="equipment">Alat Berat / Tools</option>
                      </select>
                    </div>

                    <div>
                      <span className="block text-[8px] text-slate-400 mb-1">Spesifikasi Unit</span>
                      <input
                        type="text"
                        placeholder="kg, zak, m3, OH"
                        value={newAhspUnit}
                        onChange={(e) => setNewAhspUnit(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-850 dark:text-white text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[8px] text-slate-400 mb-1 font-mono">Deskripsi Sumber Daya</span>
                    <input
                      type="text"
                      placeholder="e.g. Semen Portland Portland, Tukang Besi"
                      value={newAhspName}
                      onChange={(e) => setNewAhspName(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none focus:border-teal-500 text-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="block text-[8px] text-slate-400 mb-1">Koefisien SNI</span>
                      <input
                        type="number"
                        step="0.001"
                        placeholder="0.086 atau 135"
                        value={newAhspCoeff}
                        onChange={(e) => setNewAhspCoeff(Number(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-850 dark:text-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400 mb-1">Harga Satuan Basal (Rp)</span>
                      <input
                        type="number"
                        value={newAhspRate}
                        onChange={(e) => setNewAhspRate(Number(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-850 dark:text-white text-xs font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddAHSPItem(selectedItem.id)}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-black text-[10.5px] rounded-xl flex items-center justify-center gap-1 transition cursor-pointer font-mono uppercase tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Simpan Sub-AHSP
                  </button>
                </div>

                {/* CURRENT LIST OF AHSP */}
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                  {selectedItem.ahsp.length === 0 ? (
                    <div className="text-center py-5 text-[10px] text-slate-400 font-mono border-2 border-dashed border-slate-100 dark:border-slate-900 rounded-xl">
                      Belum ada kalkulasi SNI. Harga satuan berupa nilai input statis.
                    </div>
                  ) : (
                    selectedItem.ahsp.map((sub, index) => {
                      const calculatedCost = sub.coefficient * sub.unitPrice;
                      return (
                        <div key={index} className="p-2.5 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-850 flex items-center justify-between gap-1 text-[10px] font-mono leading-tight">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 block uppercase">
                              [{sub.type.toUpperCase()}] {sub.name}
                            </span>
                            <span className="text-[9px] text-slate-450 block font-normal">
                              Koef: {sub.coefficient} x Rp {sub.unitPrice.toLocaleString("id-ID")} / {sub.unit}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-bold select-all text-slate-600 dark:text-slate-350">
                            <span>Rp {calculatedCost.toLocaleString("id-ID")}</span>
                            <button
                              onClick={() => handleDeleteAHSPItem(selectedItem.id, index)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* EMAIL COMPILING SENDER DIALOG */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 text-left">
          <div className="bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 dark:bg-black p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-sm">Foresyndo Mail Dispatcher - BQ Suite</span>
              </div>
              <button 
                onClick={() => !isSendingEmail && setShowEmailModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold font-mono p-1"
                disabled={isSendingEmail}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendEmailSimulated} className="p-5 space-y-4 text-xs font-medium">
              <div className="space-y-1">
                <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[9.5px]">Kepada (Email Penerima)</label>
                <input 
                  type="email" 
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-bold font-sans"
                  placeholder="name@company.com"
                  required
                  disabled={isSendingEmail}
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[9.5px]">Subjek Surat</label>
                <input 
                  type="text" 
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-bold font-sans"
                  required
                  disabled={isSendingEmail}
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[9.5px]">Pesan Pengantar</label>
                <textarea 
                  rows={6}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-mono"
                  required
                  disabled={isSendingEmail}
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-500/10 flex items-center justify-between text-[11px] text-blue-600 dark:text-blue-400">
                <div className="flex items-center gap-1.5 font-bold">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Lampiran Terdeteksi:</span>
                </div>
                <span className="font-mono font-black underline truncate max-w-[200px]">Bill_of_Quantities_Foresyndo.pdf (Auto)</span>
              </div>

              {isSendingEmail && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200/50 dark:border-slate-800 space-y-2 animate-pulse text-[11px] font-mono">
                  <div className="flex items-center gap-2 text-blue-600">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                    <span className="font-black">{emailStep}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-1000 w-3/4 animate-pulse"></div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t dark:border-slate-800 pt-3.5">
                <button 
                  type="button" 
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 border rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold"
                  disabled={isSendingEmail}
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded shadow-md flex items-center gap-1.5 cursor-pointer"
                  disabled={isSendingEmail}
                >
                  <span>Kirim Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
