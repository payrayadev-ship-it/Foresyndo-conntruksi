import React, { useState, useEffect } from "react";
import { useProject } from "../context/ProjectContext";
import { UserRole } from "../types";
import { jsPDF } from "jspdf";
import {
  ShoppingCart, ShieldAlert, Plus, Trash2, CheckCircle2, AlertCircle, FileText,
  Truck, Banknote, HelpCircle, ArrowUpRight, Search, Download, Filter, Eye,
  Sparkles, Star, Check, X, ShieldCheck, TrendingUp, DollarSign, RefreshCw, ThumbsUp, Send, Ban,
  FileUp, Layers, Hammer, Package
} from "lucide-react";

// Types
export interface Supplier {
  id: string;
  code: string;
  name: string;
  companyName: string;
  address: string;
  pic: string;
  phone: string;
  email: string;
  npwp: string;
  bank: string;
  accountNo: string;
  rating: number;
  isActive: boolean;
}

export interface MaterialItem {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  spec: string;
  unit: string;
  standardPrice: number;
  minStock: number;
  maxStock: number;
}

export interface ServiceItem {
  id: string;
  code: string;
  name: string;
  description: string;
  unit: string;
  standardPrice: number;
}

export interface PurchaseRequest {
  id: string;
  nomorPR: string;
  date: string;
  projectName: string;
  division: string;
  requester: string;
  priority: "Rendah" | "Sedang" | "Tinggi" | "Urgent";
  status: "Draft" | "Menunggu Approval" | "Approved" | "Rejected" | "Closed";
  items: { name: string; spec: string; qty: number; unit: string; needDate: string; notes: string }[];
}

export interface POExtended {
  id: string;
  nomorPO: string;
  date: string;
  projectName: string;
  supplierName: string;
  prId?: string;
  deliveryDate: string;
  deliveryAddress: string;
  paymentMethod: string;
  dueDate: string;
  notes: string;
  items: { code: string; name: string; spec: string; qty: number; unit: string; price: number; discount: number; tax: number; total: number }[];
  subtotal: number;
  discountTotal: number;
  ppn: number;
  pph: number;
  grandTotal: number;
  status: "Draft" | "Submitted" | "Approved Level 1" | "Approved Level 2" | "Approved Level 3" | "Rejected" | "Cancelled";
  deliveryStatus: "Belum Dikirim" | "Sebagian Dikirim" | "Dikirim" | "Diterima" | "Ditolak";
  paymentStatus: "Belum Dibayar" | "Sebagian Dibayar" | "Lunas";
}

export interface QuotationComparison {
  id: string;
  prId: string;
  prNum: string;
  itemName: string;
  qty: number;
  offers: { supplierName: string; pricePerUnit: number; deliveryDays: number; warranty: string; rating: number }[];
}

export interface GoodsReceipt {
  id: string;
  grNumber: string;
  poNumber: string;
  receivedDate: string;
  receiver: string;
  condition: string;
  qtyMatch: boolean;
  specMatch: boolean;
  isDamaged: boolean;
  isDeficit: boolean;
  notes: string;
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  poNumber: string;
  grNumber: string;
  invoiceDate: string;
  grandTotal: number;
  ppn: number;
  pph: number;
  totalBill: number;
  status: "Belum Dibayar" | "Sebagian Dibayar" | "Lunas";
}

export interface SupplierPayment {
  id: string;
  paymentNumber: string;
  invoiceNumber: string;
  payDate: string;
  method: string;
  bankName: string;
  amount: number;
  notes: string;
}

