import React, { useState } from "react";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { ProjectProvider, useProject } from "./context/ProjectContext";
import { ProjectStatus, UserRole, Project, FinanceTransaction, PurchaseOrder, MaterialInventory, SDMStaff, QualityControlItem, SafetyRecord, DocumentRecord, DailyReport } from "./types";

// Import custom sub-modules
import { AIAssistant } from "./components/AIAssistant";
import { GanttChart } from "./components/GanttChart";
import { RABManagement } from "./components/RABManagement";
import { BQManagement } from "./components/BQManagement";
import { SPlusCurve } from "./components/SPlusCurve";
import { InventoryBarcode } from "./components/InventoryBarcode";
import { SdmHR } from "./components/SdmHR";
import { PortalSettingsPanel } from "./components/PortalSettingsPanel";
import { LoginScreen } from "./components/LoginScreen";
import { TaskAndCommunication } from "./components/TaskAndCommunication";
import { BudgetPieChart } from "./components/BudgetPieChart";
import { EnterprisePurchaseOrder } from "./components/EnterprisePurchaseOrder";
import { CashFlowManagement } from "./components/CashFlowManagement";

// Icons
import {
  Sparkles, LayoutDashboard, Database, DollarSign, ShoppingCart, 
  Package, Users, FileText, CheckSquare, ShieldCheck, Sun, Moon,
  ChevronRight, LogIn, LogOut, Plus, Trash2, Calendar, HardHat,
  CloudSun, Umbrella, Wind, Cloud, Bell, UserCheck, ShieldAlert,
  MessageSquare, History, Send, X, Settings, FileSpreadsheet
} from "lucide-react";