export function EnterprisePurchaseOrder() {
  const { selectedProject, staff, currentUser } = useProject();

  // Active perspective simulation
  const [activeRole, setActiveRole] = useState<UserRole>(currentUser?.role || UserRole.PROJECT_MANAGER);
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "suppliers" | "requests" | "comparison" | "orders" | "logistics" | "finance" | "reports">("dashboard");

  // CSV Import, PDF, and Email utilities state variables
  const [showPOImport, setShowPOImport] = useState(false);
  const [poImportLog, setPoImportLog] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("payrayadev@gmail.com");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailType, setEmailType] = useState<"comparison" | "invoice" | "report" | "po">("po");
  const [emailAttachmentName, setEmailAttachmentName] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStep, setEmailStep] = useState("");

  const [selectedInvoiceData, setSelectedInvoiceData] = useState<SupplierInvoice | null>(null);
  const [selectedComparisonData, setSelectedComparisonData] = useState<QuotationComparison | null>(null);
  const [selectedReportData, setSelectedReportData] = useState<any>(null);

  // Notifications Console State
  const [notifications, setNotifications] = useState<{ id: string; type: "info" | "success" | "warning"; text: string; time: string }[]>([
    { id: "1", type: "info", text: "Sistem Purchase Request terverifikasi. Siap mengajukan material.", time: "10:00" },
    { id: "2", type: "success", text: "Integrasi Logistik aktif untuk pengecekan status barang masuk proyek.", time: "09:30" },
  ]);

  // Master Data States
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem("fos_po_suppliers");
    return saved ? JSON.parse(saved) : [
      { id: "s-1", code: "SPL-001", name: "Krakatau Steel Utama", companyName: "PT Krakatau Steel Tbk", address: "Kawasan Industri Cilegon, Banten", pic: "Andi Saputra", phone: "0812-3456-7890", email: "sales@krakatausteel.co.id", npwp: "01.234.567.8-091.000", bank: "Bank Mandiri", accountNo: "123-45-67890-1", rating: 5, isActive: true },
      { id: "s-2", code: "SPL-002", name: "Semen Indonesia Perkasa", companyName: "PT Semen Indonesia Tbk", address: "Gresik, Jawa Timur", pic: "Budi Santoso", phone: "0811-987-654", email: "info@semenindonesia.com", npwp: "02.345.678.9-123.000", bank: "Bank BNI", accountNo: "987-65-43210-2", rating: 4, isActive: true },
      { id: "s-3", code: "SPL-003", name: "Adhi Beton Mandiri", companyName: "PT Adhi Mix Precast", address: "Pancoran, Jakarta Selatan", pic: "Rudi Hartono", phone: "0813-1111-2222", email: "rudi@adhimix.co.id", npwp: "03.456.789.0-456.000", bank: "Bank BCA", accountNo: "555-0123-45-6", rating: 5, isActive: true },
      { id: "s-4", code: "SPL-004", name: "Mega Baja Distributor", companyName: "CV Mega Baja Mandiri", address: "Daan Mogot, Jakarta Barat", pic: "Kevin Setiawan", phone: "0815-4444-5555", email: "kevin@megabaja.co.id", npwp: "04.567.890.1-789.000", bank: "Bank Mandiri", accountNo: "111-22-33333-4", rating: 3, isActive: true }
    ];
  });

  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    const saved = localStorage.getItem("fos_po_materials");
    return saved ? JSON.parse(saved) : [
      { id: "m-1", code: "MAT-001", name: "Besi Beton Ø 12mm", category: "Besi", brand: "Krakatau Steel", spec: "BJTS 420, Panjang 12m", unit: "Batang", standardPrice: 115000, minStock: 200, maxStock: 2000 },
      { id: "m-2", code: "MAT-002", name: "Semen Portland Composite (PCC)", category: "Semen", brand: "Semen Padang", spec: "Tipe I, Berat 50kg", unit: "Zak", standardPrice: 72000, minStock: 100, maxStock: 1000 },
      { id: "m-3", code: "MAT-003", name: "Beton Ready Mix K-350", category: "Beton", brand: "Adhi Mix", spec: "Slump 12±2, Fly Ash", unit: "m3", standardPrice: 980000, minStock: 50, maxStock: 500 },
      { id: "m-4", code: "MAT-004", name: "Paku Kayu 3 Inch", category: "Alat", brand: "Standard", spec: "Panjang 7.5cm", unit: "Kotak", standardPrice: 45000, minStock: 10, maxStock: 100 }
    ];
  });

  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem("fos_po_services");
    return saved ? JSON.parse(saved) : [
      { id: "srv-1", code: "SRV-001", name: "Pemasangan Bekisting Kolom", description: "Tenaga + Alat bantu bekisting plywood", unit: "m2", standardPrice: 65000 },
      { id: "srv-2", code: "SRV-002", name: "Pengecoran Plat Lantai", description: "Jasa perataan beton ready-mix", unit: "m3", standardPrice: 45000 },
      { id: "srv-3", code: "SRV-003", name: "Fabrikasi Rangka Baja", description: "Pemotongan & pengelasan struktur utama", unit: "Ton", standardPrice: 2800000 }
    ];
  });

  // PR, PO, GR, Invoice, Payment, Comparison Data
  const [requests, setRequests] = useState<PurchaseRequest[]>(() => {
    const saved = localStorage.getItem("fos_po_requests");
    return saved ? JSON.parse(saved) : [
      {
        id: "pr-1",
        nomorPR: "PR-2026-06-00001",
        date: "2026-06-01",
        projectName: selectedProject?.namaProyek || "Proyek Jalan Layang",
        division: "Struktur",
        requester: "Gunawan (Site Engineer)",
        priority: "Tinggi",
        status: "Approved",
        items: [{ name: "Besi Beton Ø 12mm", spec: "Panjang 12m, BJTS", qty: 500, unit: "Batang", needDate: "2026-06-15", notes: "Kebutuhan perakitan kolom zona 2" }]
      },
      {
        id: "pr-2",
        nomorPR: "PR-2026-06-00002",
        date: "2026-06-03",
        projectName: selectedProject?.namaProyek || "Proyek Jalan Layang",
        division: "Finishing",
        requester: "Rahmat (Site Engineer)",
        priority: "Urgent",
        status: "Menunggu Approval",
        items: [{ name: "Semen Portland Composite (PCC)", spec: "Zak 50kg", qty: 150, unit: "Zak", needDate: "2026-06-10", notes: "Pekerjaan plesteran dinding ramp" }]
      }
    ];
  });

  const [comparisons, setComparisons] = useState<QuotationComparison[]>(() => {
    const saved = localStorage.getItem("fos_po_comparisons");
    return saved ? JSON.parse(saved) : [
      {
        id: "comp-1",
        prId: "pr-1",
        prNum: "PR-2026-06-00001",
        itemName: "Besi Beton Ø 12mm",
        qty: 500,
        offers: [
          { supplierName: "Krakatau Steel Utama", pricePerUnit: 112000, deliveryDays: 3, warranty: "Sertifikasi SNI resmi", rating: 5 },
          { supplierName: "Semen Indonesia Perkasa", pricePerUnit: 118000, deliveryDays: 5, warranty: "Garansi retur rusak", rating: 4 },
          { supplierName: "Mega Baja Distributor", pricePerUnit: 115000, deliveryDays: 2, warranty: "Standard pabrik", rating: 3 }
        ]
      }
    ];
  });

  const [orders, setOrders] = useState<POExtended[]>(() => {
    const saved = localStorage.getItem("fos_po_orders_extended");
    return saved ? JSON.parse(saved) : [
      {
        id: "po-ext-1",
        nomorPO: "PO-2026-06-00001",
        date: "2026-06-02",
        projectName: selectedProject?.namaProyek || "Proyek Jalan Layang",
        supplierName: "Krakatau Steel Utama",
        prId: "pr-1",
        deliveryDate: "2026-06-10",
        deliveryAddress: selectedProject?.lokasi || "Kavling Konstruksi FGI, Jakarta",
        paymentMethod: "Term 30 Days",
        dueDate: "2026-07-10",
        notes: "Kirim bertahap menggunakan truk engkel fuso.",
        items: [{ code: "MAT-001", name: "Besi Beton Ø 12mm", spec: "Panjang 12m, BJTS", qty: 500, unit: "Batang", price: 112000, discount: 0, tax: 11, total: 56000000 }],
        subtotal: 56000000,
        discountTotal: 0,
        ppn: 6160000,
        pph: 1120000,
        grandTotal: 61040000,
        status: "Approved Level 1",
        deliveryStatus: "Sebagian Dikirim",
        paymentStatus: "Belum Dibayar"
      }
    ];
  });

  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>(() => {
    const saved = localStorage.getItem("fos_po_gr");
    return saved ? JSON.parse(saved) : [
      {
        id: "gr-1",
        grNumber: "GR-2026-06-0001",
        poNumber: "PO-2026-06-00001",
        receivedDate: "2026-06-05",
        receiver: "Yance (Logistik)",
        condition: "Baik, besi lurus tanpa karat mayor",
        qtyMatch: true,
        specMatch: true,
        isDamaged: false,
        isDeficit: false,
        notes: "Diterima drop pertama sebanyak 250 batang besi."
      }
    ];
  });

  const [invoices, setInvoices] = useState<SupplierInvoice[]>(() => {
    const saved = localStorage.getItem("fos_po_invoices");
    return saved ? JSON.parse(saved) : [
      {
        id: "inv-1",
        invoiceNumber: "INV-KS-22129",
        supplierName: "Krakatau Steel Utama",
        poNumber: "PO-2026-06-00001",
        grNumber: "GR-2026-06-0001",
        invoiceDate: "2026-06-06",
        grandTotal: 56000000,
        ppn: 6160000,
        pph: 1120000,
        totalBill: 61040000,
        status: "Belum Dibayar"
      }
    ];
  });

  const [payments, setPayments] = useState<SupplierPayment[]>(() => {
    const saved = localStorage.getItem("fos_po_payments");
    return saved ? JSON.parse(saved) : [];
  });

  // Save states to LocalStorage
  useEffect(() => {
    localStorage.setItem("fos_po_suppliers", JSON.stringify(suppliers));
  }, [suppliers]);
  useEffect(() => {
    localStorage.setItem("fos_po_materials", JSON.stringify(materials));
  }, [materials]);
  useEffect(() => {
    localStorage.setItem("fos_po_services", JSON.stringify(services));
  }, [services]);
  useEffect(() => {
    localStorage.setItem("fos_po_requests", JSON.stringify(requests));
  }, [requests]);
  useEffect(() => {
    localStorage.setItem("fos_po_comparisons", JSON.stringify(comparisons));
  }, [comparisons]);
  useEffect(() => {
    localStorage.setItem("fos_po_orders_extended", JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    localStorage.setItem("fos_po_gr", JSON.stringify(goodsReceipts));
  }, [goodsReceipts]);
  useEffect(() => {
    localStorage.setItem("fos_po_invoices", JSON.stringify(invoices));
  }, [invoices]);
  useEffect(() => {
    localStorage.setItem("fos_po_payments", JSON.stringify(payments));
  }, [payments]);

  // Form States & Temp Values
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showMasterImport, setShowMasterImport] = useState(false);
  const [importMasterType, setImportMasterType] = useState<"supplier" | "material" | "jasa">("supplier");
  const [activeMasterSubTab, setActiveMasterSubTab] = useState<"suppliers" | "materials" | "services">("suppliers");
  const [importLogMessage, setImportLogMessage] = useState("");
  const [showAddPR, setShowAddPR] = useState(false);
  const [showAddPOManual, setShowAddPOManual] = useState(false);
  const [showAddGR, setShowAddGR] = useState(false);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);

  // New Supplier form inputs
  const [newSup, setNewSup] = useState({
    name: "", companyName: "", address: "", pic: "", phone: "", email: "", npwp: "", bank: "", accountNo: ""
  });

  // New PR form inputs
  const [newPR, setNewPR] = useState({
    division: "Struktur",
    priority: "Sedang" as any,
    itemName: "",
    spec: "",
    qty: 0,
    unit: "Batang",
    needDate: "",
    notes: ""
  });

  // New PO Form inputs
  const [newPOExt, setNewPOExt] = useState({
    supplierId: "",
    paymentMethod: "Term 30 Days",
    deliveryDate: "",
    deliveryAddress: "",
    notes: "",
    itemName: "",
    qty: 0,
    price: 0,
    discountPercent: 0,
    taxRate: 11
  });

  // New GR inputs
  const [newGR, setNewGR] = useState({
    poId: "",
    receiver: "",
    condition: "Baik",
    qtyMatch: true,
    specMatch: true,
    isDamaged: false,
    isDeficit: false,
    notes: ""
  });

  // New Invoice inputs
  const [newInv, setNewInv] = useState({
    invoiceNumber: "",
    poId: "",
    invoiceDate: "",
  });

  // New Payment inputs
  const [newPay, setNewPay] = useState({
    invoiceId: "",
    method: "Transfer Bank",
    bankName: "Mandiri FGI",
    amount: 0,
    notes: ""
  });

  // Recommendation engine state
  const [aiAssistantOpen, setAiAssistantOpen] = useState(true);
  const [aiLog, setAiLog] = useState<string[]>([
    "💡 [Rekomendasi]: Supplier Krakatau Steel memiliki rating tertinggi (⭐5) untuk kategori Besi/Baja.",
    "⚠️ [Anomali]: Harga Besi Beton Ø 12mm terpantau naik 3.1% dibanding harga rata-rata historis proyek lalu.",
    "📊 [Alokasi]: Margin anggaran tersisa aman. Estimasi cash flow pengadaan bulan Juni sebesar Rp120jt."
  ]);

  // Actions logging / Simulated notifications helper
  const addSysNotify = (type: "info" | "success" | "warning", text: string) => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setNotifications(prev => [{ id: Date.now().toString(), type, text, time: now }, ...prev]);
  };

  // PO CSV Import/Export helpers
  const downloadPOTemplate = () => {
    const headers = "Nomor PO,Tanggal PO,Pemasok,Metode Pembayaran,Alamat Pengiriman,Kode Material,Nama Material,Spesifikasi,Kuantitas,Satuan,Harga Satuan";
    const sampleRow1 = "PO-2026-06-00099,2026-06-01,Krakatau Steel Utama,Term 30 Days,Site Proyek BSD Blok C,MAT-01,Besi Beton D12,SNI Resmi Panjang 12m,500,Batang,115000";
    const sampleRow2 = "PO-2026-06-00099,2026-06-01,Krakatau Steel Utama,Term 30 Days,Site Proyek BSD Blok C,MAT-02,Besi Beton D16,SNI Resmi Panjang 12m,200,Batang,185000";
    const csvContent = "\uFEFF" + [headers, sampleRow1, sampleRow2].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Template_PO_Import.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addSysNotify("success", "Template CSV PO berhasil diunduh.");
  };

  const handleImportPOCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPoImportLog("Membaca file CSV PO...");
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error("File kosong");

        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length <= 1) throw new Error("File tidak memiliki baris data");

        const splitLine = (lineStr: string) => {
          const result: string[] = [];
          let cur = "";
          let quotes = false;
          for (let idx = 0; idx < lineStr.length; idx++) {
            const ch = lineStr[idx];
            if (ch === '"') {
              quotes = !quotes;
            } else if (ch === ',' && !quotes) {
              result.push(cur);
              cur = "";
            } else {
              cur += ch;
            }
          }
          result.push(cur);
          return result;
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
          if (joinedLow.includes("nomor") || joinedLow.includes("pemasok") || joinedLow.includes("metode")) {
            headerIndex = i;
            break;
          }
        }

        const startIndex = headerIndex + 1;
        const tempOrdersMap: Record<string, any> = {};

        for (let i = startIndex; i < parsedRows.length; i++) {
          const row = parsedRows[i];
          if (row.length < 5) continue;

          const nomorPO = cleanVal(row[0]);
          if (!nomorPO) continue;

          const date = cleanVal(row[1]) || new Date().toISOString().split("T")[0];
          const supplierName = cleanVal(row[2]) || "Krakatau Steel Utama";
          const paymentMethod = cleanVal(row[3]) || "COD / Cash";
          const deliveryAddress = cleanVal(row[4]) || selectedProject?.lokasi || "Site Proyek FGI";

          const code = cleanVal(row[5]) || "MAT-GEN";
          const name = cleanVal(row[6]) || "Material Lain-lain";
          const spec = cleanVal(row[7]) || "Standar Pabrik";
          const qty = cleanNum(row[8]) || 1;
          const unit = cleanVal(row[9]) || "Unit";
          const price = cleanNum(row[10]) || 0;
          const itemTotal = qty * price;

          const itemObj = { code, name, spec, qty, unit, price, discount: 0, tax: 11, total: itemTotal };

          if (!tempOrdersMap[nomorPO]) {
            tempOrdersMap[nomorPO] = {
              id: `po-import-${Math.random().toString(36).substring(2, 9)}`,
              nomorPO,
              date,
              projectName: selectedProject?.namaProyek || "Proyek BSD Tower",
              supplierName,
              deliveryDate: date,
              deliveryAddress,
              paymentMethod,
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              notes: "Diimpor via upload file CSV oleh Estimator.",
              items: [],
              status: "Draft",
              deliveryStatus: "Belum Dikirim",
              paymentStatus: "Belum Dibayar"
            };
          }
          tempOrdersMap[nomorPO].items.push(itemObj);
        }

        const listOfNewOrders: POExtended[] = Object.values(tempOrdersMap).map((o: any) => {
          const subtotal = o.items.reduce((sum: number, it: any) => sum + it.total, 0);
          const discountTotal = 0;
          const ppn = Math.round(subtotal * 0.11);
          const pph = Math.round(subtotal * 0.02);
          const grandTotal = subtotal + ppn - pph;

          return { ...o, subtotal, discountTotal, ppn, pph, grandTotal };
        });

        if (listOfNewOrders.length > 0) {
          setOrders(prev => {
            const existingNums = new Set(prev.map(p => p.nomorPO.toLowerCase()));
            const filteredNew = listOfNewOrders.filter(o => !existingNums.has(o.nomorPO.toLowerCase()));
            return [...prev, ...filteredNew];
          });
          const count = listOfNewOrders.reduce((sum, o) => sum + o.items.length, 0);
          addSysNotify("success", `Berhasil mengimpor ${listOfNewOrders.length} transaksi PO (${count} item)!`);
          setPoImportLog(`Impor Sukses! ${listOfNewOrders.length} transaksi PO terdaftar.`);
          setTimeout(() => setPoImportLog(""), 5000);
          setShowPOImport(false);
        } else {
          throw new Error("Tidak ada data PO valid yang ditemukan dalam CSV.");
        }
      } catch (err: any) {
        setPoImportLog(`Gagal: ${err.message || err}`);
        addSysNotify("warning", `Gagal impor PO: ${err.message || err}`);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  // PDF Export and Email trigger handlers
  const handleExportComparisonPDF = (comp: QuotationComparison) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const marginX = 15;
    let currentY = 20;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("PT FORESYNDO KONSTRUKSI GROUP", marginX, 13);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Engineering, Procurement & Estimating System", marginX, 18);
    doc.text("Gedung Graha Lestari, Menteng Jakarta Pusat", marginX, 22);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text("EVALUASI BANDING PENAWARAN VENDOR", 115, 13);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Rujukan PR: ${comp.prNum}`, 115, 18);
    doc.text(`Detail Item: ${comp.itemName} (Volume: ${comp.qty})`, 115, 22);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, 115, 27);

    currentY = 45;

    doc.setTextColor(15, 23, 42);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("INFORMASI ITEM PENGADAAN & INTEGRITAS VENDOR", marginX, currentY);
    currentY += 5;

    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, currentY, 195, currentY);
    currentY += 5;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Nama Pekerjaan / Material :  ${comp.itemName}`, marginX + 3, currentY);
    currentY += 5;
    doc.text(`Kebutuhan Kuantitas            :  ${comp.qty.toLocaleString()} Unit`, marginX + 3, currentY);
    currentY += 5;
    doc.text(`Kebijakan Audit                  :  Minimal 3 penawaran harga pendaftaran untuk transparansi.`, marginX + 3, currentY);

    currentY += 12;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("RINCIAN PENAWARAN HARGA MITRA MASUK (BIDDING LOG)", marginX, currentY);
    currentY += 5;
    doc.line(marginX, currentY, 195, currentY);
    currentY += 5;

    doc.setFillColor(241, 245, 249);
    doc.rect(marginX, currentY, 180, 8, "F");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    doc.text("PEMASOK / VENDOR", marginX + 3, currentY + 5.5);
    doc.text("HARGA SATUAN", marginX + 65, currentY + 5.5);
    doc.text("TOTAL ESTIMASI", marginX + 105, currentY + 5.5);
    doc.text("KIRIM (HARI)", marginX + 145, currentY + 5.5);
    doc.text("MUTU & GARANSI", marginX + 165, currentY + 5.5);

    currentY += 8;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    comp.offers.forEach((offer) => {
      doc.line(marginX, currentY, 195, currentY);
      doc.setFont("Helvetica", "bold");
      doc.text(offer.supplierName, marginX + 3, currentY + 5);
      doc.setFont("Helvetica", "normal");
      doc.text(`Rp ${offer.pricePerUnit.toLocaleString("id-ID")}`, marginX + 65, currentY + 5);
      doc.setFont("Helvetica", "bold");
      doc.text(`Rp ${(offer.pricePerUnit * comp.qty).toLocaleString("id-ID")}`, marginX + 105, currentY + 5);
      doc.setFont("Helvetica", "normal");
      doc.text(`${offer.deliveryDays} Hari`, marginX + 145, currentY + 5);
      let gar = offer.warranty;
      if (gar.length > 18) gar = gar.substring(0, 16) + "..";
      doc.text(gar, marginX + 165, currentY + 5);

      currentY += 8;
    });

    currentY += 10;
    doc.setLineWidth(0.3);
    doc.line(marginX, currentY, 195, currentY);
    currentY += 5;

    const prices = comp.offers.map(o => o.pricePerUnit);
    const minPrice = Math.min(...prices);
    const winners = comp.offers.filter(o => o.pricePerUnit === minPrice);

    if (winners.length > 0) {
      doc.setFillColor(240, 253, 250);
      doc.rect(marginX, currentY, 180, 15, "F");
      doc.setDrawColor(20, 184, 166);
      doc.rect(marginX, currentY, 180, 15, "S");

      doc.setTextColor(13, 148, 136);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.text("REKOMENDASI DEPARTEMEN PROCUREMENT (PEMASOK TERPILIH):", marginX + 4, currentY + 5);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.text(`Pilihan Utama jatuh kepada ${winners[0].supplierName} dengan penghematan efisiensi unit Rp ${winners[0].pricePerUnit.toLocaleString("id-ID")}.`, marginX + 4, currentY + 11);
    }

    currentY += 25;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Ditinjau & Diajukan,", marginX + 10, currentY);
    doc.text("Disahkan & Disetujui,", marginX + 120, currentY);

    currentY += 18;
    doc.setFont("Helvetica", "bold");
    doc.text("[ Staff Procurement ]", marginX + 10, currentY);
    doc.text("[ Project Manager / PM ]", marginX + 120, currentY);

    doc.save(`Evaluasi_Banding_Penawaran_${comp.prNum}.pdf`);
  };

  const triggerEmailComparison = (comp: QuotationComparison) => {
    setSelectedComparisonData(comp);
    setEmailType("comparison");
    setEmailSubject(`[EVALUATION] Banding Harga Pemasok: ${comp.itemName} (Rujuk ${comp.prNum})`);
    
    const prices = comp.offers.map(o => o.pricePerUnit);
    const minPrice = Math.min(...prices);
    const winner = comp.offers.find(o => o.pricePerUnit === minPrice);

    setEmailBody(`Yth. Komite Direksi PT Foresyndo,\n\nBerikut kami lampirkan dokumen Evaluasi Banding Penawaran Vendor resmi untuk Item Pekerjaan: "${comp.itemName}".\n\nBerdasarkan SOP Pengadaan, dengan merujuk perbandingan 3 vendor:\n- Supplier Termurah & Rekomendasi Utama: ${winner ? winner.supplierName : "Terlampir"}\n- Total Kebutuhan Anggaran: Rp ${(minPrice * comp.qty).toLocaleString("id-ID")}\n\nSilakan tinjau rincian penawaran & aspek legal lainnya pada lampiran berkas PDF.\n\nHormat kami,\nProcurement Dept - FGI`);
    setEmailAttachmentName(`Evaluasi_Banding_Penawaran_${comp.prNum}.pdf`);
    setShowEmailModal(true);
  };

  const handleExportInvoicePDF = (inv: SupplierInvoice) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const marginX = 15;
    let currentY = 20;

    doc.setFillColor(51, 65, 85);
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("PT FORESYNDO KONSTRUKSI GROUP", marginX, 13);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Engineering Office & Finance Department Solutions", marginX, 18);
    doc.text("E-mail: finance@foresyndo.com | Telp: +62 21-8888-888", marginX, 22);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text("SLIP TAGIHAN INVOICE VENDOR", 125, 13);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Nomor tagihan: ${inv.invoiceNumber}`, 125, 18);
    doc.text(`Proyek: ${selectedProject?.namaProyek || "BSD Tower"}`, 125, 22);
    doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID")}`, 125, 27);

    currentY = 45;

    doc.setTextColor(15, 23, 42);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("KONSPIRASI TRANSAKSI INVOICE & HUTANG DAGANG AP", marginX, currentY);
    currentY += 5;

    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, currentY, 195, currentY);
    currentY += 6;

    doc.setFont("Helvetica", "bold");
    doc.text("Informasi Vendor:", marginX + 3, currentY);
    doc.setFont("Helvetica", "normal");
    doc.text(inv.supplierName, marginX + 38, currentY);
    currentY += 5;

    doc.setFont("Helvetica", "bold");
    doc.text("Nomor Referensi PO:", marginX + 3, currentY);
    doc.setFont("Helvetica", "normal");
    doc.text(inv.poNumber, marginX + 38, currentY);
    currentY += 5;

    doc.setFont("Helvetica", "bold");
    doc.text("Nomor Goods Receipt:", marginX + 3, currentY);
    doc.setFont("Helvetica", "normal");
    doc.text(inv.grNumber, marginX + 38, currentY);
    currentY += 5;

    doc.setFont("Helvetica", "bold");
    doc.text("Tanggal Invoice:", marginX + 3, currentY);
    doc.setFont("Helvetica", "normal");
    doc.text(inv.invoiceDate, marginX + 38, currentY);
    currentY += 5;

    doc.setFont("Helvetica", "bold");
    doc.text("Status Pembayaran:", marginX + 3, currentY);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(inv.status === "Lunas" ? 16 : 225, inv.status === "Lunas" ? 185 : 29, 120);
    doc.text(inv.status, marginX + 38, currentY);

    doc.setTextColor(15, 23, 42);
    currentY += 12;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text("RINCIAN NILAI TAGIHAN", marginX, currentY);
    currentY += 4;
    doc.line(marginX, currentY, 195, currentY);
    currentY += 6;

    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, currentY, 180, 12, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TOTAL BILL TO PAY / NILAI TAGIHAN BRUTO", marginX + 5, currentY + 7.5);
    doc.setTextColor(37, 99, 235);
    doc.text(`Rp ${inv.totalBill.toLocaleString("id-ID")}`, 190, currentY + 7.5, { align: "right" });

    currentY += 20;

    doc.setTextColor(15, 23, 42);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Faktur & Tagihan di atas dicatat, divalidasi, dan dimasukkan ke antrean kas keluar secara digital.", marginX, currentY);

    currentY += 25;

    doc.text("Petugas Pembukuan,", marginX + 15, currentY);
    doc.text("Manager Keuangan / CFO,", marginX + 125, currentY);

    currentY += 18;
    doc.setFont("Helvetica", "bold");
    doc.text("[ Finance Executive ]", marginX + 15, currentY);
    doc.text("[ Controller / CFO ]", marginX + 125, currentY);

    doc.save(`Slip_Invoice_${inv.invoiceNumber}.pdf`);
  };

  const triggerEmailInvoice = (inv: SupplierInvoice) => {
    setSelectedInvoiceData(inv);
    setEmailType("invoice");
    setEmailSubject(`[TAGIHAN-INVOICE] Slip Tagihan Inv: ${inv.invoiceNumber} (${inv.supplierName})`);
    setEmailBody(`Yth. Bapak/Ibu Bagian Finance PT Foresyndo,\n\nTerlampir slip verifikasi Invoice hulu masuk untuk segera diproses:\n- Nomor Invoice: ${inv.invoiceNumber}\n- Rujukan PO: ${inv.poNumber}\n- Dari Supplier: ${inv.supplierName}\n- Nilai Nominal Tagihan: Rp ${inv.totalBill.toLocaleString("id-ID")}\n- Status Saat Ini: ${inv.status}\n\nMohon lakukan rekonsiliasi kas keluar & validasi faktur pajak melalui lampiran berkas PDF ini.\n\nHormat kami,\nInternal Accounting - Foresyndo Group`);
    setEmailAttachmentName(`Slip_Invoice_${inv.invoiceNumber}.pdf`);
    setShowEmailModal(true);
  };

  const handleExportReportPDF = (fileType: string, arrayData: any[]) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const marginX = 15;
    let currentY = 20;

    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("PT FORESYNDO KONSTRUKSI GROUP", marginX, 13);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Pusat Informasi & Analisis Sistem Pelaporan Terintegrasi", marginX, 18);
    doc.text(`Proyek: ${selectedProject?.namaProyek || "BSD Office Tower"}`, marginX, 22);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text("LAPORAN AUDIT & MUTASI INTERNAL", 120, 13);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Jenis Laporan: ${fileType.toUpperCase()}`, 120, 18);
    doc.text(`Jumlah Baris: ${arrayData.length} entri data`, 120, 22);
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 120, 27);

    currentY = 45;

    doc.setTextColor(15, 23, 42);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`TABEL DETIL REKAPAN DATA (${fileType.toUpperCase()})`, marginX, currentY);
    currentY += 5;
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, currentY, 195, currentY);
    currentY += 6;

    arrayData.slice(0, 12).forEach((item, index) => {
      if (currentY > 265) {
        doc.addPage();
        currentY = 20;
      }

      doc.setDrawColor(241, 245, 249);
      doc.line(marginX, currentY, 195, currentY);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      
      let titleLine = `Baris #${index + 1}: `;
      let secondaryLine = "";

      if (item.nomorPO) {
        titleLine += `${item.nomorPO} - Pemasok: ${item.supplierName}`;
        secondaryLine = `Tgl PO: ${item.date} • Total Belanja: Rp ${item.grandTotal?.toLocaleString("id-ID")} • Status: ${item.status || "Draft"}`;
      } else if (item.nomorPR) {
        titleLine += `${item.nomorPR} - Oleh: ${item.requester}`;
        secondaryLine = `Divisi: ${item.division} • Prioritas: ${item.priority} • Status: ${item.status}`;
      } else if (item.companyName) {
        titleLine += `${item.companyName} (${item.code})`;
        secondaryLine = `PIC: ${item.pic} • Tlpn: ${item.phone} • Alamat: ${item.address}`;
      } else if (item.invoiceNumber) {
        titleLine += `Klaim: ${item.invoiceNumber} - Rp ${item.totalBill?.toLocaleString("id-ID")}`;
        secondaryLine = `Rujuk PO: ${item.poNumber} • Vendor: ${item.supplierName} • Status: ${item.status}`;
      } else if (item.grNumber) {
        titleLine += `GR: ${item.grNumber} - Rujuk PO: ${item.poNumber}`;
        secondaryLine = `Penerima: ${item.receiver} • Kondisi: ${item.condition} • Defisit: ${item.isDeficit ? "YA" : "TIDAK"}`;
      } else {
        titleLine += `UID: ${item.id || index}`;
        secondaryLine = JSON.stringify(item).substring(0, 75);
      }

      doc.text(titleLine, marginX + 3, currentY + 4);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.text(secondaryLine, marginX + 3, currentY + 8);

      currentY += 11;
    });

    currentY += 10;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Laporan disahkan secara digital oleh Sistem ERP PT Foresyndo Konstruksi Group.", marginX, currentY);

    doc.save(`Laporan_${fileType}_${selectedProject?.nomorProyek || "PRJ"}.pdf`);
  };

  const triggerEmailReport = (fileType: string, arrayData: any[]) => {
    setSelectedReportData({ fileType, arrayData });
    setEmailType("report");
    setEmailSubject(`[LAPORAN ERP] Rekapitulasi Data ${fileType.toUpperCase()} - Proyek ${selectedProject?.namaProyek || "FGI"}`);
    setEmailBody(`Yth. Tim Direksi & Stakeholder PT Foresyndo,\n\nBerikut kami lampirkan berkas penunjang Laporan ${fileType.toUpperCase()} mutasi periodik Proyek: ${selectedProject?.namaProyek || "BSD Office Tower"}.\nJumlah rekaman data terdaftar dalam modul adalah sebanyak ${arrayData.length} entri data.\n\nUnduhan detil lengkap tabel disajikan pada berkas PDF lampiran email ini.\n\nHormat kami,\nSystem Administrator & ERP Audit\nPT Foresyndo Konstruksi Group`);
    setEmailAttachmentName(`Laporan_${fileType}.pdf`);
    setShowEmailModal(true);
  };

  const handleSendEmailSimulated = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);
    setEmailStep("Menghubungkan ke email relay (mail.foresyndo.com)...");
    
    setTimeout(() => {
      setEmailStep("Mengenkripsi berkas penunjang ke base64...");
      setTimeout(() => {
        setEmailStep("Membuat lampiran PDF dokumen secara real-time...");
        setTimeout(() => {
          setEmailStep("Melakukan handshake SMTP aman & menyalurkan amplop...");
          setTimeout(() => {
            setIsSendingEmail(false);
            setShowEmailModal(false);
            setEmailStep("");
            addSysNotify("success", `E-mail berhasil terkirim ke ${emailTo}! berkas lampiran terkirim.`);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  // HANDLERS
  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSup.name || !newSup.companyName) return;
    const code = `SPL-00${suppliers.length + 1}`;
    const entry: Supplier = {
      id: `s-${Date.now()}`,
      code,
      name: newSup.name,
      companyName: newSup.companyName,
      address: newSup.address,
      pic: newSup.pic,
      phone: newSup.phone,
      email: newSup.email,
      npwp: newSup.npwp,
      bank: newSup.bank,
      accountNo: newSup.accountNo,
      rating: 4,
      isActive: true
    };
    setSuppliers(prev => [...prev, entry]);
    setShowAddSupplier(false);
    addSysNotify("success", `Supplier ${entry.companyName} ditambahkan sebagai vendor mitra.`);
    setNewSup({ name: "", companyName: "", address: "", pic: "", phone: "", email: "", npwp: "", bank: "", accountNo: "" });
  };

  const handleCreatePR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPR.itemName || newPR.qty <= 0) return;
    const num = `PR-2026-06-0000${requests.length + 1}`;
    const entry: PurchaseRequest = {
      id: `pr-${Date.now()}`,
      nomorPR: num,
      date: new Date().toISOString().split("T")[0],
      projectName: selectedProject?.namaProyek || "Proyek Jalan Layang",
      division: newPR.division,
      requester: currentUser?.name || "Gunawan",
      priority: newPR.priority,
      status: "Menunggu Approval",
      items: [{
        name: newPR.itemName,
        spec: newPR.spec,
        qty: newPR.qty,
        unit: newPR.unit,
        needDate: newPR.needDate || new Date().toISOString().split("T")[0],
        notes: newPR.notes
      }]
    };
    setRequests(prev => [...prev, entry]);
    setShowAddPR(false);
    addSysNotify("info", `Purchase Request ${num} diajukan oleh ${entry.requester}. Menunggu review PM.`);
    
    // Auto generate comparative quotations in Comparison modul (enterprise flow simulator)
    const matchingMat = materials.find(m => m.name.toLowerCase().includes(newPR.itemName.toLowerCase())) || materials[0];
    const compEntry: QuotationComparison = {
      id: `comp-${Date.now()}`,
      prId: entry.id,
      prNum: num,
      itemName: newPR.itemName,
      qty: newPR.qty,
      offers: [
        { supplierName: "Krakatau Steel Utama", pricePerUnit: matchingMat.standardPrice * 0.95, deliveryDays: 3, warranty: "Sertifikasi SNI resmi", rating: 5 },
        { supplierName: "Semen Indonesia Perkasa", pricePerUnit: matchingMat.standardPrice * 1.05, deliveryDays: 4, warranty: "Garansi retur rusak", rating: 4 },
        { supplierName: "Mega Baja Distributor", pricePerUnit: matchingMat.standardPrice, deliveryDays: 2, warranty: "Standard Pabrik", rating: 3 }
      ]
    };
    setComparisons(prev => [...prev, compEntry]);
    
    setNewPR({ division: "Struktur", priority: "Sedang", itemName: "", spec: "", qty: 0, unit: "Batang", needDate: "", notes: "" });
  };

  const handleApprovePR = (prId: string) => {
    setRequests(prev => prev.map(r => r.id === prId ? { ...r, status: "Approved" } : r));
    addSysNotify("success", `Purchase Request ${requests.find(r => r.id === prId)?.nomorPR} disetujui untuk procurement.`);
  };

  const handleCreatePOFromPR = (comp: QuotationComparison, offerIndex: number) => {
    const offer = comp.offers[offerIndex];
    const num = `PO-2026-06-0000${orders.length + 1}`;
    const prObj = requests.find(r => r.id === comp.prId);
    
    const subtotal = offer.pricePerUnit * comp.qty;
    const ppn = subtotal * 0.11;
    const pph = subtotal * 0.02; // PPh pasal 22 / 23
    const grandTotal = subtotal + ppn - pph;

    const entry: POExtended = {
      id: `po-ext-${Date.now()}`,
      nomorPO: num,
      date: new Date().toISOString().split("T")[0],
      projectName: selectedProject?.namaProyek || "Proyek Jalan Layang",
      supplierName: offer.supplierName,
      prId: comp.prId,
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      deliveryAddress: selectedProject?.lokasi || "Lokasi Proyek FGI",
      paymentMethod: "Term 30 Days",
      dueDate: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: "Diambil dari quotation penawaran terbaik rekomendasi AI.",
      items: [{
        code: "MAT-001",
        name: comp.itemName,
        spec: prObj?.items[0]?.spec || "Standard",
        qty: comp.qty,
        unit: prObj?.items[0]?.unit || "Unit",
        price: offer.pricePerUnit,
        discount: 0,
        tax: 11,
        total: subtotal
      }],
      subtotal,
      discountTotal: 0,
      ppn,
      pph,
      grandTotal,
      status: "Draft",
      deliveryStatus: "Belum Dikirim",
      paymentStatus: "Belum Dibayar"
    };

    setOrders(prev => [...prev, entry]);
    // Close PR
    setRequests(prev => prev.map(r => r.id === comp.prId ? { ...r, status: "Closed" } : r));
    addSysNotify("success", `PO ${num} draft berhasil dibuat dari perbandingan penawaran supplier.`);
    setActiveSubTab("orders");
  };

  const handlePOSlowStockAuto = () => {
    const num = `PO-2026-06-0000${orders.length + 1}`;
    // Auto pick low stock material
    const targetMat = materials[0];
    const subtotal = targetMat.standardPrice * 300;
    const ppn = subtotal * 0.11;
    const pph = subtotal * 0.02;
    const grandTotal = subtotal + ppn - pph;

    const entry: POExtended = {
      id: `po-ext-${Date.now()}`,
      nomorPO: num,
      date: new Date().toISOString().split("T")[0],
      projectName: selectedProject?.namaProyek || "Proyek Jalan Layang",
      supplierName: "Krakatau Steel Utama",
      deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      deliveryAddress: selectedProject?.lokasi || "Lokasi FGI",
      paymentMethod: "COD",
      dueDate: new Date().toISOString().split("T")[0],
      notes: "Oto-generasi sistem cerdas logistik limit minimum stok.",
      items: [{
        code: targetMat.code,
        name: targetMat.name,
        spec: targetMat.spec,
        qty: 300,
        unit: targetMat.unit,
        price: targetMat.standardPrice,
        discount: 1000,
        tax: 11,
        total: subtotal
      }],
      subtotal,
      discountTotal: 300000,
      ppn,
      pph,
      grandTotal,
      status: "Draft",
      deliveryStatus: "Belum Dikirim",
      paymentStatus: "Belum Dibayar"
    };

    setOrders(prev => [...prev, entry]);
    addSysNotify("warning", `Otomatis buat Draft PO ${num} untuk memenuhi minimum stock material Besi.`);
    setActiveSubTab("orders");
  };

  // Hierarchical Workflow approvals
  const handlePOApproval = (poId: string) => {
    const poObj = orders.find(o => o.id === poId);
    if (!poObj) return;

    let targetNextStatus: POExtended["status"] = "Submitted";
    
    // Logic of multi-tier approval limits
    // PM up to 50M, GM up to 500M, Director/Owner above 500M
    if (poObj.status === "Draft" || poObj.status === "Submitted") {
      if (poObj.grandTotal <= 50000000) {
        targetNextStatus = "Approved Level 1"; // PM Approved satisfies this limit
      } else if (poObj.grandTotal <= 500000000) {
        targetNextStatus = "Approved Level 2"; // GM Approvable
      } else {
        targetNextStatus = "Approved Level 3"; // Direktur/Owner only
      }
    } else if (poObj.status === "Approved Level 1") {
      targetNextStatus = "Approved Level 2";
    } else if (poObj.status === "Approved Level 2") {
      targetNextStatus = "Approved Level 3";
    }

    setOrders(prev => prev.map(o => o.id === poId ? { ...o, status: targetNextStatus } : o));
    addSysNotify("success", `Tanda tangan digital dibubuhkan. Status PO: ${targetNextStatus}`);
  };

  const handleCancelPO = (poId: string) => {
    setOrders(prev => prev.map(o => o.id === poId ? { ...o, status: "Cancelled" } : o));
    addSysNotify("warning", `Purchase Order dibatalkan secara sepihak.`);
  };

  const handleCreateGR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGR.poId) return;
    const poObj = orders.find(o => o.id === newGR.poId);
    if (!poObj) return;

    const num = `GR-2026-06-000${goodsReceipts.length + 1}`;
    const entry: GoodsReceipt = {
      id: `gr-${Date.now()}`,
      grNumber: num,
      poNumber: poObj.nomorPO,
      receivedDate: new Date().toISOString().split("T")[0],
      receiver: newGR.receiver || currentUser?.name || "Kurniawan (Logistik)",
      condition: newGR.condition,
      qtyMatch: newGR.qtyMatch,
      specMatch: newGR.specMatch,
      isDamaged: newGR.isDamaged,
      isDeficit: newGR.isDeficit,
      notes: newGR.notes
    };

    setGoodsReceipts(prev => [...prev, entry]);
    // update deliveryStatus of PO
    setOrders(prev => prev.map(o => o.id === newGR.poId ? { ...o, deliveryStatus: "Diterima" } : o));
    setShowAddGR(false);
    addSysNotify("success", `Penerimaan Barang ${num} disahkan. Mutasi gudang otomatis bertambah.`);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInv.poId || !newInv.invoiceNumber) return;
    const poObj = orders.find(o => o.id === newInv.poId);
    if (!poObj) return;

    const grObj = goodsReceipts.find(g => g.poNumber === poObj.nomorPO) || goodsReceipts[0];
    
    const entry: SupplierInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: newInv.invoiceNumber,
      supplierName: poObj.supplierName,
      poNumber: poObj.nomorPO,
      grNumber: grObj ? grObj.grNumber : "GR-MOCK-PENDING",
      invoiceDate: newInv.invoiceDate || new Date().toISOString().split("T")[0],
      grandTotal: poObj.subtotal,
      ppn: poObj.ppn,
      pph: poObj.pph,
      totalBill: poObj.grandTotal,
      status: "Belum Dibayar"
    };

    setInvoices(prev => [...prev, entry]);
    setShowAddInvoice(false);
    addSysNotify("info", `Klaim Invoice ${entry.invoiceNumber} diterima dari supplier. Menunggu verifikasi tim Finance.`);
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPay.invoiceId || newPay.amount <= 0) return;
    const invObj = invoices.find(i => i.id === newPay.invoiceId);
    if (!invObj) return;

    const num = `PAY-2026-06-000${payments.length + 1}`;
    const entry: SupplierPayment = {
      id: `pay-${Date.now()}`,
      paymentNumber: num,
      invoiceNumber: invObj.invoiceNumber,
      payDate: new Date().toISOString().split("T")[0],
      method: newPay.method,
      bankName: newPay.bankName,
      amount: newPay.amount,
      notes: newPay.notes
    };

    setPayments(prev => [...prev, entry]);
    // update invoice/PO payment logs status
    setInvoices(prev => prev.map(i => {
      if (i.id === newPay.invoiceId) {
        const remaining = i.totalBill - newPay.amount;
        const nextStatus = remaining <= 0 ? "Lunas" : "Sebagian Dibayar";
        return { ...i, status: nextStatus };
      }
      return i;
    }));
    
    // update po status
    setOrders(prev => prev.map(o => o.nomorPO === invObj.poNumber ? { ...o, paymentStatus: invObj.totalBill - newPay.amount <= 0 ? "Lunas" : "Sebagian Dibayar" } : o));

    setShowAddPayment(false);
    addSysNotify("success", `Bukti transfer bayar ${num} senilai Rp ${newPay.amount.toLocaleString("id-ID")} disetujui.`);
  };

  // Excel / CSV Export Simulated
  const exportToCSV = (dataName: string, itemsArray: any[]) => {
    if (itemsArray.length === 0) return;
    const headers = Object.keys(itemsArray[0]).join(",");
    const rows = itemsArray.map(obj => Object.values(obj).map(v => `"${v}"`).join(","));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FGI_Report_${dataName}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addSysNotify("success", `Berhasil mengekspor Laporan ${dataName} sebagai format Excel CSV.`);
  };

  // CSV Template generation for Master Data
  const downloadMasterTemplate = (type: "supplier" | "material" | "jasa") => {
    let headers = "";
    let sampleRow = "";
    
    if (type === "supplier") {
      headers = "Kode,Nama Supplier,Nama Perusahaan Resmi,Alamat Gudang,PIC Penanggung Jawab,No HP PIC,Email,NPWP,Bank,Nomor Rekening,Rating,Status Aktif";
      sampleRow = "SPL-020,Semen Tonasa Utama,PT Semen Tonasa Tbk,Makassar,Ahmad Fadhil,0812-7000-8800,sales@sementonasa.co.id,01.999.888.7,Bank Mandiri,1234567890,5,true";
    } else if (type === "material") {
      headers = "Kode,Nama Material,Kategori,Merk,Spesifikasi,Unit/Satuan,Harga Standar,Min Stok,Max Stok";
      sampleRow = "MAT-120,Baja Tulangan D-16mm,Besi,Krakatau Steel,BJTS 420 Panjang 12m,Batang,225000,100,1000";
    } else {
      headers = "Kode,Nama Jasa,Deskripsi Pekerjaan,Unit/Satuan,Tarif Standar";
      sampleRow = "SRV-120,Pemasangan Rangka Atap Baja Ringan,Sistem galvalum terpasang termasuk tenaga kerja,m2,145000";
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, sampleRow].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FGI_Template_${type}_Master.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addSysNotify("success", `Berhasil mengunduh template CSV untuk data ${type}.`);
  };

  // Robust CSV parser to import multi-category masters
  const handleImportMasterCSV = (e: React.ChangeEvent<HTMLInputElement>, type: "supplier" | "material" | "jasa") => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportLogMessage(`Membaca file master ${type}...`);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error("File CSV kosong");
        
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) throw new Error("File CSV tidak memiliki baris data");
        
        // Custom robust CSV split helper that handles quoted strings
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
        
        const parsedRows = lines.map(splitLine);
        
        // Look for header row index (usually 0) but handle flexibly
        let headerIndex = -1;
        for (let i = 0; i < Math.min(parsedRows.length, 3); i++) {
          const joinedLow = parsedRows[i].join(" ").toLowerCase();
          if (
            joinedLow.includes("kode") || 
            joinedLow.includes("nama") || 
            joinedLow.includes("code") || 
            joinedLow.includes("harga") || 
            joinedLow.includes("price")
          ) {
            headerIndex = i;
            break;
          }
        }
        
        const startIndex = headerIndex !== -1 ? headerIndex + 1 : 0;
        let importedCount = 0;
        
        const cleanVal = (str: string) => {
          if (!str) return "";
          return str.replace(/^"|"$/g, '').trim();
        };

        const cleanNum = (str: string) => {
          if (!str) return 0;
          const cleanStr = str
            .replace(/^"|"$/g, '')
            .replace(/Rp\.?/gi, "")
            .replace(/\./g, "")
            .replace(/,/g, "")
            .trim();
          return parseFloat(cleanStr) || 0;
        };

        if (type === "supplier") {
          const newSuppliers: Supplier[] = [];
          for (let i = startIndex; i < parsedRows.length; i++) {
            const row = parsedRows[i];
            if (row.length < 2) continue;
            
            const code = cleanVal(row[0]) || `SPL-${Math.floor(100 + Math.random() * 900)}`;
            const name = cleanVal(row[1]);
            if (!name) continue;
            
            const companyName = cleanVal(row[2]) || name;
            const address = cleanVal(row[3]) || "Alamat belum diatur";
            const pic = cleanVal(row[4]) || "PIC Umum";
            const phone = cleanVal(row[5]) || "-";
            const email = cleanVal(row[6]) || "-";
            const npwp = cleanVal(row[7]) || "-";
            const bank = cleanVal(row[8]) || "Bank Mandiri";
            const accountNo = cleanVal(row[9]) || "-";
            const rating = parseInt(cleanVal(row[10])) || 5;
            const isActive = cleanVal(row[11])?.toLowerCase() !== "false";
            
            newSuppliers.push({
              id: "s-" + Math.random().toString(36).substring(2, 9),
              code, name, companyName, address, pic, phone, email, npwp, bank, accountNo, rating, isActive
            });
            importedCount++;
          }
          
          if (newSuppliers.length > 0) {
            setSuppliers(prev => {
              // De-duplicate: don't add code that already exists
              const existingCodes = new Set(prev.map(s => s.code.toLowerCase()));
              const filteredNew = newSuppliers.filter(ns => !existingCodes.has(ns.code.toLowerCase()));
              const updated = [...prev, ...filteredNew];
              localStorage.setItem("fos_po_suppliers", JSON.stringify(updated));
              return updated;
            });
            addSysNotify("success", `Berhasil mengimpor ${importedCount} supplier Baru.`);
          }
        } 
        else if (type === "material") {
          const newMaterials: MaterialItem[] = [];
          for (let i = startIndex; i < parsedRows.length; i++) {
            const row = parsedRows[i];
            if (row.length < 2) continue;
            
            const code = cleanVal(row[0]) || `MAT-${Math.floor(100 + Math.random() * 900)}`;
            const name = cleanVal(row[1]);
            if (!name) continue;
            
            const category = cleanVal(row[2]) || "Umum";
            const brand = cleanVal(row[3]) || "Lokal";
            const spec = cleanVal(row[4]) || "-";
            const unit = cleanVal(row[5]) || "Pcs";
            const standardPrice = cleanNum(row[6]);
            const minStock = cleanNum(row[7]) || 10;
            const maxStock = cleanNum(row[8]) || 1000;
            
            newMaterials.push({
              id: "m-" + Math.random().toString(36).substring(2, 9),
              code, name, category, brand, spec, unit, standardPrice, minStock, maxStock
            });
            importedCount++;
          }
          
          if (newMaterials.length > 0) {
            setMaterials(prev => {
              const existingCodes = new Set(prev.map(m => m.code.toLowerCase()));
              const filteredNew = newMaterials.filter(nm => !existingCodes.has(nm.code.toLowerCase()));
              const updated = [...prev, ...filteredNew];
              localStorage.setItem("fos_po_materials", JSON.stringify(updated));
              return updated;
            });
            addSysNotify("success", `Berhasil mengimpor ${importedCount} material master ke sistem.`);
          }
        } 
        else if (type === "jasa") {
          const newServices: ServiceItem[] = [];
          for (let i = startIndex; i < parsedRows.length; i++) {
            const row = parsedRows[i];
            if (row.length < 2) continue;
            
            const code = cleanVal(row[0]) || `SRV-${Math.floor(100 + Math.random() * 900)}`;
            const name = cleanVal(row[1]);
            if (!name) continue;
            
            const description = cleanVal(row[2]) || "-";
            const unit = cleanVal(row[3]) || "m2";
            const standardPrice = cleanNum(row[4]);
            
            newServices.push({
              id: "srv-" + Math.random().toString(36).substring(2, 9),
              code, name, description, unit, standardPrice
            });
            importedCount++;
          }
          
          if (newServices.length > 0) {
            setServices(prev => {
              const existingCodes = new Set(prev.map(s => s.code.toLowerCase()));
              const filteredNew = newServices.filter(ns => !existingCodes.has(ns.code.toLowerCase()));
              const updated = [...prev, ...filteredNew];
              localStorage.setItem("fos_po_services", JSON.stringify(updated));
              return updated;
            });
            addSysNotify("success", `Berhasil mengimpor ${importedCount} jasa konstruksi master ke sistem.`);
          }
        }
        
        setImportLogMessage(`Sukses! Mengimpor ${importedCount} data ke Database Master.`);
        setTimeout(() => setImportLogMessage(""), 5000);
      } catch (err: any) {
        setImportLogMessage(`Error impor: ${err.message || err}`);
        addSysNotify("warning", `Gagal mengimpor file: ${err.message || err}`);
        setTimeout(() => setImportLogMessage(""), 5000);
      } finally {
        e.target.value = "";
      }
    };
    
    reader.onerror = () => {
      setImportLogMessage("Gagal membaca file!");
      setTimeout(() => setImportLogMessage(""), 4000);
    };
    
    reader.readAsText(file, "UTF-8");
  };

  // FILTERED LISTS
  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRequests = requests.filter(r =>
    r.nomorPR.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.division.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(o =>
    o.nomorPO.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Financial KPIs helper
  const totalPOAmountCurrentMonth = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalPaidToSuppliers = payments.reduce((sum, p) => sum + p.amount, 0);
  const outstandingDebt = invoices.filter(i => i.status !== "Lunas").reduce((sum, i) => sum + i.totalBill, 0);

  return (
    <div className="space-y-6">
      
      {/* ENTERPRISE TITLE HEADER & PERSPECTIVE SIMULATOR BAR */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 text-slate-900 rounded-lg flex items-center justify-center font-black shadow-md">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black font-sans tracking-wide uppercase">Modul Purchase Order (PO) &amp; Supply Chain</h2>
            <p className="text-[10px] text-slate-400 font-mono">ERP ENTERPRISE GRADE • KELOLA PENGADAAN &amp; LOGISTIK INTEGRATIF</p>
          </div>
        </div>

        {/* Dynamic perspective role switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9.5px] font-bold text-slate-400 font-mono uppercase">Role Simulasi:</span>
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-850 flex items-center space-x-1">
            {[UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.SITE_ENGINEER, UserRole.FINANCE, UserRole.DIREKTUR].map((role) => (
              <button
                key={role}
                onClick={() => {
                  setActiveRole(role);
                  addSysNotify("info", `Beralih ke otorisasi peran: [${role}]`);
                }}
                className={`px-2 py-1 text-[9.5px] font-black rounded transition-all ${
                  activeRole === role 
                    ? "bg-amber-500 text-slate-950 font-bold shadow-sm" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DYNAMIC NOTIFICATIONS / SYSTEM LOG MONITOR */}
      {notifications.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3 flex items-center gap-2 text-xs font-mono select-none overflow-hidden max-w-full">
          <span className="bg-blue-600/10 text-blue-500 font-mono font-bold px-1.5 py-0.5 rounded text-[9.5px] uppercase shrink-0">System Log</span>
          <div className="flex-1 overflow-hidden truncate text-slate-600 dark:text-slate-300">
            <strong>{notifications[0].time}</strong> - {notifications[0].text}
          </div>
          <button 
            onClick={() => setNotifications([])} 
            className="text-[9.5px] font-bold text-rose-500 hover:underline cursor-pointer shrink-0 ml-2"
          >
            Bersihkan
          </button>
        </div>
      )}

      {/* COMPACT ERP SECTIONS NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-px">
        {[
          { tabId: "dashboard", label: "Dashboard PO", icon: ShoppingCart },
          { tabId: "suppliers", label: "Supplier & Vendor", icon: Star },
          { tabId: "requests", label: "Purchase Request (PR)", icon: FileText },
          { tabId: "comparison", label: "Banding Penawaran", icon: HelpCircle },
          { tabId: "orders", label: "Purchase Order (PO)", icon: CheckCircle2 },
          { tabId: "logistics", label: "Logistik & GR", icon: Truck },
          { tabId: "finance", label: "Invoice & Bayar", icon: Banknote },
          { tabId: "reports", label: "Laporan & Log", icon: TrendingUp },
        ].map((sub) => {
          const Icon = sub.icon;
          return (
            <button
              key={sub.tabId}
              onClick={() => setActiveSubTab(sub.tabId as any)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition duration-150 cursor-pointer ${
                activeSubTab === sub.tabId
                  ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sub.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================= SUB-TAB 1: PROCUREMENT DASHBOARD ======================= */}
      {activeSubTab === "dashboard" && (
        <div className="space-y-6">
          {/* KPI Mini widgets */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-xl shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">Total PO Bulan Ini</span>
              <div className="text-xl font-bold text-slate-800 dark:text-white mt-1 font-mono">
                {orders.length} Transaksi
              </div>
              <p className="text-[10px] text-emerald-500 mt-1 font-semibold flex items-center">
                <ArrowUpRight className="w-3 h-3" /> Memenuhi Limit Progres Proyek
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-xl shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">Nilai Total Pembelian</span>
              <div className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-1 font-mono">
                Rp {totalPOAmountCurrentMonth.toLocaleString("id-ID")}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Metode bayar tempo 30-60 hari logis</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-xl shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">Hutang Outstanding</span>
              <div className="text-xl font-bold text-rose-500 mt-1 font-mono">
                Rp {outstandingDebt.toLocaleString("id-ID")}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Invoice jatuh tempo dalam bulan berjalan</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-xl shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">Lunas Terbayar</span>
              <div className="text-xl font-bold text-emerald-500 mt-1 font-mono">
                Rp {totalPaidToSuppliers.toLocaleString("id-ID")}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Sudah divalidasi dengan voucher bank</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* AI PROCUREMENT SMART HELPER PANEL */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-850 rounded-xl p-5 text-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                    <span className="text-xs font-black font-mono uppercase text-slate-200">AI Procurement Advisor (FGI Gemini Model)</span>
                  </div>
                  <span className="bg-amber-500/20 text-amber-400 text-[8.5px] font-bold font-mono uppercase px-1.5 py-0.5 rounded">Aktif</span>
                </div>

                <div className="space-y-3.5 my-2">
                  {aiLog.map((log, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-[11.5px] leading-relaxed text-slate-350">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <div>{log}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center gap-2">
                <input 
                  type="text"
                  placeholder="Ketik pertanyaan e.g. 'Rekomendasikan supplier semen termurah'..."
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const input = (e.target as HTMLInputElement).value;
                      if (!input.trim()) return;
                      setAiLog(prev => [
                        ...prev, 
                        `💬 User: ${input}`,
                        `🔍 [Analisis Gemini]: Menganalisis historis harga supplier... Direkomendasikan 'Semen Indonesia Perkasa' untuk kuantiti >100 zak karena potongan volume sebesar 5.5%.`
                      ]);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    setAiLog(prev => [
                      ...prev, 
                      `📝 [Prediksi Kebutuhan]: Estimasi sisa material Besi Beton proyek ini cukup untuk 14 hari ke depan. Disarankan memesan kembali (re-order) 400 batang sebelum 20 Juni.`
                    ]);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2 rounded shrink-0 cursor-pointer"
                >
                  Prediksi Material
                </button>
              </div>
            </div>

            {/* QUICK OVER BUDGET PREVENTION DIAGRAM */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs">
              <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider mb-2">Peringatan Over Budget Proyek</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1 col-span-2">
                    <span className="text-slate-800 dark:text-slate-200">Realisasi Lapangan (PO)</span>
                    <span className="text-amber-600">38.4%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: "38.4%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800 dark:text-slate-200">Rencana Anggaran Biaya (RAB)</span>
                    <span className="text-slate-500">100% Maks</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-slate-500 h-2.5 rounded-full w-full" />
                  </div>
                </div>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-lg mt-5 text-[11px] leading-relaxed">
                <span className="font-extrabold text-emerald-600 block">Sinyal Biaya Hijau (Aman)</span>
                Upah, Material, & Alat tidak melampaui item RAB. Sisa plafon alokasi margin adalah sebesar <strong>61.6%</strong>.
              </div>
            </div>
          </div>

          {/* SIMULATED WORKFLOW STEP CARDS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl">
            <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider mb-4">Siklus Hidup Pembelian &amp; Pengadaan Terbimbing</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                { step: "1", name: "Purchase Request (PR)", role: "Site Engineer", desc: "Minta material di bawah stock min.", ok: requests.length > 0 },
                { step: "2", name: "Banding Penawaran", role: "Procurement", desc: "Minimal banding 3 supplier.", ok: comparisons.length > 0 },
                { step: "3", name: "Levelled Approval", role: "PM / Direktur", desc: "Verifikasi limit & TTD digital.", ok: orders.some(o => o.status.includes("Approved")) },
                { step: "4", name: "Goods Receipt (GR)", role: "Logistik", desc: "Checklist kempes/rusak.", ok: goodsReceipts.length > 0 },
                { step: "5", name: "Klaim & Bayar PO", role: "Finance", desc: "Invoice valid & transfer bank.", ok: payments.length > 0 },
              ].map((cycle, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-150 dark:border-slate-850 flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    cycle.ok ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  }`}>
                    {cycle.ok ? <Check className="w-3.5 h-3.5" /> : cycle.step}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{cycle.name}</h4>
                    <p className="text-[10px] text-indigo-500 font-mono uppercase mt-0.5">{cycle.role}</p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">{cycle.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================= SUB-TAB 2: SUPPLIERS REGISTER ======================= */}
      {activeSubTab === "suppliers" && (
        <div className="space-y-4">
          {/* Inner Sub-tab Switcher for Master Data Types */}
          <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-800 pb-2">
            <button
              onClick={() => {
                setActiveMasterSubTab("suppliers");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeMasterSubTab === "suppliers"
                  ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 font-black shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Mitra Supplier ({suppliers.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveMasterSubTab("materials");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeMasterSubTab === "materials"
                  ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 font-black shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Database Material Master ({materials.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveMasterSubTab("services");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeMasterSubTab === "services"
                  ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 font-black shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>Database Jasa/Subkon ({services.length})</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={
                  activeMasterSubTab === "suppliers" 
                    ? "Cari kode, nama, perusahaan..." 
                    : activeMasterSubTab === "materials" 
                      ? "Cari kode, nama material, brand..." 
                      : "Cari kode, nama jasa, deskripsi..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850 p-2 pl-9 text-xs border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  setImportMasterType(
                    activeMasterSubTab === "suppliers" ? "supplier" : activeMasterSubTab === "materials" ? "material" : "jasa"
                  );
                  setShowMasterImport(!showMasterImport);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition ${
                  showMasterImport 
                    ? "bg-amber-600 text-white" 
                    : "bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs"
                }`}
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Import Master CSV</span>
              </button>
              <button 
                onClick={() => {
                  if (activeMasterSubTab === "suppliers") {
                    exportToCSV("Supplier", suppliers);
                  } else if (activeMasterSubTab === "materials") {
                    exportToCSV("Materials", materials);
                  } else {
                    exportToCSV("Jasa_Services", services);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-880 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 font-bold rounded-lg cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel / CSV</span>
              </button>
              {activeMasterSubTab === "suppliers" && (
                <button 
                  onClick={() => setShowAddSupplier(!showAddSupplier)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Supplier</span>
                </button>
              )}
            </div>
          </div>

          {/* CSV Master Data Importer panel */}
          {showMasterImport && (
            <div className="bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-amber-500/30 p-5 rounded-xl space-y-4 text-left animate-fade-in text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b dark:border-slate-850 pb-3 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <FileUp className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>Import Wizard Master Data via CSV</span>
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Unggah file CSV master atau unduh template untuk setup data masal instan.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold font-mono shrink-0">Pilih Kategori Impor:</span>
                  <select
                    value={importMasterType}
                    onChange={(e) => setImportMasterType(e.target.value as any)}
                    className="p-1 px-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-bold focus:outline-none"
                  >
                    <option value="supplier">🏢 Mitra Supplier & Vendor</option>
                    <option value="material">📦 Database Material Master</option>
                    <option value="jasa">⚙️ Database Jasa Konstruksi</option>
                  </select>
                </div>
              </div>

              {/* Template download and info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 uppercase font-mono text-[10px] text-blue-500">
                    <span>1. Unduh File Contoh (Template)</span>
                  </h4>
                  <p className="text-slate-500 text-[11px]">
                    Gunakan file CSV template standar agar sistem kami dapat memetakan kolom secara otomatis dengan sempurna.
                  </p>
                  <button
                    type="button"
                    onClick={() => downloadMasterTemplate(importMasterType)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs cursor-pointer mt-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Template CSV - {importMasterType.toUpperCase()}</span>
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 uppercase font-mono text-[10px] text-emerald-500">
                    <span>2. Unggah File CSV Anda</span>
                  </h4>
                  <p className="text-slate-500 text-[11px]">
                    Pilih file CSV yang sudah diisi data master baru di perangkat Anda untuk diimpor masal.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleImportMasterCSV(e, importMasterType)}
                      className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-500 hover:file:bg-emerald-500/20 file:cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Status logger or warning notifications inside wizard */}
              {importLogMessage && (
                <div className={`p-3 rounded-lg border text-xs font-semibold ${
                  importLogMessage.toLowerCase().includes("sukses") || importLogMessage.toLowerCase().includes("berhasil")
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                }`}>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{importLogMessage}</span>
                  </div>
                </div>
              )}

              {/* Field mapping documentation section to ensure perfect user execution */}
              <div className="bg-slate-100 dark:bg-slate-900/60 p-3 rounded-lg font-mono text-[9.5px] text-slate-500 dark:text-slate-400 space-y-1">
                <div className="font-bold uppercase text-slate-600 dark:text-slate-300 border-b dark:border-slate-800 pb-1 mb-1.5 flex items-center gap-1">
                  <span>Panduan Kolom / Tata Cara Format:</span>
                </div>
                {importMasterType === "supplier" ? (
                  <>
                    <div>• <strong>Kolom (12 buah):</strong> Kode, Nama Supplier, Nama Perusahaan, Alamat, PIC, No HP, Email, NPWP, Bank, Rekening, Rating (1-5), Aktif (true/false)</div>
                    <div>• <strong>Contoh baris data:</strong> SPL-050,Mega Baja Sentosa,PT Mega Baja,Surabaya,Kevin Setiawan,08123-333,sales@megabaja.co.id,01.242,BCA,823876,5,true</div>
                  </>
                ) : importMasterType === "material" ? (
                  <>
                    <div>• <strong>Kolom (9 buah):</strong> Kode, Nama Material, Kategori, Merk, Spesifikasi, Satuan/Unit, Harga Standar, Minimum Stock, Maksimum Stock</div>
                    <div>• <strong>Contoh baris data:</strong> MAT-050,Pipa PVC Rucika 4 Inch,Paralon,Rucika,Tipe AW Tebal,Batang,125000,50,500</div>
                  </>
                ) : (
                  <>
                    <div>• <strong>Kolom (5 buah):</strong> Kode, Nama Jasa Pekerjaan, Rincian Deskripsi, Satuan/Unit, Tarif Standar Rupiah</div>
                    <div>• <strong>Contoh baris data:</strong> SRV-050,Pemasangan Keramik Lantai 60x60,Pasang keramik granit termasuk semen & adukan,m2,75000</div>
                  </>
                )}
                <div className="text-amber-500 font-bold dark:text-amber-400 mt-1.5 flex items-center gap-1">
                  <span>💡 Tips: Sistem akan melakukan de-duplikasi otomatis untuk Kode yang sudah terdaftar sebelumnya agar tidak terjadi bentrok data.</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================= SUB-SUB TAB: SUPPLIERS ======================= */}
          {activeMasterSubTab === "suppliers" && (
            <>
              {/* Add Supplier Form Pop-up */}
              {showAddSupplier && (
                <form onSubmit={handleCreateSupplier} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-md space-y-4 animate-fade-in text-xs text-left">
                  <h3 className="text-xs font-black uppercase text-slate-400 font-mono border-b pb-2 mb-3">Registrasi Supplier Baru</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input 
                      type="text" placeholder="Nama Supplier (Contoh: Krakatau Steel)" required
                      value={newSup.name} onChange={(e) => setNewSup({ ...newSup, name: e.target.value })}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white"
                    />
                    <input 
                      type="text" placeholder="Nama Perusahaan Resmi (PT / CV)" required
                      value={newSup.companyName} onChange={(e) => setNewSup({ ...newSup, companyName: e.target.value })}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white"
                    />
                    <input 
                      type="text" placeholder="PIC Penanggung Jawab"
                      value={newSup.pic} onChange={(e) => setNewSup({ ...newSup, pic: e.target.value })}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white"
                    />
                    <input 
                      type="text" placeholder="No HP PIC"
                      value={newSup.phone} onChange={(e) => setNewSup({ ...newSup, phone: e.target.value })}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white"
                    />
                    <input 
                      type="email" placeholder="Email Kantor"
                      value={newSup.email} onChange={(e) => setNewSup({ ...newSup, email: e.target.value })}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white"
                    />
                    <input 
                      type="text" placeholder="NPWP Badan Usaha"
                      value={newSup.npwp} onChange={(e) => setNewSup({ ...newSup, npwp: e.target.value })}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white"
                    />
                    <input 
                      type="text" placeholder="Alamat Gudang / Kantor"
                      value={newSup.address} onChange={(e) => setNewSup({ ...newSup, address: e.target.value })}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded md:col-span-3 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button type="button" onClick={() => setShowAddSupplier(false)} className="px-3.5 py-2 border rounded hover:bg-slate-100 text-slate-600 dark:text-slate-300">Batal</button>
                    <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded font-bold shadow">Simpan Vendor</button>
                  </div>
                </form>
              )}

              {/* Suppliers list Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-mono uppercase text-[9.5px] border-b border-slate-150 dark:border-slate-850">
                      <tr>
                        <th className="p-3">Kode</th>
                        <th className="p-3">Nama Perusahaan</th>
                        <th className="p-3">PIC / Kontak</th>
                        <th className="p-3">Email / NPWP</th>
                        <th className="p-3 font-semibold">Kualitas/Rating</th>
                        <th className="p-3 text-center font-semibold">Status</th>
                        <th className="p-3 text-right font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {filteredSuppliers.map((sup) => (
                        <tr key={sup.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-slate-755 dark:text-slate-200">
                          <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{sup.code}</td>
                          <td className="p-3">
                            <span className="block font-bold text-slate-900 dark:text-white">{sup.name}</span>
                            <span className="text-[10px] text-slate-400">{sup.companyName}</span>
                          </td>
                          <td className="p-3">
                            <span className="block">{sup.pic}</span>
                            <span className="text-[10px] text-slate-400">{sup.phone}</span>
                          </td>
                          <td className="p-3">
                            <span className="block text-slate-500">{sup.email}</span>
                            <span className="text-[9px] font-mono text-slate-400">{sup.npwp}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-3.5 h-3.5 ${
                                    i < sup.rating ? "fill-amber-500 text-amber-500" : "text-slate-250 dark:text-slate-800"
                                  }`} 
                                />
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-bold uppercase font-mono ${
                              sup.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                            }`}>
                              {sup.isActive ? "Aktif" : "Non-Aktif"}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button 
                              onClick={() => {
                                setSuppliers(prev => prev.filter(s => s.id !== sup.id));
                                addSysNotify("warning", `Vendor ${sup.companyName} dihapus dari register.`);
                              }}
                              className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredSuppliers.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 font-mono text-xs">
                            Tidak ditemukan data supplier master. Anda bisa impor melalui CSV.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ======================= SUB-SUB TAB: MATERIALS ======================= */}
          {activeMasterSubTab === "materials" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-mono uppercase text-[9.5px] border-b border-slate-150 dark:border-slate-850">
                    <tr>
                      <th className="p-3">Kode Material</th>
                      <th className="p-3">Nama Material / Spesifikasi</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Merk / Brand</th>
                      <th className="p-3 text-right">Harga Satuan</th>
                      <th className="p-3 text-center">Satuan</th>
                      <th className="p-3 text-center">Batas Stok (Min/Max)</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {materials
                      .filter(m => 
                        m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        m.brand.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-slate-755 dark:text-slate-200">
                          <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">{m.code}</td>
                          <td className="p-3">
                            <span className="block font-bold text-slate-900 dark:text-white">{m.name}</span>
                            <span className="text-[10px] text-slate-400">{m.spec || "-"}</span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-bold uppercase font-mono">
                              {m.category}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{m.brand || "Lokal / Multi"}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-teal-400">
                            Rp {m.standardPrice.toLocaleString("id-ID")}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-500 font-mono">{m.unit}</td>
                          <td className="p-3 text-center text-[10px] font-mono text-slate-400">
                            <span className="text-rose-500 font-bold">{m.minStock}</span> / <span className="text-blue-500 font-bold">{m.maxStock}</span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setMaterials(prev => {
                                  const updated = prev.filter(item => item.id !== m.id);
                                  localStorage.setItem("fos_po_materials", JSON.stringify(updated));
                                  return updated;
                                });
                                addSysNotify("warning", `Material master ${m.name} dihapus dari register database.`);
                              }}
                              className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    {materials.filter(m => 
                        m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        m.code.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 font-mono text-xs">
                            Tidak ditemukan data material master. Silakan klik "Import Master CSV" di atas untuk menambahkan masal.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================= SUB-SUB TAB: SERVICES ======================= */}
          {activeMasterSubTab === "services" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-mono uppercase text-[9.5px] border-b border-slate-150 dark:border-slate-850">
                    <tr>
                      <th className="p-3">Kode Pekerjaan</th>
                      <th className="p-3">Nama Jasa / Kategori Pekerjaan</th>
                      <th className="p-3">Rincian Deskripsi</th>
                      <th className="p-3 text-center font-semibold">Satuan/Unit</th>
                      <th className="p-3 text-right">Tarif / Harga Standar</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {services
                      .filter(s => 
                        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.description.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-slate-755 dark:text-slate-200">
                          <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{s.code}</td>
                          <td className="p-3">
                            <span className="block font-bold text-slate-900 dark:text-white">{s.name}</span>
                          </td>
                          <td className="p-3 text-slate-500 max-w-xs truncate">{s.description || "-"}</td>
                          <td className="p-3 text-center font-bold text-slate-500 font-mono">{s.unit}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-teal-450">
                            Rp {s.standardPrice.toLocaleString("id-ID")}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setServices(prev => {
                                  const updated = prev.filter(item => item.id !== s.id);
                                  localStorage.setItem("fos_po_services", JSON.stringify(updated));
                                  return updated;
                                });
                                addSysNotify("warning", `Jasa master ${s.name} dihapus dari register database.`);
                              }}
                              className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    {services.filter(s => 
                        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        s.code.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 font-mono text-xs">
                            Tidak ditemukan data jasa / subkontraktor. Silakan klik "Import Master CSV" di atas untuk menambahkan masal.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= SUB-TAB 3: PURCHASE REQUEST ======================= */}
      {activeSubTab === "requests" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">
              Purchase Request log ({filteredRequests.length} Transaksi)
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button 
                onClick={() => setShowAddPR(!showAddPR)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat PR Baru</span>
              </button>
            </div>
          </div>

          {/* Add PR Form */}
          {showAddPR && (
            <form onSubmit={handleCreatePR} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-md space-y-4 animate-fade-in text-xs text-left">
              <h3 className="text-xs font-black uppercase text-slate-400 font-mono border-b pb-2 mb-3">Formulir Purchase Request (PR)</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Divisi</label>
                  <select 
                    value={newPR.division} onChange={(e) => setNewPR({ ...newPR, division: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white"
                  >
                    <option value="Struktur">Struktur Utama</option>
                    <option value="Finishing">Arsitektural / Finishing</option>
                    <option value="MEP">Mekanikal Elektrikal Plumbing</option>
                    <option value="K3">Safety / K3</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Prioritas</label>
                  <select 
                    value={newPR.priority} onChange={(e) => setNewPR({ ...newPR, priority: e.target.value as any })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white"
                  >
                    <option value="Rendah">Rendah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Urgent">Urgent (Darurat)</option>
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Nama Barang / Material</label>
                  <input 
                    type="text" placeholder="E.g. Semen Portland Composite" required
                    value={newPR.itemName} onChange={(e) => setNewPR({ ...newPR, itemName: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Spesifikasi Detail</label>
                  <input 
                    type="text" placeholder="E.g. Zak 50kg, SNI"
                    value={newPR.spec} onChange={(e) => setNewPR({ ...newPR, spec: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Qantity (Jumlah)</label>
                  <input 
                    type="number" required
                    value={newPR.qty} onChange={(e) => setNewPR({ ...newPR, qty: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Satuan Satuan</label>
                  <select 
                    value={newPR.unit} onChange={(e) => setNewPR({ ...newPR, unit: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white"
                  >
                    <option value="Batang">Batang</option>
                    <option value="Zak">Zak</option>
                    <option value="m3">Meter Kubik (m3)</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Kg">Kg</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Format Kebutuhan Tanggal</label>
                  <input 
                    type="date" required
                    value={newPR.needDate} onChange={(e) => setNewPR({ ...newPR, needDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1 md:col-span-4">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Catatan Pemohon</label>
                  <input 
                    type="text" placeholder="Berikan penjelasan untuk justifikasi permohonan pengadaan..."
                    value={newPR.notes} onChange={(e) => setNewPR({ ...newPR, notes: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAddPR(false)} className="px-3.5 py-2 border rounded hover:bg-slate-100 text-slate-600 dark:text-slate-300">Batal</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded font-bold shadow">Kirim PR ke PM</button>
              </div>
            </form>
          )}

          {/* PR Grid List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((pr) => (
              <div key={pr.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-between text-left">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-dashed pb-1.5 border-slate-150 dark:border-slate-850">
                    <span className="font-mono text-[10.5px] font-extrabold text-blue-600 dark:text-blue-400">{pr.nomorPR}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase font-mono ${
                      pr.priority === "Urgent" ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {pr.priority}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-slate-800 dark:text-white">
                      {pr.items[0]?.qty} {pr.items[0]?.unit} {pr.items[0]?.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 italic">"{pr.items[0]?.notes}"</p>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-slate-450 font-mono">
                      <span>Divisi: <strong>{pr.division}</strong></span>
                      <span>Target Kirim: <strong>{pr.items[0]?.needDate}</strong></span>
                      <span>Pemohon: {pr.requester}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-850 mt-4 flex items-center justify-between">
                  {/* Status Indicator */}
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono ${
                    pr.status === "Approved" ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                  }`}>
                    {pr.status}
                  </span>

                  {/* Actions for PM/Admin */}
                  <div className="flex items-center space-x-1.5">
                    {pr.status === "Menunggu Approval" && (activeRole === UserRole.PROJECT_MANAGER || activeRole === UserRole.ADMIN) && (
                      <button 
                        onClick={() => handleApprovePR(pr.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10.5px] rounded cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Sahkan Minta</span>
                      </button>
                    )}
                    {pr.status === "Approved" && (
                      <button 
                        onClick={() => {
                          const matchedComp = comparisons.find(c => c.prId === pr.id);
                          if (matchedComp) {
                            setActiveSubTab("comparison");
                          } else {
                            addSysNotify("warning", "Quotation belum dibuat untuk barang PR ini.");
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10.5px] rounded cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-slate-950" />
                        <span>Banding Harga</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= SUB-TAB 4: VENDOR QUOTATION COMPARISON ======================= */}
      {activeSubTab === "comparison" && (
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4 text-xs">
            <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              SOP Pengadaan FGI: Minimal Bandingkan 3 Quotation Vendor
            </h3>
            <p className="text-slate-450 mt-1 leading-normal">
              Demi transparansi dan efisiensi budgeting, setiap PO wajib merujuk komparasi harga minimal 3 vendor tepercaya sebelum disetujui PM atau Direksi.
            </p>
          </div>

          {comparisons.map((comp) => (
            <div key={comp.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs text-left">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-150 dark:border-slate-850 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black font-mono uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                    Rujukan: {comp.prNum}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white mt-1">
                    Banding Penawaran: {comp.itemName} ({comp.qty} Unit)
                  </h4>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button 
                    onClick={() => handleExportComparisonPDF(comp)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:hover:bg-rose-900/30 dark:text-rose-450 text-[10.5px] font-mono font-extrabold rounded-lg flex items-center gap-1 transition cursor-pointer"
                    title="Export Evaluasi Banding Penawaran ke PDF"
                  >
                    <Download className="w-3 h-3 text-rose-500" />
                    <span>Cetak PDF</span>
                  </button>
                  <button 
                    onClick={() => triggerEmailComparison(comp)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:hover:bg-blue-900/30 dark:text-blue-450 text-[10.5px] font-mono font-extrabold rounded-lg flex items-center gap-1 transition cursor-pointer"
                    title="Kirim Evaluasi Penawaran lewat Email"
                  >
                    <Send className="w-3 h-3 text-blue-500" />
                    <span>Kirim Email</span>
                  </button>
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline ml-2">Total: <strong>3 Vendor</strong></span>
                </div>
              </div>

              {/* Side by side supplier offer visual comparison mapping */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
                {comp.offers.map((offer, oIdx) => {
                  const subTotal = offer.pricePerUnit * comp.qty;
                  
                  // AI highlights: Krakatau is rating 5 stars & lowest per unit is cheapest
                  const isCheapest = offer.pricePerUnit === Math.min(...comp.offers.map(o => o.pricePerUnit));
                  const isHighestRating = offer.rating === 5;
                  const isFastest = offer.deliveryDays === Math.min(...comp.offers.map(o => o.deliveryDays));

                  return (
                    <div key={oIdx} className="p-5 space-y-4 flex flex-col justify-between relative bg-white dark:bg-slate-900">
                      
                      {/* Badge anomalies and smart hints */}
                      <div className="absolute right-4 top-4 flex flex-col items-end gap-1">
                        {isCheapest && <span className="bg-emerald-500/15 text-emerald-400 text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">Banderol Terendah</span>}
                        {isHighestRating && <span className="bg-amber-500/15 text-amber-400 text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">Eselon Terbaik</span>}
                        {isFastest && <span className="bg-blue-500/15 text-blue-400 text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">Selesai Tercepat</span>}
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-0.5">
                          <span className="text-[10.5px] font-black uppercase text-slate-400 font-mono tracking-wider">Pemasok</span>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-white">{offer.supplierName}</h5>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="block text-[10px] text-slate-400">Harga Satuan</span>
                            <span className="font-bold text-slate-900 dark:text-slate-150 font-mono">
                              Rp {offer.pricePerUnit.toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400">Total Penawaran</span>
                            <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                              Rp {subTotal.toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400">Estimasi Kirim</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{offer.deliveryDays} Hari Kerja</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400">Garansi &amp; Mutu</span>
                            <span className="font-medium text-slate-500 leading-tight">{offer.warranty}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-50 dark:border-slate-850">
                        <button 
                          onClick={() => handleCreatePOFromPR(comp, oIdx)}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-950 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-[10.5px] rounded shadow-xs transition cursor-pointer"
                        >
                          Pilih &amp; Buat PO
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================= SUB-TAB 5: PURCHASE ORDER WORKFLOW ======================= */}
      {activeSubTab === "orders" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase">
                Purchase Order extended list ({orders.length} Transaksi)
              </span>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button 
                onClick={() => setShowPOImport(!showPOImport)}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-650 hover:bg-purple-700 text-white text-xs font-bold rounded-lg cursor-pointer transition"
                title="Impor PO dari file CSV"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Impor CSV PO</span>
              </button>
              <button 
                onClick={handlePOSlowStockAuto}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg cursor-pointer animate-pulse"
                title="Sistem logistik cerdas auto low-stock trigger"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>Otomatis PO (Low Stock)</span>
              </button>
              <button 
                onClick={() => setShowAddPOManual(!showAddPOManual)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log PO Manual</span>
              </button>
            </div>
          </div>

          {/* CSV IMPORT PO DROPZONE PANEL */}
          {showPOImport && (
            <div className="bg-purple-500/5 border border-purple-500/20 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs animate-in slide-in-from-top-6 text-left">
              <div className="space-y-1 text-left">
                <h3 className="font-bold text-slate-850 dark:text-purple-400 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <FileUp className="w-4 h-4 text-purple-600" />
                  Impor Massal Purchase Orders (PO) via CSV
                </h3>
                <p className="text-slate-500">
                  Unggah file CSV dengan kolom header standar: <strong className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10.5px]">Nomor PO, Tanggal PO, Pemasok, Metode Pembayaran, Alamat Pengiriman, Kode Material, Nama Material ...</strong>
                </p>
                {poImportLog && (
                  <p className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 animate-pulse mt-2">{poImportLog}</p>
                )}
              </div>
              <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={downloadPOTemplate}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Unduh Template CSV
                </button>
                <label className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold rounded-xl transition cursor-pointer shadow-sm relative overflow-hidden">
                  <span>Pilih File CSV...</span>
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleImportPOCSV} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                </label>
              </div>
            </div>
          )}

          {/* Add PO Manual */}
          {showAddPOManual && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPOExt.supplierId || !newPOExt.itemName || newPOExt.qty <= 0) return;
                const activeSupObj = suppliers.find(s => s.id === newPOExt.supplierId);
                const subTotal = newPOExt.qty * newPOExt.price;
                const ppn = subTotal * (newPOExt.taxRate / 100);
                const pph = subTotal * 0.02;
                const grandTotal = subTotal + ppn - pph;
                const num = `PO-2026-06-0000${orders.length + 1}`;

                const entry: POExtended = {
                  id: `po-ext-${Date.now()}`,
                  nomorPO: num,
                  date: new Date().toISOString().split("T")[0],
                  projectName: selectedProject?.namaProyek || "Proyek Jalan Layang",
                  supplierName: activeSupObj ? activeSupObj.name : "Krakatau Steel Utama",
                  deliveryDate: newPOExt.deliveryDate || new Date().toISOString().split("T")[0],
                  deliveryAddress: newPOExt.deliveryAddress || "Proyek Site FGI",
                  paymentMethod: newPOExt.paymentMethod,
                  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                  notes: newPOExt.notes,
                  items: [{
                    code: "MAT-MOCK",
                    name: newPOExt.itemName,
                    spec: "Manual",
                    qty: newPOExt.qty,
                    unit: "Unit",
                    price: newPOExt.price,
                    discount: 0,
                    tax: newPOExt.taxRate,
                    total: subTotal
                  }],
                  subtotal: subTotal,
                  discountTotal: 0,
                  ppn,
                  pph,
                  grandTotal,
                  status: "Draft",
                  deliveryStatus: "Belum Dikirim",
                  paymentStatus: "Belum Dibayar"
                };

                setOrders(prev => [...prev, entry]);
                setShowAddPOManual(false);
                addSysNotify("success", `Log Purchase Order Manual ${num} berhasil terdaftar.`);
              }} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-md space-y-4 text-xs text-left"
            >
              <h3 className="text-xs font-black uppercase text-slate-400 font-mono border-b pb-2 mb-3">Registrasi PO Manual Baru</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Pilih Supplier</label>
                  <select 
                    value={newPOExt.supplierId} onChange={(e) => setNewPOExt({ ...newPOExt, supplierId: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850"
                  >
                    <option value="">-- Hubungkan Vendor --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Pilih Material</label>
                  <input 
                    type="text" placeholder="Ketik nama item..." required
                    value={newPOExt.itemName} onChange={(e) => setNewPOExt({ ...newPOExt, itemName: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Harga Satuan</label>
                  <input 
                    type="number" required
                    value={newPOExt.price} onChange={(e) => setNewPOExt({ ...newPOExt, price: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Kuantitas</label>
                  <input 
                    type="number" required
                    value={newPOExt.qty} onChange={(e) => setNewPOExt({ ...newPOExt, qty: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Pajak PPN (%)</label>
                  <input 
                    type="number"
                    value={newPOExt.taxRate} onChange={(e) => setNewPOExt({ ...newPOExt, taxRate: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Kebutuhan Tanggal Kirim</label>
                  <input 
                    type="date"
                    value={newPOExt.deliveryDate} onChange={(e) => setNewPOExt({ ...newPOExt, deliveryDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850"
                  />
                </div>
                <div className="space-y-1 md:col-span-4">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Catatan Khusus PO</label>
                  <input 
                    type="text" placeholder="Berikan instruksi pengiriman, terms & condition di lapangan..."
                    value={newPOExt.notes} onChange={(e) => setNewPOExt({ ...newPOExt, notes: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAddPOManual(false)} className="px-3.5 py-2 border rounded hover:bg-slate-100 text-slate-600 dark:text-slate-300">Batal</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded font-bold shadow">Registrasi PO Draft</button>
              </div>
            </form>
          )}

          {/* PO List rendering with expanded workflow calculations */}
          <div className="space-y-4">
            {filteredOrders.map((po) => {
              // Approval authorization rules checked against simul-role
              const isPM = activeRole === UserRole.PROJECT_MANAGER || activeRole === UserRole.ADMIN;
              const isGM = activeRole === UserRole.ADMIN; // GM represented as Admin
              const isDirector = activeRole === UserRole.DIREKTUR || activeRole === UserRole.OWNER || activeRole === UserRole.ADMIN;

              let nextApprovalAllowed = false;
              if (po.status === "Draft" || po.status === "Submitted") {
                nextApprovalAllowed = true; // Anyone up to authorization limit can confirm
              } else if (po.status === "Approved Level 1" && po.grandTotal > 50000000) {
                nextApprovalAllowed = true; // can proceed to Level 2
              } else if (po.status === "Approved Level 2" && po.grandTotal > 500000000) {
                nextApprovalAllowed = true; // can proceed to Level 3
              }

              return (
                <div key={po.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-left shadow-xs space-y-4">
                  
                  {/* Item Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-dashed pb-3 border-slate-150 dark:border-slate-850">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-900 dark:text-white uppercase">{po.nomorPO}</span>
                        <span className="text-[10px] text-slate-400 font-mono">| {po.date}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-1">Vendor: <strong>{po.supplierName}</strong></p>
                    </div>

                    {/* Step levels state visual track */}
                    <div className="flex items-center space-x-1 font-mono text-[9px] font-bold">
                      {["Submitted", "Approved Level 1", "Approved Level 2", "Approved Level 3"].map((st) => {
                        const isDone = po.status === st || 
                          (st === "Submitted" && po.status !== "Draft") ||
                          (st === "Approved Level 1" && (po.status === "Approved Level 2" || po.status === "Approved Level 3")) ||
                          (st === "Approved Level 2" && po.status === "Approved Level 3");
                        return (
                          <span 
                            key={st}
                            className={`px-2 py-0.5 rounded uppercase ${
                              isDone ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-850 text-slate-400"
                            }`}
                          >
                            {st === "Submitted" ? "Ajuan" : st === "Approved Level 1" ? "Lvl 1 (PM)" : st === "Approved Level 2" ? "Lvl 2 (GM)" : "Lvl 3 (Direksi)"}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Items of PO & automatic calculations */}
                  <div className="space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg space-y-2">
                      <div className="grid grid-cols-12 text-[10px] text-slate-450 uppercase font-mono border-b pb-1 mb-1 border-slate-200 dark:border-slate-800">
                        <span className="col-span-6 font-bold">Nama Item &amp; Deskripsi</span>
                        <span className="col-span-2 text-right">Qty/Unit</span>
                        <span className="col-span-2 text-right">Harga Satuan</span>
                        <span className="col-span-2 text-right font-bold">Subtotal</span>
                      </div>
                      {po.items.map((it, idx) => (
                        <div key={idx} className="grid grid-cols-12 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                          <div className="col-span-6">
                            <span className="block font-bold">{it.name}</span>
                            <span className="text-[10px] text-slate-400 italic">{it.spec}</span>
                          </div>
                          <span className="col-span-2 text-right font-mono">{it.qty} {it.unit}</span>
                          <span className="col-span-2 text-right font-mono">Rp {it.price.toLocaleString("id-ID")}</span>
                          <span className="col-span-2 text-right font-mono font-bold">Rp {it.total.toLocaleString("id-ID")}</span>
                        </div>
                      ))}
                    </div>

                    {/* Cost control tallies */}
                    <div className="flex justify-end text-xs font-medium">
                      <div className="w-64 space-y-1.5 font-mono text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-450">Subtotal:</span>
                          <span className="text-slate-750 dark:text-slate-350">Rp {po.subtotal.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between text-rose-500">
                          <span>Diskon:</span>
                          <span>- Rp {po.discountTotal.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-450">PPN (11%):</span>
                          <span>+ Rp {po.ppn.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between text-emerald-500">
                          <span>PPh (Dipotong):</span>
                          <span>- Rp {po.pph.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1.5 font-extrabold text-blue-600 dark:text-blue-400 text-xs">
                          <span>Grand Total Bill:</span>
                          <span className="font-mono">Rp {po.grandTotal.toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions for PO Flow approvals based on tiered limits and simul-role verification */}
                  <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4 font-mono text-[10px]">
                      <span>Metode: <strong>{po.paymentMethod}</strong></span>
                      <span>Logistik: <strong className="text-amber-500">{po.deliveryStatus}</strong></span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* Cancel / Revoke PO */}
                      {po.status !== "Cancelled" && !po.status.includes("Level 3") && (
                        <button 
                          onClick={() => handleCancelPO(po.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-slate-400 hover:text-rose-500 font-bold max-sm:px-2 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Batalkan PO</span>
                        </button>
                      )}

                      {/* Approval flow buttons */}
                      {nextApprovalAllowed && po.status !== "Cancelled" && (
                        <button 
                          onClick={() => handlePOApproval(po.id)}
                          className="flex items-center gap-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-lg cursor-pointer shadow-xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Bubuhkan TTD Approval</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================= SUB-TAB 6: DELIVERY TRACKING & GR ======================= */}
      {activeSubTab === "logistics" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">
              Goods Receipt (GR) &amp; Berita Acara ({goodsReceipts.length} Penerimaan)
            </span>
            <button 
              onClick={() => setShowAddGR(!showAddGR)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Penerimaan (GR)</span>
            </button>
          </div>

          {/* Add Goods Receipt Form with quality checklists */}
          {showAddGR && (
            <form onSubmit={handleCreateGR} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-md space-y-4 text-xs text-left">
              <h3 className="text-xs font-black uppercase text-slate-400 font-mono border-b pb-2 mb-3">Registrasi Penerimaan Barang / Jasa (Goods Receipt)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-450">Rujukan PO Proyek</label>
                  <select 
                    value={newGR.poId} onChange={(e) => setNewGR({ ...newGR, poId: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850"
                  >
                    <option value="">-- Hubungkan Rujukan PO --</option>
                    {orders.map(o => <option key={o.id} value={o.id}>{o.nomorPO} ({o.supplierName})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-450">Nama Penerima Petugas</label>
                  <input 
                    type="text" placeholder="E.g. Kurnia (Logistik)"
                    value={newGR.receiver} onChange={(e) => setNewGR({ ...newGR, receiver: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-450">Kondisi Barang Diterima</label>
                  <input 
                    type="text" placeholder="Contoh: Baik, lurus, tidak ada cacat"
                    value={newGR.condition} onChange={(e) => setNewGR({ ...newGR, condition: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850"
                  />
                </div>

                {/* Checklist options */}
                <div className="md:col-span-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-lg flex flex-wrap gap-4 font-mono text-[10px] uppercase font-bold border">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={newGR.qtyMatch} onChange={(e) => setNewGR({ ...newGR, qtyMatch: e.target.checked })} />
                    <span>Sesuai Qantity</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={newGR.specMatch} onChange={(e) => setNewGR({ ...newGR, specMatch: e.target.checked })} />
                    <span>Sesuai Spesifikasi</span>
                  </label>
                  <label className="flex items-center gap-2 text-rose-500">
                    <input type="checkbox" checked={newGR.isDamaged} onChange={(e) => setNewGR({ ...newGR, isDamaged: e.target.checked })} />
                    <span>Barang Rusak</span>
                  </label>
                  <label className="flex items-center gap-2 text-rose-500">
                    <input type="checkbox" checked={newGR.isDeficit} onChange={(e) => setNewGR({ ...newGR, isDeficit: e.target.checked })} />
                    <span>Barang Kurang</span>
                  </label>
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-450">Catatan Khusus Penerimaan Goods Receipt</label>
                  <textarea 
                    placeholder="Berikan laporan kempes ban, plat truk, supir, atau catatan tumpukan muatan pecah..."
                    value={newGR.notes} onChange={(e) => setNewGR({ ...newGR, notes: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAddGR(false)} className="px-3.5 py-2 border rounded hover:bg-slate-100 text-slate-600 dark:text-slate-300">Batal</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded font-bold shadow">Sahkan Berita Acara GR</button>
              </div>
            </form>
          )}

          {/* GR Card list render layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goodsReceipts.map((gr) => (
              <div key={gr.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl text-left text-xs space-y-3 shadow-xs">
                <div className="flex justify-between items-center border-b pb-1.5 border-slate-100 dark:border-slate-800 font-mono text-[10px]">
                  <span className="font-bold text-slate-700 dark:text-slate-100">{gr.grNumber}</span>
                  <span className="text-slate-400">Rujuk: {gr.poNumber}</span>
                </div>

                <div className="space-y-1">
                  <span className="block font-bold text-slate-800 dark:text-white">Diterima oleh: {gr.receiver}</span>
                  <span className="block text-[10px] text-slate-400">Tanggal: {gr.receivedDate}</span>
                  <p className="text-slate-550 italic text-[11px] font-normal">"{gr.condition}"</p>
                </div>

                {/* Checklists Indicators mapping */}
                <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] font-black uppercase">
                  <span className={`px-2 py-0.5 rounded ${gr.qtyMatch ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                    Sesuai Qty: {gr.qtyMatch ? "✓" : "✗"}
                  </span>
                  <span className={`px-2 py-0.5 rounded ${gr.specMatch ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                    Sesuai Spec: {gr.specMatch ? "✓" : "✗"}
                  </span>
                  {gr.isDamaged && (
                    <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded">Rusak</span>
                  )}
                  {gr.isDeficit && (
                    <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded">Kurang</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= SUB-TAB 7: FINANCE INVOICES & PAYMENTS ======================= */}
      {activeSubTab === "finance" && (
        <div className="space-y-6">
          {/* Action trigger panels */}
          <div className="flex flex-wrap items-center gap-2.5 justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">
              Verifikasi Invoice Vendor &amp; Rekaman Kas Keluar ({invoices.length} Klaim Tagihan)
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAddInvoice(!showAddInvoice)}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 font-bold rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Terima Invoice</span>
              </button>
              <button 
                onClick={() => setShowAddPayment(!showAddPayment)}
                className="flex items-center gap-1 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat Pembayaran PO</span>
              </button>
            </div>
          </div>

          {/* Add Invoice panel */}
          {showAddInvoice && (
            <form onSubmit={handleCreateInvoice} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-md space-y-4 text-xs text-left animate-fade-in">
              <h3 className="text-xs font-black uppercase text-slate-400 font-mono border-b pb-2 mb-3">Penerimaan Invoice Tagihan Vendor</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input 
                  type="text" placeholder="Nomor Invoice (E.g. INV-KS-101)" required
                  value={newInv.invoiceNumber} onChange={(e) => setNewInv({ ...newInv, invoiceNumber: e.target.value })}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850"
                />
                <select 
                  value={newInv.poId} onChange={(e) => setNewInv({ ...newInv, poId: e.target.value })}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850"
                  required
                >
                  <option value="">-- Kaitkan Rujukan PO --</option>
                  {orders.map(o => <option key={o.id} value={o.id}>{o.nomorPO} ({o.supplierName})</option>)}
                </select>
                <input 
                  type="date"
                  value={newInv.invoiceDate} onChange={(e) => setNewInv({ ...newInv, invoiceDate: e.target.value })}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAddInvoice(false)} className="px-3.5 py-2 border rounded text-slate-500">Batal</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded font-bold shadow">Simpan Invoice</button>
              </div>
            </form>
          )}

          {/* Add Payment panel */}
          {showAddPayment && (
            <form onSubmit={handleCreatePayment} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-md space-y-4 text-xs text-left animate-fade-in">
              <h3 className="text-xs font-black uppercase text-slate-400 font-mono border-b pb-2 mb-3">Registrasi Pembayaran Supplier</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select 
                  value={newPay.invoiceId} onChange={(e) => setNewPay({ ...newPay, invoiceId: e.target.value })}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850"
                  required
                >
                  <option value="">-- Kaitkan Tagihan Invoice --</option>
                  {invoices.map(i => <option key={i.id} value={i.id}>{i.invoiceNumber} (Tagihan: Rp{i.totalBill.toLocaleString("id-ID")})</option>)}
                </select>
                <input 
                  type="number" placeholder="Nominal Bayar (Rp)" required
                  value={newPay.amount} onChange={(e) => setNewPay({ ...newPay, amount: Number(e.target.value) })}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850"
                />
                <input 
                  type="text" placeholder="Bank Sumber (E.g. Bank Mandiri)"
                  value={newPay.bankName} onChange={(e) => setNewPay({ ...newPay, bankName: e.target.value })}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAddPayment(false)} className="px-3.5 py-2 border rounded text-slate-500">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded font-bold shadow">Keluarkan Kas Pembayaran</button>
              </div>
            </form>
          )}

          {/* Master layout divided side-by-side: Invoices & payments tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
            
            {/* Invoices */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-150 dark:border-slate-850">
                <h4 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">Invoices &amp; Vendor Claims</h4>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 p-4 space-y-3">
                {invoices.map((inv) => (
                  <div key={inv.id} className="text-xs space-y-1 pt-2 first:pt-0">
                    <div className="flex justify-between items-center font-mono text-[10px]">
                      <span className="font-bold text-indigo-500">{inv.invoiceNumber}</span>
                      <span className="text-slate-400">{inv.invoiceDate}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>{inv.supplierName}</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400">Rp {inv.totalBill.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Rujuk PO: {inv.poNumber} • GR: {inv.grNumber}</span>
                      <span className={`font-mono uppercase font-bold p-0.5 rounded text-[8.5px] ${
                        inv.status === "Lunas" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      }`}>{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payments */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-150 dark:border-slate-850">
                <h4 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">Payments Kas Keluar Histori</h4>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 p-4 space-y-3">
                {payments.length === 0 ? (
                  <p className="text-xs italic text-slate-400 text-center py-8">Belum ada transaksi pembayaran keluar bulan ini.</p>
                ) : (
                  payments.map((pay) => (
                    <div key={pay.id} className="text-xs space-y-1 pt-2 first:pt-0">
                      <div className="flex justify-between font-mono text-[10px] text-indigo-500">
                        <span>{pay.paymentNumber}</span>
                        <span>{pay.payDate}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span>Invoice: {pay.invoiceNumber}</span>
                        <span className="font-mono text-emerald-500">Rp {pay.amount.toLocaleString("id-ID")}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">Metode: {pay.method} ({pay.bankName}) • Transaksi ID: {pay.id.substring(0, 8)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= SUB-TAB 8: REPORTS & EXPOST CENTER ======================= */}
      {activeSubTab === "reports" && (
        <div className="space-y-6 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Download reports widgets */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 border-b pb-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                Pusat Unduhan Laporan Pengadaan
              </h3>
              
              <div className="space-y-2.5">
                {[
                  { title: "Laporan Seluruh Purchase Request (PR)", array: requests, file: "PurchaseRequests" },
                  { title: "Laporan Log Purchase Order (PO)", array: orders, file: "PurchaseOrders" },
                  { title: "Laporan Mitra Supplier & Vendor", array: suppliers, file: "VendorsList" },
                  { title: "Laporan Mutasi Penerimaan Barang (GR)", array: goodsReceipts, file: "GoodsReceipts_BA" },
                  { title: "Laporan Keuangan Invoice Hutang Usulan", array: invoices, file: "InvoicesAP" },
                ].map((rep, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350">{rep.title}</span>
                    <button 
                      onClick={() => exportToCSV(rep.file, rep.array)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-950 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-[10.5px] rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Unduh Excel</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Change log audits representation */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 border-b pb-2">
                <AlertCircle className="w-4 h-4 text-indigo-500" />
                Audit Logs Keamanan Pembelian &amp; AP
              </h3>
              <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1 text-[11px] font-mono leading-relaxed">
                {[
                  { time: "2026-06-07 10:44", role: "PM", act: "Aproved Level 1 PO-2026-06-00001", details: "Plafond di bawah 50jt disetujui digital." },
                  { time: "2026-06-06 14:10", role: "Finance", act: "Invoice Recived INV-KS-22129", details: "Dicatat liability hutang Rp 61.040.000." },
                  { time: "2026-06-05 09:22", role: "Logistik", act: "Goods Receipt GR-0001", details: "Pengiriman pertama besi beton disahkan." },
                  { time: "2026-06-02 11:15", role: "Procurement", act: "PO-0001 Generated", details: "Dari PR-0001 offer Krakatau Steel." },
                  { time: "2026-06-01 08:30", role: "Site Eng", act: "Purchase Request PR-0001 Submitted", details: "Kebutuhan perakitan kolom zona 2 proyek." }
                ].map((aud, i) => (
                  <div key={i} className="p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850">
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1">
                      <span>{aud.time}</span>
                      <span className="text-indigo-500 font-black">[{aud.role}]</span>
                    </div>
                    <div>
                      <strong>{aud.act}</strong>
                      <p className="text-slate-400 mt-0.5">{aud.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