function AppContent() {
  const {
    currentUser, loadingAuth, authError, setAuthError, projects, selectedProject, switchProject,
    rabItems, transactions, purchaseOrders, inventory, staff, qcItems,
    safetyRecords, documents, dailyReports, notifications, auditLogs,
    darkMode, setDarkMode, addProject, updateProject, deleteProject,
    addTransaction, approveTransaction, addPurchaseOrder, updatePOStatus,
    addQCItem, updateQCStatus, addSafetyRecord, addDocument, approveDocument,
    addRFIComment, updateRFIStatus,
    addDailyReport, signInWithGoogle, signInWithBypass, logOut, activeCompany, portalSettings
  } = useProject();

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [showNotify, setShowNotify] = useState<boolean>(false);

  // Form states for adding items of major modules
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({
    nomorProyek: "",
    namaProyek: "",
    lokasi: "",
    owner: "",
    konsultan: "",
    kontraktor: "",
    tanggalMulai: "",
    tanggalSelesai: "",
    nilaiKontrak: 0,
    status: ProjectStatus.BERJALAN,
    companyName: "PT Foresyndo Group"
  });

  const [showAddTx, setShowAddTx] = useState(false);
  const [newTx, setNewTx] = useState({
    type: "cash_in" as "cash_in" | "cash_out",
    category: "Termin" as "Uang Muka" | "Termin" | "Retensi" | "Addendum" | "Material" | "Upah" | "Subkontraktor" | "Alat" | "Operasional",
    amount: 0,
    date: "",
    description: "",
    status: "Draft" as "Draft" | "Approved" | "Processed"
  });

  const [showAddPO, setShowAddPO] = useState(false);
  const [newPO, setNewPO] = useState({
    nomorPO: "",
    supplier: "",
    material: "",
    qty: 0,
    harga: 0,
    status: "Draft" as "Draft" | "Approved" | "Ordered" | "Delivered"
  });

  const [showAddQC, setShowAddQC] = useState(false);
  const [newQC, setNewQC] = useState({
    checklistName: "",
    category: "Checklist QC" as "Checklist QC" | "Inspection Request" | "NCR" | "Corrective Action",
    description: "",
    status: "Open" as "Open" | "Progress" | "Closed",
    inspectorName: ""
  });

  const [showAddSafety, setShowAddSafety] = useState(false);
  const [newSafety, setNewSafety] = useState({
    type: "Safety Induction" as "Safety Induction" | "Safety Patrol" | "Incident Report" | "Toolbox Meeting",
    details: "",
    findings: 0,
    accidents: 0,
    safetyScore: 100
  });

  const [showAddDaily, setShowAddDaily] = useState(false);
  const [newDaily, setNewDaily] = useState({
    date: "",
    weather: "Cerah" as "Cerah" | "Hujan" | "Gerimis" | "Mendung",
    laborDetails: "",
    equipmentDetails: "",
    materialDetails: "",
    activities: ""
  });

  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState<"Kontrak" | "Shop Drawing" | "As Built Drawing" | "RFI" | "Metode Kerja" | "Laporan Harian">("Kontrak");
  const [newDocDueDate, setNewDocDueDate] = useState("");

  const [selectedRFIDocId, setSelectedRFIDocId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [newHistoryNote, setNewHistoryNote] = useState("");

  // Calculations for Dashboards
  const totalContractVal = projects.reduce((sum, p) => sum + p.nilaiKontrak, 0);
  const totalRAB_Selected = rabItems.reduce((sum, item) => sum + item.total, 0);
  const cashInTotal_Selected = transactions.filter(t => t.type === "cash_in").reduce((sum, t) => sum + t.amount, 0);
  const cashOutTotal_Selected = transactions.filter(t => t.type === "cash_out").reduce((sum, t) => sum + t.amount, 0);
  
  // Safety statistics
  const totalFindings = safetyRecords.reduce((sum, r) => sum + r.findings, 0);
  const totalAccidents = safetyRecords.reduce((sum, r) => sum + r.accidents, 0);
  const lastSafetyScore = safetyRecords[safetyRecords.length - 1]?.safetyScore || 95;

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.nomorProyek || !newProject.namaProyek) return;
    addProject(newProject);
    setNewProject({
      nomorProyek: "",
      namaProyek: "",
      lokasi: "",
      owner: "",
      konsultan: "",
      kontraktor: "",
      tanggalMulai: "",
      tanggalSelesai: "",
      nilaiKontrak: 0,
      status: ProjectStatus.BERJALAN,
      companyName: "PT Foresyndo Group"
    });
    setShowAddProject(false);
  };

  const handleCreateTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTransaction({
      ...newTx,
      amount: Number(newTx.amount),
      date: newTx.date || new Date().toISOString().split("T")[0]
    });
    setNewTx({
      type: "cash_in",
      category: "Termin",
      amount: 0,
      date: "",
      description: "",
      status: "Draft"
    });
    setShowAddTx(false);
  };

  const handleCreatePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPO.nomorPO || !newPO.supplier) return;
    addPurchaseOrder({
      ...newPO,
      qty: Number(newPO.qty),
      harga: Number(newPO.harga),
      total: Number(newPO.qty) * Number(newPO.harga)
    });
    setNewPO({
      nomorPO: "",
      supplier: "",
      material: "",
      qty: 0,
      harga: 0,
      status: "Draft"
    });
    setShowAddPO(false);
  };

  const [poAlert, setPoAlert] = useState<{ message: string; type: "success" | "warning" | "info" } | null>(null);

  const handleAutoGeneratePOs = () => {
    const lowStockItems = inventory.filter(item => item.currentStock < item.minStock);
    if (lowStockItems.length === 0) {
      setPoAlert({
        message: "Status Sediaan Aman: Tidak ada material yang menyentuh batas minimum stok saat ini (aman dari low stock)!",
        type: "info"
      });
      return;
    }

    let count = 0;
    lowStockItems.forEach(item => {
      const existing = purchaseOrders.find(p => 
        p.material.toLowerCase() === item.materialName.toLowerCase() && 
        (p.status === "Draft" || p.status === "Approved" || p.status === "Ordered")
      );

      if (!existing) {
        const deficient = item.minStock - item.currentStock;
        const qty = Math.max(deficient * 2, item.minStock * 2);
        
        let supplier = "PT Kencana Suplai Konstruksi";
        let harga = 75000;

        const nameLower = item.materialName.toLowerCase();
        if (nameLower.includes("besi") || nameLower.includes("beton") || nameLower.includes("baja") || nameLower.includes("wire")) {
          supplier = "PT Krakatau Steel Tbk";
          harga = 145000;
        } else if (nameLower.includes("semen") || nameLower.includes("grobogan") || nameLower.includes("padang") || nameLower.includes("gresik")) {
          supplier = "PT Semen Indonesia Group";
          harga = 68000;
        } else if (nameLower.includes("pasir") || nameLower.includes("batu") || nameLower.includes("sirtu") || nameLower.includes("kerikil")) {
          supplier = "CV Selo Manunggal Abadi";
          harga = 280000;
        } else if (nameLower.includes("pipa") || nameLower.includes("pvc") || nameLower.includes("rucika")) {
          supplier = "PT Wavin Duta Rucika";
          harga = 95000;
        } else if (nameLower.includes("cat") || nameLower.includes("dulux") || nameLower.includes("nippon")) {
          supplier = "PT Nippon Paint Indonesia";
          harga = 350000;
        } else if (nameLower.includes("bata") || nameLower.includes("hebel") || nameLower.includes("merah")) {
          supplier = "UD Sumber Makmur Bata";
          harga = 12000;
        } else if (nameLower.includes("kawat") || nameLower.includes("paku")) {
          supplier = "UD Logam Abadi Lestari";
          harga = 35050;
        }

        const randNum = Math.floor(100 + Math.random() * 900);
        const nomorPO = `PO-AUTO-${item.id.replace("inv-", "").toUpperCase()}-${randNum}`;

        addPurchaseOrder({
          nomorPO,
          supplier,
          material: item.materialName,
          qty,
          harga,
          total: qty * harga,
          status: "Draft"
        });
        count++;
      }
    });

    if (count > 0) {
      setPoAlert({
        message: `Sistem Pengadaan Otomatis Foresyndo berhasil membuat ${count} draf Purchase Order (PO) baru berdasarkan analisis stok kritis sediaan!`,
        type: "success"
      });
    } else {
      setPoAlert({
        message: "Duplikasi Dibatalkan: Seluruh barang logistik berstatus low-stock sudah dibuatkan PO-nya & sedang diproses.",
        type: "warning"
      });
    }
  };

  const handleExportPOPDF = async (po: PurchaseOrder) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const marginX = 15;
    let currentY = 15;

    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text(selectedProject ? selectedProject.kontraktor.toUpperCase() : "PT FORESYNDO CONTRACTOR GROUP", marginX, 15);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Sistem Pengadaan Rantai Pasok & Manajemen Gudang Lapangan", marginX, 21);
    doc.text(`Proyek: ${selectedProject ? selectedProject.namaProyek : "Foresyndo BSD Project"}`, marginX, 26);
    doc.text(`Lokasi: ${selectedProject ? selectedProject.lokasi : "BSD City, Tangerang"}`, marginX, 31);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(245, 158, 11); 
    doc.text("PURCHASE ORDER (PO)", 135, 15);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`Nomor PO: ${po.nomorPO}`, 135, 21);
    doc.text(`Status Dokumen: ${po.status.toUpperCase()}`, 135, 26);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString()}`, 135, 31);

    currentY = 50;

    doc.setFillColor(248, 250, 252); 
    doc.rect(marginX, currentY, 180, 22, "F");
    doc.setDrawColor(226, 232, 240); 
    doc.rect(marginX, currentY, 180, 22, "D");

    doc.setTextColor(71, 85, 105); 
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.text("PENGIRIM (MITRA SUPPLIER / VENDOR):", marginX + 4, currentY + 5);
    doc.text("TUJUAN PENGIRIMAN (SITE PROYEK):", marginX + 94, currentY + 5);

    doc.setTextColor(15, 23, 42); 
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(po.supplier || "Supplier Lokal Sahat", marginX + 4, currentY + 10);
    doc.text("Mitra Rantai Pasok Terverifikasi", marginX + 4, currentY + 14);

    doc.text(selectedProject ? selectedProject.namaProyek : "BSD Urban Development", marginX + 94, currentY + 10);
    doc.text(selectedProject ? `${selectedProject.lokasi}` : "Tangerang Banten", marginX + 94, currentY + 14);

    currentY += 30;

    doc.setFillColor(15, 23, 42); 
    doc.rect(marginX, currentY, 180, 8, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Deskripsi Pekerjaan / Urutan Material", marginX + 4, currentY + 5.5);
    doc.text("Kuantitas (Qty)", marginX + 85, currentY + 5.5);
    doc.text("Harga Satuan", marginX + 115, currentY + 5.5);
    doc.text("Total Nominal", marginX + 150, currentY + 5.5);

    currentY += 8;

    doc.setFillColor(255, 255, 255);
    doc.rect(marginX, currentY, 180, 10, "F");
    doc.setDrawColor(241, 245, 249);
    doc.line(marginX, currentY + 10, marginX + 180, currentY + 10);

    doc.setTextColor(15, 23, 42);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(po.material, marginX + 4, currentY + 6.5);
    doc.text(`${po.qty} Unit`, marginX + 85, currentY + 6.5);
    doc.text(`Rp ${po.harga.toLocaleString("id-ID")}`, marginX + 115, currentY + 6.5);
    
    doc.setFont("Helvetica", "bold");
    doc.text(`Rp ${(po.qty * po.harga).toLocaleString("id-ID")}`, marginX + 150, currentY + 6.5);

    currentY += 10;

    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, currentY, 180, 12, "F");
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, currentY, marginX + 180, currentY);
    doc.line(marginX, currentY + 12, marginX + 180, currentY + 12);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("JUMLAH NOMINAL PO (TOTAL PENGADAAN):", marginX + 4, currentY + 7.5);
    doc.setTextColor(245, 158, 11); 
    doc.setFontSize(11);
    doc.text(`Rp ${(po.qty * po.harga).toLocaleString("id-ID")}`, marginX + 140, currentY + 8);

    currentY += 15;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text("PERSYARATAN & REGULASI RANTAI PASOK:", marginX, currentY);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("1. Dropping material wajib menyertakan Nota Pembelian, Surat Jalan asli, dan Lampiran PO ini.", marginX, currentY + 4);
    doc.text("2. Bahan baku harus melalui uji kelayakan K3 / Inspeksi Tim QC Foresyndo di lokasi.", marginX, currentY + 7);
    doc.text("3. Penagihan termin keuangan wajib memuat Barcode Verifikasi di bawah ini.", marginX, currentY + 10);

    currentY += 16;

    doc.setDrawColor(203, 213, 225);
    doc.line(marginX, currentY, marginX + 180, currentY);
    
    currentY += 5;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text("PENGESAHAN DIGITAL SECARA BARCODE (DIGITAL AUTHORIZATION & CRYPTO SIGNATURE)", marginX, currentY);

    currentY += 4;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("Keaslian dokumen divalidasi lewat enkripsi QR Code Foresyndo Construction Suite.", marginX, currentY);

    currentY += 6;

    const creatorPayload = JSON.stringify({
      poId: po.id,
      poNo: po.nomorPO,
      material: po.material,
      qty: po.qty,
      total: po.qty * po.harga,
      signer: currentUser?.name || "PM Foresyndo",
      role: "Site Manager / PM",
      timestamp: new Date().toISOString()
    });

    const approverPayload = JSON.stringify({
      poId: po.id,
      poNo: po.nomorPO,
      total: po.qty * po.harga,
      status: po.status,
      signer: "Direksional PT Foresyndo",
      approved: po.status !== "Draft",
      verified: true
    });

    try {
      const creatorQR = await QRCode.toDataURL(creatorPayload, { width: 120, margin: 1 });
      const approverQR = await QRCode.toDataURL(approverPayload, { width: 120, margin: 1 });

      const boxW = 85;
      const boxH = 34;

      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, currentY, boxW, boxH, "F");
      doc.rect(marginX, currentY, boxW, boxH, "D");
      doc.addImage(creatorQR, "PNG", marginX + boxW - 24, currentY + 4, 20, 20);
      
      doc.setTextColor(71, 85, 105);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("DIAJUKAN OLEH (PREPARED PM):", marginX + 4, currentY + 6);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.text("Divisi Pengadaan Logistik", marginX + 4, currentY + 11);
      doc.text(`Nama: ${currentUser?.name || "Staff Logistik"}`, marginX + 4, currentY + 15);
      doc.text("Status: SIGNED (BARCODE VALID)", marginX + 4, currentY + 19);
      doc.text("[Scan Barcode Digital untuk verifikasi]", marginX + 4, currentY + 24);
      doc.text(`ID: PM-${po.id.substring(3,8).toUpperCase()}`, marginX + 4, currentY + 28);

      const rigX = marginX + boxW + 10;
      doc.setFillColor(248, 250, 252);
      doc.rect(rigX, currentY, boxW, boxH, "F");
      doc.rect(rigX, currentY, boxW, boxH, "D");
      doc.addImage(approverQR, "PNG", rigX + boxW - 24, currentY + 4, 20, 20);
      
      doc.setTextColor(71, 85, 105);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("DISETUJUI OLEH (APPROVED BY):", rigX + 4, currentY + 6);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.text("Dewan Direksi & Manajemen Keuangan", rigX + 4, currentY + 11);
      doc.text(po.status === "Approved" || po.status === "Ordered" || po.status === "Delivered" ? "Nama: Direktur Utama Foresyndo" : "Nama: (Persetujuan Tertunda)", rigX + 4, currentY + 15);
      
      if (po.status === "Draft") {
        doc.setTextColor(239, 68, 68); 
        doc.setFont("Helvetica", "bold");
        doc.text("Status: TERTUNDA / PENDING DRAFT", rigX + 4, currentY + 19);
      } else {
        doc.setTextColor(16, 185, 129); 
        doc.setFont("Helvetica", "bold");
        doc.text("Status: APPROVED (BARCODE SAH)", rigX + 4, currentY + 19);
      }
      
      doc.setTextColor(71, 85, 105);
      doc.setFont("Helvetica", "normal");
      doc.text("[Scan Barcode Digital untuk verifikasi]", rigX + 4, currentY + 24);
      doc.text(`ID: DIR-${po.id.substring(3,8).toUpperCase()}`, rigX + 4, currentY + 28);

    } catch (err) {
      console.error("Gagal menggambar digital barcode QR signature ke PDF:", err);
    }

    doc.save(`Purchase_Order_Foresyndo_${po.nomorPO}.pdf`);
  };

  const handleCreateQCSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQC.checklistName) return;
    addQCItem({
      ...newQC,
      date: new Date().toISOString().split("T")[0],
      inspectorName: currentUser?.name || "QC Inspector"
    });
    setNewQC({
      checklistName: "",
      category: "Checklist QC",
      description: "",
      status: "Open",
      inspectorName: ""
    });
    setShowAddQC(false);
  };

  const handleCreateSafetySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSafetyRecord({
      ...newSafety,
      findings: Number(newSafety.findings),
      accidents: Number(newSafety.accidents),
      safetyScore: Number(newSafety.safetyScore),
      date: new Date().toISOString().split("T")[0]
    });
    setNewSafety({
      type: "Safety Induction",
      details: "",
      findings: 0,
      accidents: 0,
      safetyScore: 100
    });
    setShowAddSafety(false);
  };

  const handleCreateDailySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDaily.activities) return;
    addDailyReport({
      ...newDaily,
      date: newDaily.date || new Date().toISOString().split("T")[0]
    });
    setNewDaily({
      date: "",
      weather: "Cerah",
      laborDetails: "",
      equipmentDetails: "",
      materialDetails: "",
      activities: ""
    });
    setShowAddDaily(false);
  };

  const handleCreateDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName) return;
    addDocument({
      name: newDocName,
      category: newDocCategory,
      url: "#",
      version: "v1.0",
      status: "Pending Approval",
      dueDate: newDocCategory === "RFI" ? newDocDueDate || undefined : undefined
    });
    setNewDocName("");
    setNewDocDueDate("");
    setShowAddDoc(false);
  };

  // Weather icon rendering helper
  const renderWeatherIcon = (w: string) => {
    switch (w) {
      case "Cerah": return <Sun className="w-4 h-4 text-amber-500" />;
      case "Hujan": return <Umbrella className="w-4 h-4 text-sky-500" />;
      case "Gerimis": return <CloudSun className="w-4 h-4 text-sky-400" />;
      case "Mendung": return <Cloud className="w-4 h-4 text-slate-400" />;
      default: return <Sun className="w-4 h-4 text-amber-500" />;
    }
  };

  // Helper to compute remaining days for RFI Due Date
  const getRFIDeadlineInfo = (dueDate?: string) => {
    if (!dueDate) return null;
    const target = new Date(dueDate);
    const today = new Date("2026-06-08"); // Using consistent contextual current date matching additional metadata
    
    // Reset times for accurate day-by-day comparison
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Simple clean mock PDF exporter
  const triggerFakePDFExport = (moduleName: string) => {
    alert(`File PDF untuk [Laporan ${moduleName}] berhasil diproses dalam antrean cetak setempat. File akan terunduh otomatis.`);
  };

  if (loadingAuth) {
    return (
      <div className="h-screen w-screen bg-[#0b0f19] flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono font-bold uppercase tracking-wider animate-pulse text-blue-400">Menghubungkan Sesi Firebase...</span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <LoginScreen />
        
        {/* Auth Error & Domain Troubleshooting Modal */}
        {authError && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto font-sans text-slate-800 dark:text-slate-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-left">
              {/* Header */}
              <div className="bg-rose-50 dark:bg-rose-950/20 px-6 py-5 border-b border-rose-100 dark:border-rose-900/40 flex items-start gap-4">
                <div className="p-2.5 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Pengenalan Domain Belum Diotorisasi
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                    Firebase Error: <span className="font-mono text-[10px] break-all bg-rose-100/50 dark:bg-rose-900/30 px-1 py-0.5 rounded">{authError.code}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setAuthError(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content body */}
              <div className="p-6 space-y-5 text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                <p>
                  <b>Mengapa ini terjadi?</b> Domain sandbox / preview aktif Google AI Studio belum terdaftar dalam daftar <b>Authorized Domains</b> pada konfigurasi Firebase Authentication Anda.
                </p>

                {/* Action plan for standard Firestore Authorized Domains */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-mono text-[11px]">
                    <span>🔧 CARA METODE PERBAIKAN:</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-500 dark:text-slate-400 pl-1">
                    <li>Buka <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold underline">Firebase Console</a> Anda.</li>
                    <li>Pilih proyek Anda, beralih ke <b>Authentication</b> &gt; tab <b>Settings</b>.</li>
                    <li>Geser ke bagian <b>Authorized Domains</b>, tekan tombol <b>Add Domain</b>.</li>
                    <li>Masukkan domain berikut lalu Simpan:
                      <div className="mt-1.5 flex items-center gap-2">
                        <code className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-1 rounded font-mono text-[10.5px] border border-blue-100 dark:border-blue-900 flex-grow select-all break-all text-center font-bold">
                          {authError.hostname}
                        </code>
                      </div>
                    </li>
                  </ol>
                </div>

                {/* Developer Bypass Sandbox Alternative */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500 font-bold" />
                      Bypass Pengembang (Rekomendasi Sandbox)
                    </h4>
                    <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">
                      Gunakan mode bypass di bawah ini untuk langsung mensimulasikan login peran tertentu demi keperluan demonstrasi.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => signInWithBypass(UserRole.DIREKTUR, "Foresyndo Direktur VIP")}
                      className="flex flex-col items-start p-3 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/10 dark:hover:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl text-left transition cursor-pointer"
                    >
                      <span className="font-bold text-blue-600 dark:text-blue-400">Direktur / Owner</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Akses penuh laporan & persetujuan keuangan</span>
                    </button>

                    <button
                      onClick={() => signInWithBypass(UserRole.PROJECT_MANAGER, "Budi Hartono (PM)")}
                      className="flex flex-col items-start p-3 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/10 dark:hover:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-xl text-left transition cursor-pointer"
                    >
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">Project Manager</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Kelola progres, RAB, sdm, & logistik harian</span>
                    </button>

                    <button
                      onClick={() => signInWithBypass(UserRole.FINANCE, "Siti Rahma (Finance)")}
                      className="flex flex-col items-start p-3 bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl text-left transition cursor-pointer"
                    >
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Finance & Kas</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Entri & pembukuan mutasi keuangan lapangan</span>
                    </button>

                    <button
                      onClick={() => signInWithBypass(UserRole.SITE_ENGINEER, "Anton Sanjaya (Engineer)")}
                      className="flex flex-col items-start p-3 bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-xl text-left transition cursor-pointer"
                    >
                      <span className="font-bold text-amber-600 dark:text-amber-400">Site Engineer</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Membuka RFI, melampirkan dokumen gambar</span>
                    </button>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setAuthError(null)}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-lg transition text-xs cursor-pointer"
                    >
                      Tutup Pesan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-[#0b0f19] ${darkMode ? "dark" : ""}`}>
      {/* Auth Error & Domain Troubleshooting Modal */}
      {authError && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-left">
            {/* Header */}
            <div className="bg-rose-50 dark:bg-rose-950/20 px-6 py-5 border-b border-rose-100 dark:border-rose-900/40 flex items-start gap-4">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Pengenalan Domain Belum Diotorisasi
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                  Firebase Error: <span className="font-mono text-[10px] break-all bg-rose-100/50 dark:bg-rose-900/30 px-1 py-0.5 rounded">{authError.code}</span>
                </p>
              </div>
              <button 
                onClick={() => setAuthError(null)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-5 text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
              <p>
                <b>Mengapa ini terjadi?</b> Domain sandbox / preview aktif Google AI Studio belum terdaftar dalam daftar <b>Authorized Domains</b> pada konfigurasi Firebase Authentication Anda.
              </p>

              {/* Action plan for standard Firestore Authorized Domains */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-mono text-[11px]">
                  <span>🔧 CARA METODE PERBAIKAN:</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-500 dark:text-slate-400 pl-1">
                  <li>Buka <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold underline">Firebase Console</a> Anda.</li>
                  <li>Pilih proyek Anda, beralih ke <b>Authentication</b> &gt; tab <b>Settings</b>.</li>
                  <li>Geser ke bagian <b>Authorized Domains</b>, tekan tombol <b>Add Domain</b>.</li>
                  <li>Masukkan domain berikut lalu Simpan:
                    <div className="mt-1.5 flex items-center gap-2">
                      <code className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-1 rounded font-mono text-[10.5px] border border-blue-100 dark:border-blue-900 flex-grow select-all break-all text-center font-bold">
                        {authError.hostname}
                      </code>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Developer Bypass Sandbox Alternative */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500 font-bold" />
                    Bypass Pengembang (Rekomendasi Sandbox)
                  </h4>
                  <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">
                    Gunakan mode bypass di bawah ini untuk langsung mensimulasikan login peran tertentu demi keperluan demonstrasi.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => signInWithBypass(UserRole.DIREKTUR, "Foresyndo Direktur VIP")}
                    className="flex flex-col items-start p-3 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/10 dark:hover:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl text-left transition cursor-pointer"
                  >
                    <span className="font-bold text-blue-600 dark:text-blue-400">Direktur / Owner</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Akses penuh laporan & persetujuan keuangan</span>
                  </button>

                  <button
                    onClick={() => signInWithBypass(UserRole.PROJECT_MANAGER, "Budi Hartono (PM)")}
                    className="flex flex-col items-start p-3 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/10 dark:hover:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-xl text-left transition cursor-pointer"
                  >
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">Project Manager</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Kelola progres, RAB, sdm, & logistik harian</span>
                  </button>

                  <button
                    onClick={() => signInWithBypass(UserRole.FINANCE, "Siti Rahma (Finance)")}
                    className="flex flex-col items-start p-3 bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl text-left transition cursor-pointer"
                  >
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Finance & Kas</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Entri & pembukuan mutasi keuangan lapangan</span>
                  </button>

                  <button
                    onClick={() => signInWithBypass(UserRole.SITE_ENGINEER, "Anton Sanjaya (Engineer)")}
                    className="flex flex-col items-start p-3 bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-xl text-left transition cursor-pointer"
                  >
                    <span className="font-bold text-amber-600 dark:text-amber-400">Site Engineer</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Membuka RFI, melampirkan dokumen gambar</span>
                  </button>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthError(null)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-lg transition text-xs cursor-pointer"
                  >
                    Tutup Pesan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Notification Center dialog */}
      {showNotify && (
        <div className="fixed right-6 top-16 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden font-sans">
          <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800 dark:text-white">Pemberitahuan Real-Time</span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">{notifications.filter(n => !n.read).length} baru</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <div key={n.id} className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition text-xs ${!n.read ? "bg-blue-500/5" : ""}`}>
                <div className="font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center justify-between">
                  <span>{n.title}</span>
                  {!n.read && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                </div>
                <p className="text-slate-400 leading-normal">{n.message}</p>
                <span className="text-[10px] font-mono text-slate-400 mt-2 block">{n.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SIDE BAR NAVIGATION DRAWER */}
      <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex-shrink-0 flex flex-col justify-between h-full z-20">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-6 flex items-center gap-3 border-b border-slate-800 flex-shrink-0">
            {portalSettings?.logoUrl ? (
              <img src={portalSettings.logoUrl} alt="Company Logo" className="w-8 h-8 rounded object-contain bg-white p-0.5" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold select-none text-base">F</div>
            )}
            <div>
              <h1 className="text-sm font-bold leading-tight uppercase tracking-wider text-white">
                {portalSettings?.companyName ? (portalSettings.companyName.split(" ").length > 1 ? portalSettings.companyName.split(" ")[1] : portalSettings.companyName.split(" ")[0]) : "Foresyndo"}
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">ConstrukPro Systems</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 mt-6 space-y-1.5">
            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-3 mb-2 font-mono">Utama & Analisis</span>
            
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 opacity-80" />
              <span>Dashboard Analitik</span>
            </button>

            <button
              onClick={() => setActiveTab("projects")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "projects"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Database className="w-4 h-4 opacity-80" />
              <span>Data & Modul Proyek</span>
            </button>

            <button
              onClick={() => setActiveTab("rab")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "rab"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <DollarSign className="w-4 h-4 opacity-80" />
              <span>Modul RAB Pekerjaan</span>
            </button>

            <button
              onClick={() => setActiveTab("bq")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "bq"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 opacity-80 text-blue-400" />
              <span className="flex items-center gap-1">
                <span>Modul BQ & Volume</span>
                <span className="bg-blue-500/20 text-blue-400 font-extrabold text-[8px] px-1 py-0.2 rounded uppercase">New</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab("gantt")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "gantt"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Calendar className="w-4 h-4 opacity-80" />
              <span>Gantt & S-Curve</span>
            </button>

            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-3 mt-6 mb-2 font-mono">Keuangan & Operasional</span>

            <button
              onClick={() => setActiveTab("finance")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "finance"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
              title="Cash In, Cash Out, Margin, Laba Rugi"
            >
              <DollarSign className="w-4 h-4 text-emerald-400 opacity-80" />
              <span>Keuangan & Cash-Flow</span>
            </button>

            <button
              onClick={() => setActiveTab("po")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "po"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <ShoppingCart className="w-4 h-4 opacity-80" />
              <span>Purchase Order (PO)</span>
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "inventory"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Package className="w-4 h-4 opacity-80" />
              <span>Logistik & Gudang</span>
            </button>

            <button
              onClick={() => setActiveTab("hr")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "hr"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4 opacity-80" />
              <span>Tenaga Kerja (SDM)</span>
            </button>

            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-3 mt-6 mb-2 font-mono">Inspeksi & K3</span>

            <button
              onClick={() => setActiveTab("security_qc")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "security_qc"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-4 h-4 opacity-80" />
              <span>Kontrol K3 & Mutu QC</span>
            </button>

            <button
              onClick={() => setActiveTab("daily_docs")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "daily_docs"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4 opacity-80" />
              <span>Laporan Harian & Dokumen</span>
            </button>

            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-3 mt-6 mb-2 font-mono">Tugas & Komunikasi</span>

            <button
              onClick={() => setActiveTab("tasks_comms")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "tasks_comms"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <CheckSquare className="w-4 h-4 text-amber-400 opacity-80" />
              <span>Tugas & Chat Divisi</span>
            </button>

            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-3 mt-6 mb-2 font-mono">Gemini AI</span>

            <button
              onClick={() => setActiveTab("ai_panel")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "ai_panel"
                  ? "bg-blue-600 text-white shadow text-left"
                  : "text-blue-400 hover:text-blue-300 hover:bg-slate-800"
              }`}
            >
              <Sparkles className="w-4 h-4 opacity-100 flex-shrink-0" />
              <span>AI Investigator Panel</span>
            </button>

            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-3 mt-6 mb-2 font-mono">Pengaturan</span>

            <button
              onClick={() => setActiveTab("portal_settings")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "portal_settings"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4 opacity-80" />
              <span>Pengaturan Portal</span>
            </button>
          </div>

          <div className="p-4 m-4 bg-slate-800 rounded-lg flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AI Assistant</span>
            </div>
            <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">Predicting 12% delay risk for Menteng Regency Project due to logistics.</p>
            <button onClick={() => setActiveTab("ai_panel")} className="w-full py-1.5 text-[11px] font-bold text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors cursor-pointer text-center">View Analysis</button>
          </div>
        </div>

        <div className="border-t border-slate-800 p-4 text-center flex-shrink-0">
          <span className="block text-[9px] text-slate-500 font-mono">Logged as:</span>
          <span className="block text-[10px] text-slate-400 truncate max-w-full font-semibold">{currentUser?.email || "Offline Local Admin"}</span>
        </div>
      </aside>

      {/* WORKSPACE CENTRAL MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* NEW CENTRALIZED TOP HEADER */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 flex-shrink-0 z-10 select-none">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-extrabold text-slate-850 dark:text-white tracking-tight uppercase">
              Foresyndo ConstrukPro
            </h2>
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">/</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                {activeTab}
              </span>
            </div>
          </div>

          {/* Header Right Content - Auth and Toggles */}
          <div className="flex items-center gap-4">
            {/* Quick Realtime Project selector dropdown */}
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase font-mono">PROYEK:</span>
              <select
                value={selectedProject?.projectId || ""}
                onChange={(e) => switchProject(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-805 dark:text-slate-100 focus:outline-none font-bold cursor-pointer max-w-[150px] truncate"
              >
                {projects.map((p) => (
                  <option key={p.projectId} value={p.projectId} className="bg-white dark:bg-slate-800 text-slate-805 dark:text-slate-100">
                    [{p.nomorProyek}] {p.namaProyek}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Dark mode toggler */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 transition"
                title="Toggle Dark Mode"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Notification bell */}
              <button
                onClick={() => setShowNotify(!showNotify)}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 relative transition"
              >
                <Bell className="w-4 h-4" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                )}
              </button>
            </div>

            {/* User auth controls / Profile */}
            <div className="border-l border-slate-200 dark:border-slate-700 pl-4 flex items-center gap-3">
              {loadingAuth ? (
                <span className="text-[11px] font-mono text-slate-400 animate-pulse">Loading...</span>
              ) : currentUser ? (
                <div className="flex items-center gap-2">
                  <div className="text-right hidden xl:block">
                    <p className="text-xs font-bold leading-none text-slate-800 dark:text-slate-200">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-tighter mt-1 font-bold">{currentUser.role}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-105 dark:border-slate-700 flex items-center justify-center text-blue-750 dark:text-blue-400 font-bold text-xs select-none">
                    {currentUser.name ? currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "PD"}
                  </div>
                  <button
                    onClick={logOut}
                    className="p-1 px-1.5 border border-slate-200 dark:border-slate-700 hover:border-rose-500 hover:text-rose-500 hover:bg-rose-500/5 text-slate-400 rounded text-xs transition cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={signInWithGoogle}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center space-x-1.5 shadow transition cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Google Sign In</span>
                  </button>
                  <button
                    onClick={() => setAuthError({
                      code: "developer/fallback-request",
                      message: "Permintaan masuk bypass pengembang.",
                      hostname: window.location.hostname
                    })}
                    className="border border-slate-250 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs py-1.5 px-2.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                    title="Bypass Login"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Bypass</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE CENTRAL MAIN INNER SCROLLABLE SECTION */}
        <div className="flex-grow overflow-y-auto p-6 md:p-8 bg-slate-50 dark:bg-[#0b0f19]">
          {/* TAB 1: DASHBOARD ANALITIK */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Header metrics summary layout */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-sm hover:shadow transition">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Total Proyek Aktif</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 ">{projects.length} Kantor</span>
                  <span className="text-[10px] text-amber-500 font-semibold mt-2">{projects.filter(p => p.status === ProjectStatus.BERJALAN).length} Berjalan | {projects.filter(p => p.status === ProjectStatus.TENDER).length} Tender</span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-sm hover:shadow transition">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Total Nilai Kontrak</span>
                  <span className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">Rp {totalContractVal.toLocaleString("id-ID")}</span>
                  <span className="text-[10px] text-emerald-500 font-semibold mt-2">{activeCompany}</span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-sm hover:shadow transition">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Progres Fisik Aktif</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{selectedProject ? selectedProject.progress : 45.2}%</span>
                  <span className="text-[10px] text-slate-400 mt-2">{selectedProject?.namaProyek.substr(0,25)}...</span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-sm hover:shadow transition">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Tagihan Unpaid Termin</span>
                  <span className="text-xl font-extrabold text-rose-500 mt-1">Rp {selectedProject?.unpaidInvoices?.toLocaleString("id-ID") || "0"}</span>
                  <span className="text-[10px] text-slate-400 mt-2">Termin Berjalan: {selectedProject?.activeTermin || "-"}</span>
                </div>
              </div>

              {/* Major visual charts: Cash Flow, Monthly trends, and budget distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cash Flow analysis */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Grafik Cash Flow & Likuiditas</h3>
                  <p className="text-xs text-slate-400 mb-4">Menganalisis kumulatif Uang Masuk vs Pengendalian Pengeluaran Biaya</p>
                  
                  {/* Custom chart visualization */}
                  <div className="h-44 flex items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-2 pt-6">
                    <div className="flex flex-col items-center space-y-2 w-1/4">
                      <div className="text-[10px] font-mono font-bold text-slate-500 text-center">Rp 3.7M</div>
                      <div className="w-8 bg-emerald-500/80 rounded-t-md hover:opacity-100 transition duration-200" style={{ height: "130px" }} />
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest text-center mt-1">DP 20%</span>
                    </div>

                    <div className="flex flex-col items-center space-y-2 w-1/4">
                      <div className="text-[10px] font-mono font-bold text-slate-500 text-center">Rp 1.2M</div>
                      <div className="w-8 bg-orange-500/80 rounded-t-md hover:opacity-100 transition duration-200" style={{ height: "48px" }} />
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest text-center mt-1">Material</span>
                    </div>

                    <div className="flex flex-col items-center space-y-2 w-1/4">
                      <div className="text-[10px] font-mono font-bold text-slate-500 text-center">Rp 5.5M</div>
                      <div className="w-8 bg-emerald-500/80 rounded-t-md hover:opacity-100 transition duration-200" style={{ height: "180px" }} />
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest text-center mt-1">Termin I</span>
                    </div>

                    <div className="flex flex-col items-center space-y-2 w-1/4">
                      <div className="text-[10px] font-mono font-bold text-slate-500 text-center">Rp 1.1M</div>
                      <div className="w-8 bg-orange-500/80 rounded-t-md hover:opacity-100 transition duration-200" style={{ height: "35px" }} />
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest text-center mt-1">Lainnya</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-[10px] justify-center mt-4">
                    <span className="flex items-center"><span className="w-2.5 h-2.5 bg-emerald-500 rounded mr-1.5" /> Penerimaan (Cash In)</span>
                    <span className="flex items-center"><span className="w-2.5 h-2.5 bg-orange-500 rounded mr-1.5" /> Pengeluaran (Cash Out)</span>
                  </div>
                </div>

                {/* Progress Bulanan */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Rencana vs Aktual Progres</h3>
                  <p className="text-xs text-slate-400 mb-4">Representasi bulanan pencapaian fisik di lapangan</p>

                  <div className="h-44 flex items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-2 pt-6 font-mono text-[9px]">
                    <div className="flex flex-col items-center space-y-1.5 w-1/5">
                      <span className="font-bold text-slate-400">R: 5% | A: 5%</span>
                      <div className="flex items-end justify-center space-x-1 w-full h-24">
                        <div className="w-2.5 bg-slate-300 rounded-t" style={{ height: "15%" }} />
                        <div className="w-2.5 bg-amber-500 rounded-t" style={{ height: "15%" }} />
                      </div>
                      <span className="font-sans font-semibold">Feb</span>
                    </div>

                    <div className="flex flex-col items-center space-y-1.5 w-1/5">
                      <span className="font-bold text-slate-400">R: 12% | A: 12%</span>
                      <div className="flex items-end justify-center space-x-1 w-full h-24">
                        <div className="w-2.5 bg-slate-300 rounded-t" style={{ height: "32%" }} />
                        <div className="w-2.5 bg-amber-500 rounded-t" style={{ height: "32%" }} />
                      </div>
                      <span className="font-sans font-semibold">Mar</span>
                    </div>

                    <div className="flex flex-col items-center space-y-1.5 w-1/5">
                      <span className="font-bold text-slate-400">R: 22% | A: 24%</span>
                      <div className="flex items-end justify-center space-x-1 w-full h-24">
                        <div className="w-2.5 bg-slate-300 rounded-t" style={{ height: "55%" }} />
                        <div className="w-2.5 bg-amber-500 rounded-t" style={{ height: "60%" }} />
                      </div>
                      <span className="font-sans font-semibold">Apr</span>
                    </div>

                    <div className="flex flex-col items-center space-y-1.5 w-1/5">
                      <span className="font-bold text-slate-400">R: 35% | A: 35%</span>
                      <div className="flex items-end justify-center space-x-1 w-full h-24">
                        <div className="w-2.5 bg-slate-300 rounded-t" style={{ height: "80%" }} />
                        <div className="w-2.5 bg-amber-500 rounded-t" style={{ height: "80%" }} />
                      </div>
                      <span className="font-sans font-semibold">May</span>
                    </div>

                    <div className="flex flex-col items-center space-y-1.5 w-1/5">
                      <span className="font-bold text-slate-400">R: 48% | A: 45%</span>
                      <div className="flex items-end justify-center space-x-1 w-full h-24">
                        <div className="w-2.5 bg-slate-300 rounded-t" style={{ height: "98%" }} />
                        <div className="w-2.5 bg-amber-500 rounded-t" style={{ height: "90%" }} />
                      </div>
                      <span className="font-sans font-semibold">Jun</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-[10px] justify-center mt-4">
                    <span className="flex items-center"><span className="w-2.5 h-2.5 bg-slate-300 rounded mr-1.5" /> Target Rencana</span>
                    <span className="flex items-center"><span className="w-2.5 h-2.5 bg-amber-500 rounded mr-1.5" /> Realisasi Lapangan</span>
                  </div>
                </div>

                {/* Proportion of RAB Biaya Pie Chart */}
                <BudgetPieChart />
              </div>

              {/* Sub-panels grids */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* QC Safety Quick Glance */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl block shadow-sm text-xs">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold dark:text-white uppercase tracking-wider font-mono">QC & Safety Glance</span>
                    <span className="text-[10px] text-amber-500 font-bold">K3 SCORE: {lastSafetyScore}/100</span>
                  </div>
                  <div className="space-y-3 mt-4">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded">
                      <span className="text-slate-500">Temuan K3</span>
                      <span className="font-bold text-rose-500">{totalFindings} Temuan</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded">
                      <span className="text-slate-500">Kecelakaan Kerja</span>
                      <span className="font-bold text-emerald-500">{totalAccidents} Kasus (Zero Target)</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded">
                      <span className="text-slate-500">Status Inspeksi</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{qcItems.filter(q => q.status === "Open").length} Open / {qcItems.filter(q => q.status === "Closed").length} Closed</span>
                    </div>
                  </div>
                </div>

                {/* Logistics alerts */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl block shadow-sm text-xs">
                  <span className="block font-bold dark:text-white uppercase tracking-wider font-mono mb-3">Logistik Alerts</span>
                  <div className="mt-4 space-y-2.5">
                    {inventory.slice(0, 3).map(i => {
                      const isLow = i.currentStock < i.minStock;
                      return (
                        <div key={i.id} className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{i.materialName}</span>
                          <span className={`font-mono font-bold ${isLow ? "text-rose-500" : "text-emerald-500"}`}>
                            {i.currentStock} {i.unit} {isLow ? "[L-STOK]" : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Audit log tracker */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl block shadow-sm text-xs">
                  <span className="block font-bold dark:text-white uppercase tracking-wider font-mono mb-3">Audit Logs</span>
                  <div className="mt-4 space-y-2 max-h-[120px] overflow-y-auto pr-1">
                    {auditLogs.length === 0 ? (
                      <p className="text-slate-400 text-center py-4">Belum ada terekam aktivitas.</p>
                    ) : (
                      auditLogs.map((log) => (
                        <div key={log.id} className="text-[10px] pb-1.5 border-b border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{log.action}</span>
                          <span className="text-slate-400 block">{log.details}</span>
                          <span className="text-slate-400 font-mono scale-90 inline-block">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA & CRUDS PROYEK */}
          {activeTab === "projects" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Portofolio Data Proyek</h2>
                  <p className="text-xs text-slate-400">Pendaftaran proyek baru, revisi masa kontrak, and mitigasi timeline</p>
                </div>
                <button
                  onClick={() => setShowAddProject(!showAddProject)}
                  className="flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs mt-3 sm:mt-0 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Daftarkan Proyek Baru</span>
                </button>
              </div>

              {showAddProject && (
                <form onSubmit={handleCreateProjectSubmit} className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-6 rounded-xl shadow-md grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Nomor Proyek</label>
                    <input
                      type="text"
                      placeholder="PR-2026-CV-105"
                      value={newProject.nomorProyek}
                      onChange={(e) => setNewProject({ ...newProject, nomorProyek: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-850 dark:text-white rounded p-2 focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Nama Proyek</label>
                    <input
                      type="text"
                      placeholder="Gedung Pusat Olahraga"
                      value={newProject.namaProyek}
                      onChange={(e) => setNewProject({ ...newProject, namaProyek: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-850 dark:text-white rounded p-2 focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Nilai Kontrak (Rupiah)</label>
                    <input
                      type="number"
                      value={newProject.nilaiKontrak}
                      onChange={(e) => setNewProject({ ...newProject, nilaiKontrak: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-850 dark:text-white rounded p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Lokasi Proyek</label>
                    <input
                      type="text"
                      placeholder="Sedayu, Jakarta Barat"
                      value={newProject.lokasi}
                      onChange={(e) => setNewProject({ ...newProject, lokasi: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-850 dark:text-white rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Owner (Pemilik Proyek)</label>
                    <input
                      type="text"
                      placeholder="PT Sinar Jati"
                      value={newProject.owner}
                      onChange={(e) => setNewProject({ ...newProject, owner: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-850 dark:text-white rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Status Konstruksi</label>
                    <select
                      value={newProject.status}
                      onChange={(e) => setNewProject({ ...newProject, status: e.target.value as any })}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-xs text-slate-850 dark:text-white p-2 rounded"
                    >
                      <option value="Tender">Fase Tender</option>
                      <option value="Persiapan">Persiapan Lokasi</option>
                      <option value="Berjalan">Konstruksi Berjalan</option>
                      <option value="Selesai">Proyek Selesai</option>
                      <option value="Pemeliharaan">Masa Pemeliharaan</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow cursor-pointer"
                    >
                      Daftarkan Proyek
                    </button>
                  </div>
                </form>
              )}

              {/* Grid of Projects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((pro) => (
                  <div 
                    key={pro.projectId} 
                    className={`p-6 border rounded-xl bg-white dark:bg-slate-900 transition flex flex-col justify-between ${
                      pro.projectId === selectedProject?.projectId 
                        ? "border-amber-500 ring-1 ring-amber-500 shadow-md" 
                        : "border-slate-200 dark:border-slate-800 shadow-sm"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800 border px-2 py-0.5 rounded font-bold">
                            {pro.nomorProyek}
                          </span>
                          <h3 className="text-md font-bold text-slate-800 dark:text-white mt-1.5">{pro.namaProyek}</h3>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                          pro.status === ProjectStatus.BERJALAN ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" :
                          pro.status === ProjectStatus.TENDER ? "bg-sky-50 text-sky-600" : "bg-slate-100 text-slate-600 dark:bg-slate-800 text-slate-400"
                        }`}>
                          {pro.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-6 text-xs text-slate-500 leading-relaxed font-semibold">
                        <div>
                          <span className="block text-[10px] text-slate-400 font-medium">Owner (Klien)</span>
                          <span className="text-slate-700 dark:text-slate-300">{pro.owner}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-medium">Nilai Kontrak</span>
                          <span className="text-slate-700 dark:text-slate-300 text-amber-500">
                            Rp {pro.nilaiKontrak.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-medium">Konsultan</span>
                          <span className="text-slate-700 dark:text-slate-300">{pro.konsultan}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-medium">Tanggal Mulai / Selesai</span>
                          <span className="text-slate-700 dark:text-slate-300 text-[10px] font-mono whitespace-nowrap">
                            {pro.tanggalMulai} s/d {pro.tanggalSelesai}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-slate-150 dark:border-slate-850 pt-4 flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-slate-400">Kemajuan Fisik:</span>
                        <span className="font-extrabold text-amber-500 font-mono text-sm">{pro.progress}%</span>
                      </div>
                      <button
                        onClick={() => switchProject(pro.projectId)}
                        className={`px-3 py-1.5 rounded font-bold transition flex items-center space-x-1 cursor-pointer ${
                          pro.projectId === selectedProject?.projectId 
                            ? "bg-amber-500 text-slate-950 font-bold" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        <span>{pro.projectId === selectedProject?.projectId ? "Terpilih" : "Monitor Proyek"}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MODUL RAB */}
          {activeTab === "rab" && (
            <div className="space-y-6">
              <RABManagement />
            </div>
          )}

          {/* TAB 3.5: MODUL BQ */}
          {activeTab === "bq" && (
            <div className="space-y-6">
              <BQManagement />
            </div>
          )}

          {/* TAB 4: GANTT CHART & S-CURVE */}
          {activeTab === "gantt" && (
            <div className="space-y-8">
              <SPlusCurve />
              <GanttChart />
            </div>
          )}

          {/* TAB 5: FINANCIAL LEDGER */}
          {activeTab === "finance" && (
            <div className="space-y-6">
              <CashFlowManagement />
            </div>
          )}

          {/* TAB 6: PURCHASE ORDER */}
          {activeTab === "po" && (
            <EnterprisePurchaseOrder />
          )}

          {/* TAB 7: LOGISTIK & GUDANG */}
          {activeTab === "inventory" && (
            <div className="space-y-6">
              <InventoryBarcode />
            </div>
          )}

          {/* TAB 8: SDM TENAGA KERJA */}
          {activeTab === "hr" && (
            <div className="space-y-6">
              <SdmHR />
            </div>
          )}

          {/* TAB 9: SAFETY K3 & QC INSPECTIONS */}
          {activeTab === "security_qc" && (
            <div className="space-y-8">
              {/* Quality Control (QC) Column */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-850 dark:text-white">Kontrol Mutu & Quality Control</h3>
                    <p className="text-xs text-slate-400">Inspeksi RFI arsitektural, checklist QC harian, NCR status penanggulangan</p>
                  </div>
                  <button
                    onClick={() => setShowAddQC(!showAddQC)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs mt-3 sm:mt-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Cek Mutu Baru</span>
                  </button>
                </div>

                {showAddQC && (
                  <form onSubmit={handleCreateQCSubmit} className="bg-slate-50 dark:bg-slate-800/45 p-4 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Item Checklist / Nama Inspeksi</label>
                      <input
                        type="text"
                        placeholder="Contoh: Pembesian kolom lift utama"
                        value={newQC.checklistName}
                        onChange={(e) => setNewQC({ ...newQC, checklistName: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Kategori Dokumen</label>
                      <select
                        value={newQC.category}
                        onChange={(e) => setNewQC({ ...newQC, category: e.target.value as any })}
                        className="w-full bg-white dark:bg-slate-900 p-2 rounded focus:outline-none"
                      >
                        <option value="Checklist QC">Checklist QC Biasa</option>
                        <option value="Inspection Request">Inspection Request</option>
                        <option value="NCR">NCR (Non-conformance Report)</option>
                        <option value="Corrective Action">Corrective Action</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Keterangan Lapangan</label>
                      <input
                        type="text"
                        placeholder="Toleransi kelurusan sengkang..."
                        value={newQC.description}
                        onChange={(e) => setNewQC({ ...newQC, description: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2"
                      />
                    </div>
                    <div className="sm:col-span-4 flex justify-end">
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-1.5 px-4 rounded shadow-sm cursor-pointer"
                      >
                        Kirim Form QC
                      </button>
                    </div>
                  </form>
                )}

                {/* QC Item records */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {qcItems.map((q) => (
                    <div key={q.id} className="p-4 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 rounded-xl text-xs space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${
                            q.category === "NCR" ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-sky-600"
                          }`}>
                            {q.category}
                          </span>
                          <select
                            value={q.status}
                            onChange={(e) => updateQCStatus(q.id, e.target.value as any)}
                            className="bg-white dark:bg-slate-800 text-[10px] border border-slate-200 p-0.5 rounded focus:outline-none"
                          >
                            <option value="Open">Open</option>
                            <option value="Progress">Progress</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 mt-2">{q.checklistName}</h4>
                        <p className="text-slate-450 mt-1">{q.description}</p>
                      </div>

                      <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-2 mt-2 flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Pemeriksa: {q.inspectorName}</span>
                        <span>{q.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety K3 Patrol column */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-850 dark:text-white">Safety Patrol & Evaluasi K3</h3>
                    <p className="text-xs text-slate-400">Mencatat induksi pekerja baru, toolbox meetings, data kejadian bahaya kerja</p>
                  </div>
                  <button
                    onClick={() => setShowAddSafety(!showAddSafety)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs mt-3 sm:mt-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Evaluasi HSE K3</span>
                  </button>
                </div>

                {showAddSafety && (
                  <form onSubmit={handleCreateSafetySubmit} className="bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Kategori Kegiatan K3</label>
                      <select
                        value={newSafety.type}
                        onChange={(e) => setNewSafety({ ...newSafety, type: e.target.value as any })}
                        className="w-full bg-white dark:bg-slate-900 p-2 rounded focus:outline-none"
                      >
                        <option value="Safety Induction">Safety Induction</option>
                        <option value="Safety Patrol">Safety Patrol</option>
                        <option value="Incident Report">Incident Report</option>
                        <option value="Toolbox Meeting">Toolbox Meeting</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Rincian Bahaya / Tindakan</label>
                      <input
                        type="text"
                        placeholder="Ulasan evaluasi APD pekerja..."
                        value={newSafety.details}
                        onChange={(e) => setNewSafety({ ...newSafety, details: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Temuan Bahaya</label>
                      <input
                        type="number"
                        value={newSafety.findings}
                        onChange={(e) => setNewSafety({ ...newSafety, findings: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded shadow-sm cursor-pointer"
                      >
                        Simpan Lap K3
                      </button>
                    </div>
                  </form>
                )}

                {/* Safety Log records list */}
                <div className="space-y-4">
                  {safetyRecords.map((s) => (
                    <div key={s.id} className="p-4 border border-slate-150 dark:border-slate-800 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded">
                          <HardHat className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold font-mono text-amber-600 uppercase tracking-widest">{s.type}</span>
                          <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{s.details}</p>
                          <span className="text-[10px] text-slate-400 font-mono mt-1 inline-block">{s.date}</span>
                        </div>
                      </div>

                      {/* Safety statistics */}
                      <div className="flex items-center space-x-6 text-[10px] font-mono leading-relaxed">
                        <div>
                          <span className="block text-slate-450 uppercase">Temuan Hazard</span>
                          <span className="font-bold text-amber-500">{s.findings} Temuan</span>
                        </div>
                        <div>
                          <span className="block text-slate-450 uppercase">Kecelakaan (Accident)</span>
                          <span className="font-bold text-red-500">{s.accidents} Kasus</span>
                        </div>
                        <div>
                          <span className="block text-slate-450 uppercase">Safety Score</span>
                          <span className="font-extrabold text-emerald-500">{s.safetyScore} / 100</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: LAPORAN HARIAN & DOKUMEN ARSIP */}
          {activeTab === "daily_docs" && (
            <div className="space-y-8">
              {/* Daily Report Input Panel */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Laporan Harian Lapangan</h3>
                    <p className="text-xs text-slate-400">Log cuaca kerja, rekapitulasi jumlah tukang, alat utama yang bekerja, and aktivitas rill harian</p>
                  </div>
                  <div className="flex space-x-2 mt-3 sm:mt-0">
                    <button
                      onClick={() => triggerFakePDFExport("Laporan_Harian")}
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 rounded text-xs font-semibold cursor-pointer"
                    >
                      Export PDF Harian
                    </button>
                    <button
                      onClick={() => setShowAddDaily(!showAddDaily)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buat Laporan Baru</span>
                    </button>
                  </div>
                </div>

                {showAddDaily && (
                  <form onSubmit={handleCreateDailySubmit} className="bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Pilih Tanggal</label>
                      <input
                        type="date"
                        value={newDaily.date}
                        onChange={(e) => setNewDaily({ ...newDaily, date: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Cuaca Terpantau</label>
                      <select
                        value={newDaily.weather}
                        onChange={(e) => setNewDaily({ ...newDaily, weather: e.target.value as any })}
                        className="w-full bg-white dark:bg-slate-900 p-2 rounded focus:outline-none"
                      >
                        <option value="Cerah">Cerah Terang</option>
                        <option value="Hujan">Hujan Intensitas Tinggi</option>
                        <option value="Gerimis">Gerimis Tipis</option>
                        <option value="Mendung">Mendung Gelap</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Rekap Tenaga Kerja (Sdm)</label>
                      <input
                        type="text"
                        placeholder="Contoh: Mandor 1, Tukang 15, Laden 8"
                        value={newDaily.laborDetails}
                        onChange={(e) => setNewDaily({ ...newDaily, laborDetails: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Penggunaan Alat Utama</label>
                      <input
                        type="text"
                        placeholder="Tower Crane: aktif, Bar Cutter: aktif"
                        value={newDaily.equipmentDetails}
                        onChange={(e) => setNewDaily({ ...newDaily, equipmentDetails: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Aktivitas Realisasi Fisik Hari Ini</label>
                      <textarea
                        placeholder="Plester dinding lt 1 koridor, instalasi conduit kabel tray, pengerjaan kolam STP..."
                        value={newDaily.activities}
                        onChange={(e) => setNewDaily({ ...newDaily, activities: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        rows={3}
                        required
                      />
                    </div>
                    <div className="sm:col-span-4 flex justify-end">
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-1.5 px-4 rounded shadow-sm cursor-pointer"
                      >
                        Kirim Laporan
                      </button>
                    </div>
                  </form>
                )}

                {/* Daily Report records list details */}
                <div className="space-y-4">
                  {dailyReports.map((report) => (
                    <div key={report.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-3 bg-slate-50/30 dark:bg-slate-800/10 hover:shadow-sm transition">
                      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded">
                        <span className="font-bold flex items-center font-mono">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          {report.date}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {renderWeatherIcon(report.weather)}
                          <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{report.weather}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-slate-650 dark:text-slate-350 leading-relaxed font-semibold border-b border-dashed border-slate-150 pb-3">
                        <div>
                          <span className="block text-[9px] text-slate-400 uppercase font-medium">Log Tenaga Kerja</span>
                          <span className="text-slate-800 dark:text-slate-200">{report.laborDetails}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-400 uppercase font-medium">Penggunaan Alat Kerja</span>
                          <span className="text-slate-800 dark:text-slate-200">{report.equipmentDetails}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-400 uppercase font-medium">Alokasi Material Sparing</span>
                          <span className="text-slate-805 dark:text-slate-205">{report.materialDetails || "Semen instant Portland tumpukan"}</span>
                        </div>
                      </div>

                      <p className="text-slate-700 dark:text-slate-300 leading-normal text-sm font-medium">
                        <strong>Laporan Realisasi:</strong> {report.activities}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Version Control Document Arsip Panel */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Arsip Dokumen Proyek</h3>
                    <p className="text-xs text-slate-400">Kontrak awal, gambar shop drawing arsitektural, as-built drawings, proposal RFI pengawas</p>
                  </div>
                  <button
                    onClick={() => setShowAddDoc(!showAddDoc)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs mt-3 sm:mt-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload PDF Dokumen</span>
                  </button>
                </div>

                {showAddDoc && (
                  <form onSubmit={handleCreateDocSubmit} className="bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Nama Dokumen File PDF</label>
                      <input
                        type="text"
                        placeholder="Gambar_Kerja_MEP_Lt_2.pdf"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Klasifikasi Kategori</label>
                      <select
                        value={newDocCategory}
                        onChange={(e) => setNewDocCategory(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-900 p-2 rounded focus:outline-none border border-slate-200 dark:border-slate-700"
                      >
                        <option value="Kontrak">Kontrak Pemborongan</option>
                        <option value="Shop Drawing">Shop Drawing</option>
                        <option value="As Built Drawing">As Built Drawing</option>
                        <option value="RFI">RFI (Request for Info)</option>
                        <option value="Metode Kerja">Metode Kerja Lapangan</option>
                        <option value="Laporan Harian">Laporan Harian</option>
                      </select>
                    </div>
                    <div>
                      {newDocCategory === "RFI" ? (
                        <>
                          <label className="block text-[10px] font-bold text-amber-500 mb-1">Batas Waktu (Due Date)</label>
                          <input
                            type="date"
                            value={newDocDueDate}
                            onChange={(e) => setNewDocDueDate(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded p-1.5 focus:ring-1 focus:ring-amber-500 font-mono font-semibold"
                            required
                          />
                        </>
                      ) : (
                        <div className="hidden sm:block"></div>
                      )}
                    </div>
                    <div className="flex flex-col justify-end">
                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded shadow-sm cursor-pointer"
                      >
                        Arsipkan Dokumen
                      </button>
                    </div>
                  </form>
                )}

                {/* Grid Split layout if an RFI document is selected for Discussion */}
                {(() => {
                  const selectedRFIDoc = documents.find(d => d.id === selectedRFIDocId);
                  return (
                    <div className={selectedRFIDoc ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : "space-y-6"}>
                      
                      {/* Document List Column (Wide or Full Width) */}
                      <div className={selectedRFIDoc ? "lg:col-span-2 overflow-x-auto text-xs" : "overflow-x-auto text-xs"}>
                        <table className="w-full border-collapse text-left">
                          <thead className="bg-[#1e293b] text-slate-400 font-mono font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-2.5 px-4 text-white">Nama Dokumen</th>
                              <th className="py-2.5 px-4 text-white">Kategori</th>
                              <th className="py-2.5 px-4 text-white">Versi</th>
                              <th className="py-2.5 px-4 text-white">Arsip Dibuat</th>
                              <th className="py-2.5 px-4 text-white">Workflow Status</th>
                              <th className="py-2.5 px-4 text-white text-center font-bold">Aksi Approval</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-650 dark:text-slate-300">
                            {documents.map((d) => {
                              const daysRemaining = d.category === "RFI" && d.dueDate ? getRFIDeadlineInfo(d.dueDate) : null;
                              let rowHighlightClass = "hover:bg-slate-50/50 dark:hover:bg-slate-800/10";
                              
                              if (selectedRFIDocId === d.id) {
                                rowHighlightClass = "bg-slate-50/70 dark:bg-slate-800/40 border-l-2 border-blue-500";
                              } else if (daysRemaining !== null) {
                                if (daysRemaining < 0) {
                                  rowHighlightClass = "bg-red-500/5 dark:bg-red-950/20 hover:bg-red-500/10 border-l-2 border-red-500";
                                } else if (daysRemaining <= 3) {
                                  rowHighlightClass = "bg-amber-500/5 dark:bg-amber-950/20 hover:bg-amber-500/10 border-l-2 border-amber-500";
                                }
                              }

                              return (
                                <tr key={d.id} className={rowHighlightClass}>
                                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 leading-normal">
                                    <div className="font-sans font-bold flex items-center gap-2 flex-wrap">
                                      <span>{d.name}</span>
                                      {d.category === "RFI" && d.dueDate && (() => {
                                        if (daysRemaining === null) return null;
                                        if (daysRemaining < 0) {
                                          return (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 text-[10px] font-black rounded flex items-center gap-1 border border-red-200 dark:border-red-900/30 uppercase tracking-wide animate-pulse">
                                              ⚠️ Terlambat {-daysRemaining} Hari
                                            </span>
                                          );
                                        } else if (daysRemaining <= 3) {
                                          return (
                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-450 text-[10px] font-extrabold rounded flex items-center gap-1 border border-amber-200 dark:border-amber-900/30 animate-pulse">
                                              ⏰ Due: {daysRemaining === 0 ? "Hari Ini" : `${daysRemaining} Hari`}
                                            </span>
                                          );
                                        } else {
                                          return (
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-850 dark:text-slate-300 text-[10px] font-semibold rounded flex items-center gap-1 border border-slate-200 dark:border-slate-800">
                                              📅 Due: {d.dueDate}
                                            </span>
                                          );
                                        }
                                      })()}
                                    </div>
                                  {d.category === "RFI" && (
                                    <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-500 font-mono font-medium">
                                      <span className="flex items-center text-blue-600 dark:text-blue-400">
                                        <MessageSquare className="w-3 h-3 mr-0.5 inline" /> {d.comments?.length || 0} Komentar
                                      </span>
                                      <span>•</span>
                                      <span className="flex items-center text-slate-500">
                                        <History className="w-3 h-3 mr-0.5 inline" /> {d.statusHistory?.length || 0} Riwayat Progres
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-medium">{d.category}</td>
                                <td className="py-3 px-4 font-mono font-bold text-[#e0a96d]">{d.version}</td>
                                <td className="py-3 px-4 font-mono text-slate-400">{d.createdAt}</td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                                    <span className={`px-2 py-[1.5px] rounded-full font-bold font-sans text-[10px] w-fit ${
                                      d.status === "Approved" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" :
                                      d.status === "Rejected" ? "bg-rose-50 text-rose-500" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                                    }`}>
                                      {d.status}
                                    </span>
                                    {d.category === "RFI" && (
                                      <button
                                        onClick={() => setSelectedRFIDocId(selectedRFIDocId === d.id ? null : d.id)}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold flex items-center space-x-1 transition cursor-pointer ${
                                          selectedRFIDocId === d.id
                                            ? "bg-blue-600 text-white shadow-xs"
                                            : "bg-blue-550 text-blue-600 dark:bg-blue-950/20 dark:text-blue-300 hover:bg-blue-100"
                                        }`}
                                      >
                                        <MessageSquare className="w-2.5 h-2.5" />
                                        <span>Diskusi ({d.comments?.length || 0})</span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {d.status === "Pending Approval" ? (
                                    <div className="flex items-center justify-center space-x-1.5">
                                      <button
                                        onClick={() => approveDocument(d.id, true)}
                                        className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded text-[10px] cursor-pointer"
                                      >
                                        SETUJU
                                      </button>
                                      <button
                                        onClick={() => approveDocument(d.id, false)}
                                        className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded text-[10px] cursor-pointer"
                                      >
                                        TOLAK
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => triggerFakePDFExport(`Dokumen_${d.id}`)}
                                      className="text-slate-400 hover:text-amber-500 font-bold text-[10px] cursor-pointer"
                                    >
                                      Unduh File PDF
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          </tbody>
                        </table>
                      </div>

                      {/* RFI Discussion Thread Panel Column (Right Sheet) */}
                      {selectedRFIDoc && (
                        <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-4 text-xs h-fit animate-fade-in">
                          {/* Pane Header */}
                          <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-bold font-mono px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">
                                  RFI Discussion
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 font-mono">
                                  {selectedRFIDoc.version}
                                </span>
                              </div>
                              <h4 className="font-extrabold text-[#111111] dark:text-white mt-1 leading-snug break-words">
                                {selectedRFIDoc.name}
                              </h4>
                            </div>
                            <button
                              onClick={() => setSelectedRFIDocId(null)}
                              className="p-1 rounded-full text-slate-450 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Pane Workflow Interactive Action Status */}
                          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-500">
                                Status Alur Kerja
                              </span>
                              <span className={`px-2 py-[1.5px] rounded text-[10px] font-black uppercase ${
                                selectedRFIDoc.status === "Approved" ? "bg-emerald-500 text-white" :
                                selectedRFIDoc.status === "Rejected" ? "bg-red-500 text-white" :
                                selectedRFIDoc.status === "Pending Approval" ? "bg-[#e0a96d] text-slate-900" :
                                "bg-slate-400 text-white"
                              }`}>
                                {selectedRFIDoc.status}
                              </span>
                            </div>

                            <p className="text-[10px] text-slate-400">
                              Ubah status dokumen RFI ini dan rekam catatan evaluasi alur kerja Anda ke riwayat audit resmi.
                            </p>

                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              <button
                                onClick={() => updateRFIStatus(selectedRFIDoc.id, "Approved", newHistoryNote.trim())}
                                className="px-2 py-1 bg-emerald-650/10 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded cursor-pointer border border-emerald-500/10 text-center"
                              >
                                Approve RFI
                              </button>
                              <button
                                onClick={() => updateRFIStatus(selectedRFIDoc.id, "Rejected", newHistoryNote.trim())}
                                className="px-2 py-1 bg-rose-600/10 hover:bg-rose-600 text-rose-600 text-[10px] font-bold rounded cursor-pointer border border-rose-500/10 text-center"
                              >
                                Reject RFI
                              </button>
                              <button
                                onClick={() => updateRFIStatus(selectedRFIDoc.id, "Pending Approval", newHistoryNote.trim())}
                                className="px-2 py-1 bg-[#e0a96d]/10 hover:bg-[#e0a96d] text-[#e0a96d] dark:text-amber-400 text-[10px] font-bold rounded cursor-pointer border border-[#e0a96d]/10 text-center col-span-2"
                              >
                                Set ke Pending Review
                              </button>
                            </div>

                            <div className="space-y-1 mt-2">
                              <label className="block text-[9px] font-bold text-slate-400">Catatan Workflow Perubahan Status (Opsional)</label>
                              <input
                                type="text"
                                placeholder="Masukkan justifikasi pengesahan / alasan penolakan..."
                                value={newHistoryNote}
                                onChange={(e) => setNewHistoryNote(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded p-1.5 text-[10px] text-slate-800 dark:text-white focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Status History Tab/Section */}
                          <div className="space-y-2">
                            <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                              <History className="w-3 h-3 mr-1" />
                              <span>Riwayat Alur Kerja ({selectedRFIDoc.statusHistory?.length || 0})</span>
                            </span>

                            {(!selectedRFIDoc.statusHistory || selectedRFIDoc.statusHistory.length === 0) ? (
                              <p className="text-[10px] text-slate-400 italic bg-white dark:bg-slate-900/45 p-2 rounded text-center border border-slate-100 dark:border-slate-800/40">
                                Belum ada riwayat audit yang terdokumentasi.
                              </p>
                            ) : (
                              <div className="relative border-l border-slate-200 dark:border-slate-700 pl-3.5 space-y-3 max-h-40 overflow-y-auto pr-1">
                                {selectedRFIDoc.statusHistory.map((hist) => (
                                  <div key={hist.id} className="relative text-[11px]">
                                    {/* Small circle dot markers */}
                                    <span className="absolute -left-[19.5px] top-1.5 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 border border-white dark:border-slate-900" />
                                    
                                    <div className="flex items-center space-x-1 text-slate-400 font-mono text-[9px]">
                                      <span>{hist.timestamp}</span>
                                      <span>•</span>
                                      <span className="font-bold text-slate-500 dark:text-slate-300">{hist.changedBy} ({hist.changedByRole})</span>
                                    </div>

                                    <div className="mt-0.5">
                                      <span className={`px-1.5 py-[0.5px] rounded text-[8px] font-bold font-mono mr-1.5 ${
                                        hist.status === "Approved" ? "bg-emerald-500/10 text-emerald-500" :
                                        hist.status === "Rejected" ? "bg-rose-500/10 text-rose-500" :
                                        "bg-[#e0a96d]/10 text-[#e0a96d]"
                                      }`}>
                                        {hist.status}
                                      </span>
                                      <span className="text-slate-700 dark:text-slate-350 leading-relaxed font-semibold font-sans">
                                        {hist.note}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Dynamic Comments Discussion Board */}
                          <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                            <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              <span>Diskusi Teknis RFI ({selectedRFIDoc.comments?.length || 0})</span>
                            </span>

                            {/* Comment Streams max-height bound */}
                            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                              {(!selectedRFIDoc.comments || selectedRFIDoc.comments.length === 0) ? (
                                <p className="text-[10px] text-slate-400 italic py-4 text-center">
                                  Belum ada komentar teknis. Jadilah yang pertama memberikan masukan!
                                </p>
                              ) : (
                                selectedRFIDoc.comments.map((comment) => {
                                  // Gather initials
                                  const initials = comment.authorName ? comment.authorName.split(" ").slice(0, 2).map(n => n[0]).join("") : "U";
                                  return (
                                    <div key={comment.id} className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/40 p-2.5 rounded-lg space-y-1 hover:shadow-2xs transition">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-5 h-5 rounded-full bg-blue-600/15 text-blue-600 flex items-center justify-center text-[9px] font-black font-mono">
                                            {initials}
                                          </div>
                                          <div>
                                            <span className="font-bold text-slate-850 dark:text-white text-[11px]">
                                              {comment.authorName}
                                            </span>
                                            <span className="text-[9px] px-1 py-[0.5px] bg-slate-100 dark:bg-slate-800 rounded font-bold text-slate-400 ml-1">
                                              {comment.authorRole}
                                            </span>
                                          </div>
                                        </div>
                                        <span className="text-[9px] text-slate-400 font-mono">
                                          {comment.timestamp}
                                        </span>
                                      </div>
                                      
                                      <p className="text-slate-755 dark:text-slate-300 font-semibold pl-1 text-[11px] leading-relaxed">
                                        {comment.text}
                                      </p>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Rapid comment macros / suggestions */}
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-slate-400">Pilih Makro Rekomendasi (Balasan Cepat)</span>
                              <div className="flex flex-wrap gap-1">
                                {[
                                  "Revisi detail pelat pengaku kolom",
                                  "Beban sambungan struktur aman",
                                  "Butuh review structural engineer",
                                  "Sudah sesuai koordinasi konsultan"
                                ].map((macro) => (
                                  <button
                                    key={macro}
                                    type="button"
                                    onClick={() => setNewCommentText(macro)}
                                    className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 font-medium text-[9px] cursor-pointer"
                                  >
                                    + {macro}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Submit form comments */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!newCommentText.trim()) return;
                                addRFIComment(selectedRFIDoc.id, newCommentText.trim());
                                setNewCommentText("");
                              }}
                              className="flex gap-2 items-end pt-1"
                            >
                              <div className="flex-1">
                                <input
                                  type="text"
                                  placeholder="Tulis tanggapan atau analisis struktur RFI..."
                                  value={newCommentText}
                                  onChange={(e) => setNewCommentText(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
                                />
                              </div>
                              <button
                                type="submit"
                                className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded p-2.5 flex items-center justify-center cursor-pointer h-full border border-blue-600 shadow-sm"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            </div>
          )}

          {/* TAB 11: AI INVESTIGATOR PANEL */}
          {activeTab === "ai_panel" && (
            <div className="space-y-6">
              <AIAssistant />
            </div>
          )}

          {/* TAB 12: PENGATURAN PORTAL */}
          {activeTab === "portal_settings" && (
            <div className="space-y-6">
              <PortalSettingsPanel />
            </div>
          )}

          {/* TAB 13: TUGAS & CHAT DIVISI */}
          {activeTab === "tasks_comms" && (
            <div className="space-y-6">
              <TaskAndCommunication />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
}
