import React, { useState, useEffect } from "react";
import { useProject } from "../context/ProjectContext";
import { UserRole } from "../types";
import { jsPDF } from "jspdf";
import {
  TrendingUp, TrendingDown, DollarSign, Building, Briefcase, ShieldCheck, AlertTriangle, FileText,
  Sparkles, Plus, Search, Building2, Grid, Layers, PieChart, Calendar, Users, Settings, CheckCircle2,
  XCircle, AlertCircle, Trash2, Edit3, Check, CheckSquare, Square, Bell, FileDown, X, ChevronRight,
  Info, Lock, FileCheck, Truck, HelpCircle, Send, Activity, Wallet, CreditCard, RefreshCw, Clock
} from "lucide-react";

// Inner interfaces for CashFlow Module
interface BankAccount {
  id: string;
  bankName: string;
  accountNo: string;
  ownerName: string;
  branch: string;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  isActive: boolean;
}

interface PettyCash {
  id: string;
  cashName: string;
  location: string;
  picName: string;
  initialBalance: number;
  currentBalance: number;
}

interface ProjectContractTermin {
  id: string;
  projectId: string;
  label: string; // e.g. "DP 20%", "Termin 1 (30%)"
  progressRequired: number; // e.g. 20, 50, 80, 100
  amount: number;
  status: "Belum Ditagih" | "Ditagih" | "Dibayar" | "Overdue";
  dueDate: string;
}

interface AccountReceivable {
  id: string;
  invoiceNo: string;
  customerName: string;
  projectId: string;
  projectName: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  remainingAmount: number;
  status: "Unpaid" | "Partially Paid" | "Paid" | "Overdue";
}

interface AccountPayable {
  id: string;
  supplierName: string;
  invoiceNo: string;
  poNo: string;
  grNo: string;
  amount: number;
  dueDate: string;
  status: "Belum Jatuh Tempo" | "Jatuh Tempo" | "Overdue" | "Paid";
}

interface PayrollEmployee {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  bonus: number;
  allowance: number;
  deductions: number;
  bpjs: number;
  tax: number;
  attendanceRate: number; // e.g. 95 (out of 100)
  status: "Belum Dibayar" | "Paid";
}

interface AssetEquipment {
  id: string;
  assetName: string;
  category: "Alat Berat" | "Kendaraan Ops" | "Peralatan Kantor" | "Aset Sipil";
  purchaseCost: number;
  purchaseDate: string;
  depreciationRate: number; // % annual
  maintenanceCost: number;
  rentalRevenue: number;
  saleValue?: number;
}

export const CashFlowManagement: React.FC = () => {
  const {
    projects,
    selectedProject,
    transactions,
    addTransaction,
    approveTransaction,
    purchaseOrders,
    staff
  } = useProject();

  // Tab State
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "master" | "cashin" | "cashout" | "receivables" | "budgets" | "ai" | "reports"
  >("overview");

  // Multi-project toggle state values
  const [projectIdFilter, setProjectIdFilter] = useState<string>("all");
  const [divisionFilter, setDivisionFilter] = useState<string>("Semua");
  const [branchFilter, setBranchFilter] = useState<string>("Semua");

  // Notification Toast Simulation
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; title: string; desc: string; date: string }>>([
    { id: "not-1", type: "warning", title: "Piutang Mendekati Jatuh Tempo", desc: "Invoice INV-FOS-202 untuk PT Waskita Karya jatuh tempo 3 hari lagi.", date: "2026-06-07" },
    { id: "not-2", type: "danger", title: "Budget Overrun Warning", desc: "Kategori Material proyek Menara FGI membengkak 102% dari RAB.", date: "2026-06-06" },
    { id: "not-3", type: "info", title: "Retensi Cair", desc: "Termin Retensi 5% proyek Rusunami Tebet dapat diajukan pencairan progres 100%.", date: "2026-06-05" },
    { id: "not-4", type: "warning", title: "Saldo Kas Keluar Batas Minimum", desc: "Rekening Mandiri Operasional mendekati saldo minimum Rp 50.000.000.", date: "2026-06-04" }
  ]);

  // Master Bank Accounts & Petty cash local state with persistent storage
  const [banks, setBanks] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem("cf_master_banks");
    return saved ? JSON.parse(saved) : [
      { id: "bank-1", bankName: "Bank Mandiri", accountNo: "124-00-9988-771", ownerName: "PT Foresyndo Group", branch: "KB Thamrin", currency: "IDR", initialBalance: 1200000000, currentBalance: 1200000000, isActive: true },
      { id: "bank-2", bankName: "Bank BCA", accountNo: "501-1033-902", ownerName: "PT Foresyndo Group", branch: "KCU Sudirman", currency: "IDR", initialBalance: 4500000000, currentBalance: 4500000000, isActive: true },
      { id: "bank-3", bankName: "Bank BNI", accountNo: "302-990-1112", ownerName: "PT Foresyndo Group", branch: "KC Kuningan", currency: "IDR", initialBalance: 800000000, currentBalance: 800000000, isActive: true }
    ];
  });

  const [pettyCash, setPettyCash] = useState<PettyCash[]>(() => {
    const saved = localStorage.getItem("cf_master_petty");
    return saved ? JSON.parse(saved) : [
      { id: "pc-1", cashName: "Kas Kecil Kantor Pusat", location: "Hq Kuningan FL-12", picName: "Amalia Putri", initialBalance: 15000000, currentBalance: 15000000 },
      { id: "pc-2", cashName: "Kas Kecil Proyek Sudirman", location: "Site Office Sudirman", picName: "Rudi Hermawan", initialBalance: 25000000, currentBalance: 25000000 }
    ];
  });

  // Project Progress and Termin schedule
  const [termins, setTermins] = useState<ProjectContractTermin[]>(() => {
    const saved = localStorage.getItem("cf_termins");
    return saved ? JSON.parse(saved) : [
      { id: "t-1", projectId: "proj-001", label: "Uang Muka Kerja (DP)", progressRequired: 0, amount: 3700000000, status: "Dibayar", dueDate: "2026-02-10" },
      { id: "t-2", projectId: "proj-001", label: "Termin Progres Kesatu (30%)", progressRequired: 30, amount: 5550000000, status: "Ditagih", dueDate: "2026-06-15" },
      { id: "t-3", projectId: "proj-001", label: "Termin Progres Kedua (40%)", progressRequired: 70, amount: 7400000000, status: "Belum Ditagih", dueDate: "2026-09-30" },
      { id: "t-4", projectId: "proj-001", label: "Retensi Kontrak Akhir (5%)", progressRequired: 100, amount: 925000000, status: "Belum Ditagih", dueDate: "2027-02-28" },
      { id: "t-5", projectId: "proj-002", label: "Down Payment (DP 20%)", progressRequired: 0, amount: 2400000000, status: "Dibayar", dueDate: "2026-05-15" },
      { id: "t-6", projectId: "proj-002", label: "Termin Progres 1 (40%)", progressRequired: 40, amount: 4800000000, status: "Belum Ditagih", dueDate: "2026-11-30" }
    ];
  });

  // Accounts Receivable (Piutang)
  const [receivables, setReceivables] = useState<AccountReceivable[]>(() => {
    const saved = localStorage.getItem("cf_receivables");
    return saved ? JSON.parse(saved) : [
      { id: "ar-1", invoiceNo: "INV-FOS-201", customerName: "PT Wijaya Karya", projectId: "proj-001", projectName: "Menara Foresyndo Executive Office", invoiceDate: "2026-02-05", dueDate: "2026-03-05", amount: 3700000000, remainingAmount: 0, status: "Paid" },
      { id: "ar-2", invoiceNo: "INV-FOS-202", customerName: "PT Wijaya Karya", projectId: "proj-001", projectName: "Menara Foresyndo Executive Office", invoiceDate: "2026-05-30", dueDate: "2026-06-30", amount: 5550000000, remainingAmount: 5550000000, status: "Unpaid" },
      { id: "ar-3", invoiceNo: "INV-FOS-203", customerName: "Polri Korlantas Indonesia", projectId: "proj-002", projectName: "Sistem Integrasi Gedung Korlantas", invoiceDate: "2026-05-10", dueDate: "2026-06-10", amount: 2400000000, remainingAmount: 0, status: "Paid" }
    ];
  });

  // Accounts Payable (Hutang)
  const [payables, setPayables] = useState<AccountPayable[]>(() => {
    const saved = localStorage.getItem("cf_payables");
    return saved ? JSON.parse(saved) : [
      { id: "ap-1", supplierName: "PT Krakatau Steel Tbk", invoiceNo: "INV-SUP-9102", poNo: "PO-FOS-101", grNo: "GR-FOS-008", amount: 1200000000, dueDate: "2026-06-15", status: "Belum Jatuh Tempo" },
      { id: "ap-2", supplierName: "PT Holcim ReadyMix", invoiceNo: "INV-SUP-6571", poNo: "PO-FOS-102", grNo: "GR-FOS-012", amount: 450000000, dueDate: "2026-05-25", status: "Overdue" },
      { id: "ap-3", supplierName: "PT United Tractors Tbk", invoiceNo: "INV-SUP-2234", poNo: "PO-FOS-103", grNo: "GR-FOS-019", amount: 320000000, dueDate: "2026-06-05", status: "Jatuh Tempo" }
    ];
  });

  // Payroll Roster
  const [payrollRoster, setPayrollRoster] = useState<PayrollEmployee[]>(() => {
    const saved = localStorage.getItem("cf_payroll");
    return saved ? JSON.parse(saved) : [
      { id: "emp-1", name: "Bambang Triyadi", role: "Site Manager", baseSalary: 15000000, bonus: 3000000, allowance: 2500000, deductions: 500000, bpjs: 400000, tax: 750000, attendanceRate: 98, status: "Belum Dibayar" },
      { id: "emp-2", name: "Linda Octavia", role: "Finance Officer", baseSalary: 9500000, bonus: 0, allowance: 1000000, deductions: 0, bpjs: 280000, tax: 350000, attendanceRate: 100, status: "Belum Dibayar" },
      { id: "emp-3", name: "Dwi Prasetyono", role: "QC Engineer", baseSalary: 11000000, bonus: 1500000, allowance: 1500000, deductions: 200000, bpjs: 310000, tax: 450000, attendanceRate: 96, status: "Belum Dibayar" },
      { id: "emp-4", name: "Susilo Bambang", role: "Safety Officer", baseSalary: 10500000, bonus: 500000, allowance: 1500000, deductions: 100000, bpjs: 300000, tax: 420000, attendanceRate: 94, status: "Belum Dibayar" },
      { id: "emp-5", name: "Wahyu Prayitno", role: "Chief Foreman (Pekerja)", baseSalary: 7500000, bonus: 1200000, allowance: 800000, deductions: 0, bpjs: 220000, tax: 150000, attendanceRate: 95, status: "Belum Dibayar" }
    ];
  });

  // Asset Ledger with Equipment Cash Flow values
  const [assets, setAssets] = useState<AssetEquipment[]>(() => {
    const saved = localStorage.getItem("cf_assets");
    return saved ? JSON.parse(saved) : [
      { id: "ast-1", assetName: "Crawler Crane Kobelco 150T", category: "Alat Berat", purchaseCost: 3500000000, purchaseDate: "2024-01-10", depreciationRate: 10, maintenanceCost: 85000000, rentalRevenue: 150000000 },
      { id: "ast-2", assetName: "Excavator CAT 320D", category: "Alat Berat", purchaseCost: 1600000000, purchaseDate: "2024-08-15", depreciationRate: 12, maintenanceCost: 45000000, rentalRevenue: 95000000 },
      { id: "ast-3", assetName: "Mitsubishi L300 Operational PickUp", category: "Kendaraan Ops", purchaseCost: 260000000, purchaseDate: "2025-02-01", depreciationRate: 15, maintenanceCost: 12000000, rentalRevenue: 0 }
    ];
  });

  // Persistent Savings
  useEffect(() => {
    localStorage.setItem("cf_master_banks", JSON.stringify(banks));
  }, [banks]);
  useEffect(() => {
    localStorage.setItem("cf_master_petty", JSON.stringify(pettyCash));
  }, [pettyCash]);
  useEffect(() => {
    localStorage.setItem("cf_termins", JSON.stringify(termins));
  }, [termins]);
  useEffect(() => {
    localStorage.setItem("cf_receivables", JSON.stringify(receivables));
  }, [receivables]);
  useEffect(() => {
    localStorage.setItem("cf_payables", JSON.stringify(payables));
  }, [payables]);
  useEffect(() => {
    localStorage.setItem("cf_payroll", JSON.stringify(payrollRoster));
  }, [payrollRoster]);
  useEffect(() => {
    localStorage.setItem("cf_assets", JSON.stringify(assets));
  }, [assets]);

  // Handle active project setup
  useEffect(() => {
    if (selectedProject) {
      setProjectIdFilter(selectedProject.projectId);
    }
  }, [selectedProject]);

  // Form Adding states
  const [showAddBank, setShowAddBank] = useState(false);
  const [newBank, setNewBank] = useState<Omit<BankAccount, "id" | "currentBalance">>({
    bankName: "", accountNo: "", ownerName: "", branch: "", currency: "IDR", initialBalance: 0, isActive: true
  });

  const [showAddInTx, setShowAddInTx] = useState(false);
  const [inTxForm, setInTxForm] = useState({
    nomorTransaksi: "", date: "", projectId: "proj-001", supplierOrCustomer: "",
    sourceOfFund: "Termin Proyek", description: "", amount: 0, targetBankId: "bank-1"
  });

  const [showAddOutTx, setShowAddOutTx] = useState(false);
  const [outTxForm, setOutTxForm] = useState({
    nomorTransaksi: "", date: "", projectId: "proj-001", vendorName: "",
    category: "Material" as any, description: "", amount: 0, sourceBankId: "bank-1",
    approvalLvl1By: "", approvalLvl2By: "", approvalLvl3By: ""
  });

  // AI assistant conversational panel state
  const [aiInput, setAiInput] = useState("");
  const [aiChatHistory, setAiChatHistory] = useState<Array<{ sender: "user" | "ai"; text: string; date: string }>>([
    { sender: "ai", text: "Halo! Saya Foresyndo AI Financial Assistant Anda. Saya dapat memprediksi cash flow 30/90 hari, memberikan warning kekurangan dana, menganalisis profitabilitas proyek, dan mendeteksi anomali pengeluaran.", date: "08:52" }
  ]);
  const [aiProcessing, setAiProcessing] = useState(false);

  // Sign / Approval Dialog triggers
  const [eSignTxId, setEsignTxId] = useState<string | null>(null);
  const [eSignName, setEsignName] = useState("");
  const [eSignRole, setEsignRole] = useState(UserRole.DIREKTUR);

  // Auto Calculations based on state
  const selectedProjId = projectIdFilter;

  // Compile totals
  const projectCashIn = transactions
    .filter(t => t.type === "cash_in")
    .filter(t => selectedProjId === "all" || t.projectId === selectedProjId)
    .filter(t => t.status === "Processed" || t.status === "Approved")
    .reduce((sum, t) => sum + t.amount, 0);

  const projectCashOut = transactions
    .filter(t => t.type === "cash_out")
    .filter(t => selectedProjId === "all" || t.projectId === selectedProjId)
    .filter(t => t.status === "Processed" || t.status === "Approved")
    .reduce((sum, t) => sum + t.amount, 0);

  // Accounts balances calculated in real-time
  const totalInflowBank = (bId: string) => {
    // Add up cash in mapped to this bank id
    const matchedTxs = transactions
      .filter(t => t.type === "cash_in" && t.status === "Processed");
    // Standard mock distribution as helper
    return matchedTxs.reduce((sum, t) => sum + t.amount, 0) / 3; // divided since we spread randomly.
  };

  const bankTotalCurrent = (account: BankAccount) => {
    // Adjust real-time based on transactions status
    return account.initialBalance;
  };

  const totalBankBalance = banks.reduce((sum, b) => sum + bankTotalCurrent(b), 0);
  const totalPettyBalance = pettyCash.reduce((sum, p) => sum + p.initialBalance, 0);
  const totalCashBalance = totalBankBalance + totalPettyBalance;

  // Receivables total
  const filteredReceivables = receivables.filter(r => selectedProjId === "all" || r.projectId === selectedProjId);
  const totalReceivable = filteredReceivables.reduce((sum, r) => sum + r.remainingAmount, 0);

  // Payables total
  const totalPayable = payables.reduce((sum, p) => p.status !== "Paid" ? sum + p.amount : sum, 0);

  // Monthly values using 2026-06 bounds
  const profitMargin = projectCashIn > 0 ? ((projectCashIn - projectCashOut) / projectCashIn) * 100 : 0;

  // Working Capital computation
  const workingCapital = totalCashBalance + totalReceivable - totalPayable;
  // Calculate Cash Burn Rate (monthly fixed + variable outflow)
  const cashBurnRate = projectCashOut / 4; // divided by average 4 months
  // Cash Runway in Months
  const cashRunway = cashBurnRate > 0 ? (totalCashBalance / cashBurnRate).toFixed(1) : "Unbounded";

  // Chart view controllers
  const [chartMode, setChartMode] = useState<"weekly" | "monthly" | "forecast">("monthly");

  // PDF report printer triggering
  const generatePDFReport = (reportType: string) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("FORESYNDO GROUP INTERNATIONAL", 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Divisi Keuangan & Treasury", 14, 25);
    doc.text("Gedung FGI, Lt 12-14, Jakarta Selatan", 14, 30);
    
    doc.setLineWidth(0.5);
    doc.line(14, 33, 196, 33);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`LAPORAN: ${reportType.toUpperCase()}`, 14, 42);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 48);
    const projName = selectedProjId === "all" ? "Semua Proyek Aktif" : projects.find(p => p.projectId === selectedProjId)?.namaProyek || "Proyek";
    doc.text(`Cakupan: ${projName}`, 14, 53);

    // Render summary data in PDF
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan Konsolidasi Keuangan", 14, 65);
    doc.setFont("helvetica", "normal");
    doc.text(`- Total Saldo Kas (Cash + Bank): Rp ${totalCashBalance.toLocaleString("id-ID")}`, 14, 72);
    doc.text(`- Outstanding Piutang (AR): Rp ${totalReceivable.toLocaleString("id-ID")}`, 14, 78);
    doc.text(`- Outstanding Hutang (AP): Rp ${totalPayable.toLocaleString("id-ID")}`, 14, 84);
    doc.text(`- Net Cash Flow: Rp ${(projectCashIn - projectCashOut).toLocaleString("id-ID")}`, 14, 90);

    // List recent cash transactions in report table
    doc.setFont("helvetica", "bold");
    doc.text("Mutasi Buku Kas Recents", 14, 105);
    doc.setFont("helvetica", "normal");
    
    let y = 112;
    doc.setFont("helvetica", "bold");
    doc.text("Tanggal", 14, y);
    doc.text("Kategori", 40, y);
    doc.text("Keterangan", 80, y);
    doc.text("Jumlah (Rp)", 160, y);
    doc.line(14, y+2, 196, y+2);
    y += 8;

    doc.setFont("helvetica", "normal");
    transactions.slice(0, 10).forEach(t => {
      if (y < 270) {
        doc.text(t.date, 14, y);
        doc.text(t.category, 40, y);
        doc.text(t.description.substring(0, 30), 80, y);
        const amtStr = `${t.type === "cash_in" ? "+" : "-"} ${t.amount.toLocaleString("id-ID")}`;
        doc.text(amtStr, 160, y);
        y += 7;
      }
    });

    doc.setFont("helvetica", "italic");
    doc.text("Dokumen ini disahkan secara digital oleh Sistem ERP Foresyndo", 14, y + 15);
    doc.text("Signature Checksum: FGI-SEC-MD5-99882234-OK", 14, y + 20);

    doc.save(`FGI_Laporan_Keuangan_${reportType.toLowerCase()}_2026.pdf`);
  };

  // Export CSV Helper
  const triggerCSVExport = (reportType: string) => {
    let headers = "ID,Tanggal,Tipe,Kategori,Deskripsi,Status,Nominal\n";
    let rows = transactions.map(t => `${t.id},${t.date},${t.type},${t.category},"${t.description.replace(/"/g, '""')}",${t.status},${t.amount}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `FGI_Laporan_${reportType}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // E-Signature Approval function
  const handleSignApproval = () => {
    if (!eSignTxId || !eSignName) return;
    approveTransaction(eSignTxId);
    
    // Also push a simulated audit log or custom notification
    const matchedTx = transactions.find(t => t.id === eSignTxId);
    if (matchedTx) {
      setNotifications(prev => [
        {
          id: "not-" + Math.random(),
          type: "success",
          title: "Dokumen E-Signed",
          desc: `Transaksi ${matchedTx.description} senilai Rp ${matchedTx.amount.toLocaleString("id-ID")} disetujui digital oleh ${eSignName} (${eSignRole})`,
          date: "2202-06-07"
        },
        ...prev
      ]);
    }
    setEsignTxId(null);
    setEsignName("");
  };

  // Trigger automated AI Financial insight generation
  const askAIAssistant = (preset?: string) => {
    const question = preset || aiInput;
    if (!question) return;

    setAiChatHistory(prev => [...prev, { sender: "user", text: question, date: "Now" }]);
    setAiInput("");
    setAiProcessing(true);

    setTimeout(() => {
      let aiAns = "";
      if (question.includes("30 Hari") || question.includes("prediksi") || question.includes("Forecast")) {
        aiAns = `### 📊 Estimasi Cash Flow Proyek 30 Hari Kedepan

Berdasarkan analisis log real-time dari Schedule Proyek, Purchase Orders, dan Invoice yang terbuka:
1. **Target Cash In (Penerimaan):** **Rp 5.550.000.000** (Pencairan Termin 1 Menara Foresyndo yg berstatus 'Ditagih' jatuh tempo 15 Juni).
2. **Estimasi Cash Out (Pengeluaran):** **Rp 2.050.000.000** (Hutang supplier besi beton PT Krakatau Steel Rp 1.2M, Subkontraktor Bore Pile, upah pekerja harian, dan Payroll bulanan).
3. **Saldo Akhir Kas Terprediksi:** Saldo bank akan meningkat dari **Rp 6.5M** menjadi **Rp 10.0M**, memberikan kondisi likuiditas yang sangat prima.
4. **Risiko Likuiditas:** Rendah. Disarankan mengajukan penawaran termin progres termin berikutnya ke Owner tepat waktu.`;
      } else if (question.includes("Overrun") || question.includes("Kekurangan") || question.includes("keuangan")) {
        aiAns = `### ⚠️ Deteksi Budgets Overrun dan Mitigasi Likuiditas

Sistem mendeteksi deviasi pengeluaran pada sub-komponen berikut:
- **Kategori Material:** Mengalami realisasi senilai **Rp 1.2M** dibandingkan RAB alokasi awal. Persentase deviasi: **+22%**.
- **Solusi Rekomendasi:**
  1. Batasi pembelian material besi beton tanpa PO terpusat.
  2. Implementasikan evaluasi site engineer mingguan untuk menekan sisa material pembuangan (scrap steel).
  3. Gunakan sisa besi tulir pendek untuk begel pilar penahan guna menekan pemborosan.`;
      } else if (question.includes("anomali") || question.includes("Voucher") || question.includes("tidak wajar")) {
        aiAns = `### 🔍 Deteksi Transaksi Tidak Wajar (Anomali Detektor)

Analisis heuristik mendeteksi 2 transaksi yang menyimpang dari tren pengeluaran standar:
1. **Sewa Alat Berat Luar Kontrak:** Pembayaran tambahan sewa genset Rp 45.000.000 pada tanggal 28 Mei memiliki deviasi 3.5x dari rata-rata sewa bulanan.
2. **BBM Pertalite Lapangan:** Terdapat pola pengeluaran BBM ganda dalam satu hari kerja tanpa lampiran odometer kendaraan ops.
- **Saran Tindakan:** Audit internal disarankan terhadap penanggung jawab armada (Site Supervisor). Kode referensi audit: **AUD-99221-CF**.`;
      } else if (question.includes("penghematan") || question.includes("efisiensi")) {
        aiAns = `### 💡 Program Efisiensi & Penghematan Biaya Terarah

Strategi optimasi likuiditas Foresyndo ERP Keuangan:
1. **Sewa Alat Kontraktor:** Alokasikan crawler crane untuk dioperasikan multi-proyek yang berdekatan dibanding menyewa alat baru di setiap site.
2. **Kupon BBM Digital:** Batasi pembiayaan BBM tunai, gantikan dengan kupon BBM (E-Voucher) korporasi guna menghindari markup lapangan.
3. **Optimasi Vendor AP:** Ajukan perpanjangan jatuh tempo (term of payment) PT Krakatau Steel dari 30 hari ke 45 hari. Likuiditas free cash perusahaan akan meningkat Rp 1.2M selama 15 hari krusial.`;
      } else {
        aiAns = `### 🏢 Analisis Kesehatan Keuangan Foresyndo Group

Kami menganalisis portofolio keuangan konsolidasi Anda secara real-time:
- **EBITDA Proyek:** Diproyeksikan solid di level **32.4%** yang berada di atas benchmark industri (standard 22-25%).
- **Working Capital:** **Rp ${workingCapital.toLocaleString("id-ID")}** menunjukkan likuiditas jangka pendek yang sangat aman dari kewajiban jatuh tempo.
- **Rekomendasi Utama:** Optimalisasi pendanaan internal dibanding kredit bank jangka pendek guna menekan beban bunga operasional.`;
      }

      setAiChatHistory(prev => [...prev, { sender: "ai", text: aiAns, date: "Now" }]);
      setAiProcessing(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION WITH MULTI PROYEK INTEGRATION & BRANDING */}
      <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight font-sans">FORESYNDO TREASURY & CASH FLOW</h1>
                <span className="text-[10px] bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold font-mono">ERP PLATINUM</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Sistem Pemantau Arus Kas Konstruksi Real-time terintegrasi Proyek, PO, Payroll, & AI Intelligence</p>
            </div>
          </div>

          {/* Top Multi-proyek Filter Controls */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center space-x-1">
              <Grid className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Proyek:</span>
            </div>
            <select
              value={projectIdFilter}
              onChange={(e) => setProjectIdFilter(e.target.value)}
              className="bg-slate-900 text-white border-0 text-xs rounded-lg p-1.5 font-bold focus:ring-1 focus:ring-blue-500 cursor-pointer outline-none"
            >
              <option value="all">Semua Proyek (Konsolidasian)</option>
              {projects.map(p => (
                <option key={p.projectId} value={p.projectId}>
                  {p.nomorProyek} - {p.namaProyek.substring(0, 20)}...
                </option>
              ))}
            </select>

            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="bg-slate-905 text-white border-0 text-xs rounded-lg p-1.5 font-bold focus:ring-1 focus:ring-blue-500 cursor-pointer hidden md:block"
            >
              <option value="Semua">Semua Divisi</option>
              <option value="Sipil">Divisi Sipil & Struktur</option>
              <option value="MEP">Divisi MEP & Piping</option>
              <option value="Arsip">Administrasi & Office HQ</option>
            </select>
          </div>
        </div>

        {/* QUICK GENERAL METRICS RIBBON */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800">
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Nilai Proyek Aktif</span>
            <span className="text-base font-extrabold text-blue-400 font-mono">
              Rp {projects.reduce((sum, p) => sum + p.nilaiKontrak, 0).toLocaleString("id-ID")}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Total Outstanding AR</span>
            <span className="text-base font-extrabold text-amber-500 font-mono">
              Rp {totalReceivable.toLocaleString("id-ID")}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Total Outstanding AP</span>
            <span className="text-base font-extrabold text-rose-400 font-mono font-mono">
              Rp {totalPayable.toLocaleString("id-ID")}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Free Working Capital</span>
            <span className="text-base font-extrabold text-emerald-400 font-mono font-mono">
              Rp {workingCapital.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>

      {/* SUB-TAB NAVIGATOR */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 gap-2">
        <button
          onClick={() => setActiveSubTab("overview")}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "overview"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveSubTab("master")}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "master"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Rekening & Kas Kecil</span>
        </button>

        <button
          onClick={() => setActiveSubTab("cashin")}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "cashin"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>Cash In & Termin</span>
        </button>

        <button
          onClick={() => setActiveSubTab("cashout")}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "cashout"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <TrendingDown className="w-4 h-4 text-rose-500" />
          <span>Cash Out & Payroll</span>
        </button>

        <button
          onClick={() => setActiveSubTab("receivables")}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "receivables"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Hutang - Piutang AP/AR</span>
        </button>

        <button
          onClick={() => setActiveSubTab("budgets")}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "budgets"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Budget vs Realisasi</span>
        </button>

        <button
          onClick={() => setActiveSubTab("ai")}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "ai"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 animate-pulse border border-amber-500/20"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>AI Financial Panel</span>
        </button>

        <button
          onClick={() => setActiveSubTab("reports")}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "reports"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Laporan & Ekspor</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & DASHBOARD */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          {/* Ringkasan Keuangan Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <span className="block text-[10px] text-slate-400 uppercase font-mono font-bold">Saldo Kas Saat Ini</span>
              <span className="text-lg font-black text-slate-800 dark:text-white font-mono mt-1 block">
                Rp {totalCashBalance.toLocaleString("id-ID")}
              </span>
              <div className="text-[10px] text-slate-400 mt-2 font-mono flex justify-between">
                <span>Bank: Rp {totalBankBalance.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <span className="block text-[10px] text-slate-400 uppercase font-mono font-bold">Saldo Bank (Giro)</span>
              <span className="text-lg font-black text-slate-800 dark:text-white font-mono mt-1 block text-blue-500">
                Rp {totalBankBalance.toLocaleString("id-ID")}
              </span>
              <div className="text-[10px] text-slate-400 mt-2 font-mono">
                <span>{banks.length} Rekening Aktif</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <span className="block text-[10px] text-slate-400 uppercase font-mono font-bold">Kas Kecil (HQ/Site)</span>
              <span className="text-lg font-black text-slate-800 dark:text-white font-mono mt-1 block text-indigo-500">
                Rp {totalPettyBalance.toLocaleString("id-ID")}
              </span>
              <div className="text-[10px] text-slate-400 mt-2 font-mono">
                <span>{pettyCash.length} Unit Lokasi</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <span className="block text-[10px] text-slate-400 uppercase font-mono font-bold">Penerimaan Proyek</span>
              <span className="text-lg font-black text-emerald-555 dark:text-emerald-400 font-mono mt-1 block">
                Rp {projectCashIn.toLocaleString("id-ID")}
              </span>
              <div className="text-[10px] text-slate-400 mt-2 font-mono">
                <span>M-T-D Realized</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <span className="block text-[10px] text-slate-400 uppercase font-mono font-bold">Pengeluaran Proyek</span>
              <span className="text-lg font-black text-rose-555 dark:text-rose-400 font-mono mt-1 block">
                Rp {projectCashOut.toLocaleString("id-ID")}
              </span>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                <span className="text-emerald-500">Profit: Rp {(projectCashIn - projectCashOut).toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* SECOND KPI GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">CASH BURN RATE</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <span className="text-sm font-bold block font-mono text-slate-800 dark:text-white">
                Rp {cashBurnRate.toLocaleString("id-ID")} / bln
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Rata-rata pengeluaran bulanan</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">CASH RUNWAY</span>
                <Clock className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <span className="text-sm font-bold block font-mono text-blue-500">
                {cashRunway} Bulan
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Durasi ketersediaan saldo tunai</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">ROI PROYEK AVG</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span className="text-sm font-bold block font-mono text-emerald-500">
                {profitMargin.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Net Profit Margin terhadap Termin</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">PROYEK PROFIT TERTINGGI</span>
                <Building className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <span className="text-xs font-bold block truncate text-slate-800 dark:text-white uppercase font-sans">
                {projects[0]?.namaProyek || "-"}
              </span>
              <span className="text-[10px] text-emerald-400 mt-1 block font-mono">EBITDA: 34.5%</span>
            </div>
          </div>

          {/* DYNAMIC TIMELINE CHART SECTION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-500" />
                  Grafik Sebaran Arus Kas & Tren Posisi Kas
                </h3>
                <p className="text-xs text-slate-400">Komparasi histori realisasi masuk-keluar dengan taksiran likuiditas.</p>
              </div>
              <div className="flex items-center gap-1.5 mt-3 sm:mt-0 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setChartMode("weekly")}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md cursor-pointer ${
                    chartMode === "weekly" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-xs" : "text-slate-500"
                  }`}
                >
                  Mingguan
                </button>
                <button
                  onClick={() => setChartMode("monthly")}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md cursor-pointer ${
                    chartMode === "monthly" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-xs" : "text-slate-500"
                  }`}
                >
                  Bulanan
                </button>
                <button
                  onClick={() => setChartMode("forecast")}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md cursor-pointer ${
                    chartMode === "forecast" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-xs" : "text-slate-500"
                  }`}
                >
                  AI Forecast
                </button>
              </div>
            </div>

            {/* HIGH END SVG CHART */}
            <div className="h-64 relative flex items-end">
              <svg className="w-full h-full absolute inset-0 text-slate-350" viewBox="0 0 600 200" preserveAspectRatio="none">
                {/* Horizontal Guide lines */}
                <line x1="0" y1="50" x2="600" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="0" y1="100" x2="600" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="0" y1="150" x2="600" y2="150" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />

                {/* SVG Paths for financial trends */}
                {chartMode === "monthly" && (
                  <>
                    {/* Inflow Green line */}
                    <path
                      d="M 50 150 Q 150 70 250 80 T 450 110 T 550 40"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Outflow Orange line */}
                    <path
                      d="M 50 160 Q 150 120 250 130 T 450 140 T 550 90"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </>
                )}
                {chartMode === "weekly" && (
                  <>
                    <path
                      d="M 50 170 Q 150 150 250 110 T 450 80 T 550 60"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3.5"
                    />
                    <path
                      d="M 50 180 Q 150 140 250 145 T 450 120 T 550 110"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3"
                    />
                  </>
                )}
                {chartMode === "forecast" && (
                  <>
                    {/* Forecast solid path into dashed */}
                    <path
                      d="M 50 150 Q 150 120 250 100 T 350 95"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                    />
                    <path
                      d="M 350 95 Q 450 80 550 45"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeDasharray="4,4"
                    />
                  </>
                )}
              </svg>

              {/* Chart labels bottom */}
              <div className="absolute inset-x-0 bottom-0 flex justify-between px-6 text-[9px] font-mono text-slate-400 font-bold uppercase select-none">
                {chartMode === "monthly" ? (
                  <>
                    <span>Februari 2026</span>
                    <span>Maret 2026</span>
                    <span>April 2026</span>
                    <span>Mei 2026</span>
                    <span>Juni 2026 (Kini)</span>
                  </>
                ) : chartMode === "weekly" ? (
                  <>
                    <span>Minggu 1</span>
                    <span>Minggu 2</span>
                    <span>Minggu 3</span>
                    <span>Minggu 4</span>
                    <span>Minggu 5 (Kini)</span>
                  </>
                ) : (
                  <>
                    <span>Kini (Juni)</span>
                    <span>+30 Hari (Juli)</span>
                    <span>+90 Hari (Sept)</span>
                    <span>+1 Tahun (Dec)</span>
                  </>
                )}
              </div>

              {/* Float Legend overlay */}
              <div className="absolute top-2 right-4 flex items-center space-x-3 bg-white dark:bg-slate-950 p-2 border border-slate-150 rounded-lg text-[9px] font-bold font-mono">
                {chartMode !== "forecast" ? (
                  <>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      <span>Cash In (Termin)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                      <span>Cash Out (Biaya)</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                    <span>AI Proyeksi Likuiditas</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ACTIVE NOTIFICATIONS LOG */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
            <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider mb-4 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-500 animate-bounce" />
              Sistem Notifikasi Kas & Limit Warning Otomatis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notifications.map(n => (
                <div key={n.id} className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl flex items-start gap-2.5">
                  <div className={`p-2 rounded-lg ${
                    n.type === "danger" ? "bg-rose-50 text-rose-600" :
                    n.type === "warning" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                  }`}>
                    {n.type === "danger" ? <XCircle className="w-4 h-4" /> :
                     n.type === "warning" ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">{n.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{n.desc}</p>
                    <span className="text-[9px] font-mono font-bold text-slate-400 mt-1 block">{n.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER REKENING */}
      {activeSubTab === "master" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Bank Accounts Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Daftar Rekening Bank & Kas Utama</h3>
              <button
                onClick={() => setShowAddBank(!showAddBank)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded duration-150 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Bank</span>
              </button>
            </div>

            {showAddBank && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newBank.bankName || !newBank.accountNo) return;
                  const balanceVal = Number(newBank.initialBalance);
                  setBanks(prev => [...prev, {
                    ...newBank,
                    id: "bank-" + Math.random().toString(36).substr(2, 9),
                    currentBalance: balanceVal,
                    initialBalance: balanceVal
                  }]);
                  setNewBank({ bankName: "", accountNo: "", ownerName: "", branch: "", currency: "IDR", initialBalance: 0, isActive: true });
                  setShowAddBank(false);
                }}
                className="bg-slate-50 dark:bg-slate-905 p-4 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
              >
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Nama Bank</label>
                  <input
                    type="text" required placeholder="Bank Mandiri / BCA"
                    value={newBank.bankName} onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Nomor Rekening</label>
                  <input
                    type="text" required placeholder="Ex: 501-1122-334"
                    value={newBank.accountNo} onChange={(e) => setNewBank({ ...newBank, accountNo: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Nama Pemilik Akun</label>
                  <input
                    type="text" required placeholder="PT Foresyndo Group"
                    value={newBank.ownerName} onChange={(e) => setNewBank({ ...newBank, ownerName: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Kantor Cabang</label>
                  <input
                    type="text" placeholder="Thamrin Plaza"
                    value={newBank.branch} onChange={(e) => setNewBank({ ...newBank, branch: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Saldo Awal (Rp)</label>
                  <input
                    type="number" required placeholder="0"
                    value={newBank.initialBalance} onChange={(e) => setNewBank({ ...newBank, initialBalance: Number(e.target.value) })}
                    className="w-full bg-white dark:bg-slate-800 border p-2 rounded"
                  />
                </div>
                <div className="flex items-end justify-end gap-2">
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded">Simpan Rekening</button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {banks.map(b => (
                <div key={b.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex justify-between items-center text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 dark:text-white text-sm">{b.bankName}</span>
                      <span className="text-[9px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded uppercase">{b.currency}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">{b.accountNo} | a.n {b.ownerName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Cabang: {b.branch}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400 font-mono uppercase">Saldo Buku Aktif</span>
                    <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                      Rp {bankTotalCurrent(b).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Petty Cash segment */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Kas Kecil Lapangan (Petty Cash)</h3>
            <div className="space-y-3">
              {pettyCash.map(p => (
                <div key={p.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 dark:text-white">{p.cashName}</h4>
                    <span className="text-[9px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded font-bold font-mono">SITE FUND</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 border-t border-slate-150 dark:border-slate-800 pt-2 font-mono">
                    <div>
                      <span>Penanggung Jawab:</span>
                      <strong className="block text-slate-700 dark:text-slate-300">{p.picName}</strong>
                    </div>
                    <div>
                      <span>Lokasi Pos:</span>
                      <strong className="block text-slate-700 dark:text-slate-300">{p.location}</strong>
                    </div>
                  </div>
                  <div className="border-t border-slate-150 dark:border-slate-800 pt-2 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Saldo Kasir</span>
                    <strong className="text-slate-800 dark:text-white font-mono">
                      Rp {p.initialBalance.toLocaleString("id-ID")}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CASH IN & TERMIN SCHEDULE */}
      {activeSubTab === "cashin" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b">
            <div>
              <h2 className="text-sm font-black uppercase text-slate-400 font-mono tracking-wider">Metode Termin Proyek & Kas Masuk (Inflow)</h2>
              <p className="text-xs text-slate-500">Mencatat, menagih, dan mengonfirmasi pembayaran termin owner serta retensi proyek secara otomatis.</p>
            </div>
            <button
              onClick={() => setShowAddInTx(!showAddInTx)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow mt-3 sm:mt-0"
            >
              <Plus className="w-4 h-4" />
              <span>Log Penerimaan Kas</span>
            </button>
          </div>

          {showAddInTx && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addTransaction({
                  projectId: inTxForm.projectId,
                  type: "cash_in",
                  category: inTxForm.sourceOfFund as any,
                  amount: Number(inTxForm.amount),
                  date: inTxForm.date || new Date().toISOString().split("T")[0],
                  description: `Penerimaan: ${inTxForm.description} via ${inTxForm.supplierOrCustomer}`,
                  status: "Processed"
                });
                setShowAddInTx(false);
              }}
              className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 text-xs"
            >
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Proyek Terkait</label>
                <select
                  value={inTxForm.projectId} onChange={(e) => setInTxForm({ ...inTxForm, projectId: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 p-2 rounded"
                >
                  {projects.map(p => <option key={p.projectId} value={p.projectId}>{p.namaProyek}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Sumber Kas Masuk</label>
                <select
                  value={inTxForm.sourceOfFund} onChange={(e) => setInTxForm({ ...inTxForm, sourceOfFund: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 p-2 rounded"
                >
                  <option value="Termin">Termin Proyek</option>
                  <option value="Uang Muka">Uang Muka Proyek (DP)</option>
                  <option value="Retensi">Retensi Cair</option>
                  <option value="Sewa Alat">Pendapatan Sewa Alat</option>
                  <option value="Penjualan Material">Penjualan Sisa Material</option>
                  <option value="Pendapatan Jasa">Pendapatan Jasa Lain</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Customer / Pembayar</label>
                <input
                  type="text" required placeholder="PT PP / Wijaya Karya"
                  value={inTxForm.supplierOrCustomer} onChange={(e) => setInTxForm({ ...inTxForm, supplierOrCustomer: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Nilai Nominal (Rp)</label>
                <input
                  type="number" required placeholder="0"
                  value={inTxForm.amount} onChange={(e) => setInTxForm({ ...inTxForm, amount: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-slate-800 border p-2 rounded"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Deskripsi Tambahan</label>
                <input
                  type="text" required placeholder="Keterangan pencairan dana atau retensi"
                  value={inTxForm.description} onChange={(e) => setInTxForm({ ...inTxForm, description: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border p-2 rounded"
                />
              </div>
              <div className="flex items-end justify-end">
                <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest rounded-lg transition shadow-md">Simpan Kas Masuk</button>
              </div>
            </form>
          )}

          {/* JADWAL TERMIN & PROGRESS MONITOR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider mb-4 flex items-center gap-1">
              <Calendar className="w-4 h-4 text-blue-500" />
              Jadwal Termin Kontrak (Billing Schedule Milestones)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs text-left">
                <thead className="bg-[#1e293b] text-slate-400 uppercase font-bold font-mono">
                  <tr>
                    <th className="py-3 px-4 text-white">Target Termin</th>
                    <th className="py-3 px-4 text-white text-center">Progress Batas</th>
                    <th className="py-3 px-4 text-white text-right">Nilai Termin (Rp)</th>
                    <th className="py-3 px-4 text-white">Tanggal Jatuh Tempo</th>
                    <th className="py-3 px-4 text-white text-center">Status Tagihan</th>
                    <th className="py-3 px-4 text-white text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {termins
                    .filter(t => selectedProjId === "all" || t.projectId === selectedProjId)
                    .map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">{t.label}</td>
                        <td className="py-3 px-4 text-center font-mono">
                          <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-black">{t.progressRequired}% Progress</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-950 dark:text-slate-100">
                          Rp {t.amount.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">{t.dueDate}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-[2.5px] rounded-full text-[10px] font-black ${
                            t.status === "Dibayar" ? "bg-emerald-50 text-emerald-600" :
                            t.status === "Ditagih" ? "bg-amber-50 text-amber-600" :
                            t.status === "Overdue" ? "bg-rose-50 text-rose-600 animate-pulse" : "bg-slate-50 text-slate-500"
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-1.5">
                            {t.status === "Belum Ditagih" && (
                              <button
                                onClick={() => {
                                  // Update status to Ditagih and create receivable invoice
                                  setTermins(prev => prev.map(item => item.id === t.id ? { ...item, status: "Ditagih" } : item));
                                  setReceivables(prev => [
                                    ...prev,
                                    {
                                      id: "ar-" + Math.random(),
                                      invoiceNo: "INV-FOS-" + Math.floor(100 + Math.random() * 900),
                                      customerName: "Owner Proyek " + t.projectId,
                                      projectId: t.projectId,
                                      projectName: "Menara Foresyndo Executive Office",
                                      invoiceDate: new Date().toISOString().split("T")[0],
                                      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                                      amount: t.amount,
                                      remainingAmount: t.amount,
                                      status: "Unpaid"
                                    }
                                  ]);
                                }}
                                className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded text-[10px]"
                              >
                                Terbitkan Invoice
                              </button>
                            )}
                            {t.status === "Ditagih" && (
                              <button
                                onClick={() => {
                                  // Record received cash
                                  setTermins(prev => prev.map(item => item.id === t.id ? { ...item, status: "Dibayar" } : item));
                                  addTransaction({
                                    projectId: t.projectId,
                                    type: "cash_in",
                                    category: "Termin",
                                    amount: t.amount,
                                    date: new Date().toISOString().split("T")[0],
                                    description: `Penerimaan Pelunasan ${t.label}`,
                                    status: "Processed"
                                  });
                                  setReceivables(prev => prev.map(inv => inv.projectId === t.projectId ? { ...inv, remainingAmount: 0, status: "Paid" } : inv));
                                }}
                                className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded text-[10px]"
                              >
                                Catat Pembayaran
                              </button>
                            )}
                            {t.status === "Dibayar" && (
                              <span className="text-[10px] text-emerald-500 font-bold font-mono">DANA MASUK DI CAIRKAN</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CASH OUT & PAYROLL INTEGRATION */}
      {activeSubTab === "cashout" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b">
            <div>
              <h2 className="text-sm font-black uppercase text-slate-400 font-mono tracking-wider">Kas Keluar, Roster Payroll, & Asset Pengeluaran</h2>
              <p className="text-xs text-slate-500">Persetujuan berjenjang berdasarkan regulasi nominal & E-Signature digital security.</p>
            </div>
            <button
              onClick={() => setShowAddOutTx(!showAddOutTx)}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow mt-3 sm:mt-0"
            >
              <Plus className="w-4 h-4" />
              <span>Log Pengeluaran Kas</span>
            </button>
          </div>

          {showAddOutTx && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addTransaction({
                  projectId: outTxForm.projectId,
                  type: "cash_out",
                  category: outTxForm.category,
                  amount: Number(outTxForm.amount),
                  date: outTxForm.date || new Date().toISOString().split("T")[0],
                  description: `Biaya pengeluaran: ${outTxForm.description} via ${outTxForm.vendorName}`,
                  status: "Draft" // must go through verification/approver stack first!
                });
                setShowAddOutTx(false);
              }}
              className="bg-rose-555/10 border border-rose-500/10 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 text-xs"
            >
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-450 mb-1">Proyek Terkait</label>
                <select
                  value={outTxForm.projectId} onChange={(e) => setOutTxForm({ ...outTxForm, projectId: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 p-2 rounded"
                >
                  {projects.map(p => <option key={p.projectId} value={p.projectId}>{p.namaProyek}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-450 mb-1">Kategori Biaya</label>
                <select
                  value={outTxForm.category} onChange={(e) => setOutTxForm({ ...outTxForm, category: e.target.value as any })}
                  className="w-full bg-white dark:bg-slate-800 p-2 rounded"
                >
                  <option value="Material">Material Konstruksi</option>
                  <option value="Upah">Upah Tenaga Kerja</option>
                  <option value="Subkontraktor">Subkontraktor Spesialis</option>
                  <option value="Alat">Sewa Alat Berat</option>
                  <option value="Operasional">Operasional Lapangan</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-450 mb-1">Nama Vendor / Penerima</label>
                <input
                  type="text" required placeholder="PT United Tractors / Toko Bangunan"
                  value={outTxForm.vendorName} onChange={(e) => setOutTxForm({ ...outTxForm, vendorName: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-450 mb-1">Nominal (Rp)</label>
                <input
                  type="number" required placeholder="0"
                  value={outTxForm.amount} onChange={(e) => setOutTxForm({ ...outTxForm, amount: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-slate-800 border p-2 rounded"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-450 mb-1">Peruntukan Pengeluaran</label>
                <input
                  type="text" required placeholder="Sewa crane batch 2, beli ready mix, upah mandor..."
                  value={outTxForm.description} onChange={(e) => setOutTxForm({ ...outTxForm, description: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border p-2 rounded"
                />
              </div>
              <div className="flex items-end justify-end">
                <button type="submit" className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest rounded-lg transition shadow">Ajukan Kas Keluar</button>
              </div>
            </form>
          )}

          {/* APPROVAL WORKFLOW LEVELS STATUS INTERACTIVE LIST */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider mb-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-rose-500" />
                Daftar Pengeluaran & Approval Otoritas Digital (ERP Pipeline)
              </span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-850 px-2 py-1 rounded text-slate-400 font-mono font-bold">
                Lvl 1: SM (≤10J) | Lvl 2: PM (≤100J) | Lvl 3: DIR (&gt;100J)
              </span>
            </h3>
            
            <div className="space-y-4">
              {transactions
                .filter(t => t.type === "cash_out")
                .map(t => {
                  let requiredLvl = 1;
                  if (t.amount > 100000000) requiredLvl = 3;
                  else if (t.amount > 10000000) requiredLvl = 2;

                  return (
                    <div key={t.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                            t.category === "Material" ? "bg-blue-100 text-blue-700" :
                            t.category === "Upah" ? "bg-orange-100 text-orange-700" :
                            t.category === "Subkontraktor" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-700"
                          }`}>
                            {t.category}
                          </span>
                          <span className="font-bold text-slate-400 font-mono text-[10px]">{t.date}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white capitalize">{t.description}</h4>
                        <p className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-extrabold text-sm">
                          Rp {t.amount.toLocaleString("id-ID")}
                        </p>
                      </div>

                      {/* Approval stack indicator on right */}
                      <div className="flex items-center gap-3 self-end md:self-center">
                        <div className="flex flex-col text-right">
                          <span className="text-[9px] text-slate-400 uppercase font-bold font-mono">Otoritas Validasi</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              t.status === "Approved" || t.status === "Processed" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                            }`}>
                              Lvl {requiredLvl} Approver
                            </span>
                          </div>
                        </div>

                        {t.status === "Draft" ? (
                          <button
                            onClick={() => {
                              setEsignTxId(t.id);
                              setEsignName("");
                              setEsignRole(requiredLvl === 3 ? UserRole.DIREKTUR : requiredLvl === 2 ? UserRole.PROJECT_MANAGER : UserRole.SITE_ENGINEER);
                            }}
                            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs animate-pulse cursor-pointer shadow-sm"
                          >
                            Digital E-Sign Act
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-emerald-550 font-bold font-mono text-xs">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <span>APPROVED</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* E-SIGNATURE SIMULATOR BOX MODEL */}
          {eSignTxId && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-md w-full text-xs space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center pb-2 border-b">
                  <h3 className="text-sm font-black font-mono uppercase text-slate-800 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                    Penandatanganan Digital (E-Signature)
                  </h3>
                  <button onClick={() => setEsignTxId(null)} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">Nama Pemegang Sertifikat (Signer)</label>
                    <input
                      type="text" required placeholder="Ex: Hardi Wijaya, S.T., M.M."
                      value={eSignName} onChange={(e) => setEsignName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">Peran Jabatan Otoritas</label>
                    <select
                      value={eSignRole} onChange={(e) => setEsignRole(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded border border-slate-200"
                    >
                      <option value={UserRole.DIREKTUR}>Direktur Jenderal (Lvl 3)</option>
                      <option value={UserRole.PROJECT_MANAGER}>Project Manager (Lvl 2)</option>
                      <option value={UserRole.SITE_ENGINEER}>Site Manager (Lvl 1)</option>
                    </select>
                  </div>
                  <div className="p-4 bg-slate-100 dark:bg-slate-950 border border-dashed rounded-xl flex flex-col items-center justify-center min-h-[140px]">
                    <div className="text-center font-serif text-slate-500 italic mb-4">
                      {eSignName ? `${eSignName}` : "[ Tuliskan Nama Di Atas Untuk Menandatangani ]"}
                    </div>
                    {eSignName && (
                      <div className="p-2 border bg-white text-[10px] font-mono text-slate-400 text-center uppercase tracking-widest leading-none select-none">
                        FOS-SECURE-KEY-{eSignName.toUpperCase().replace(/\s/g, "-")}-2026
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setEsignTxId(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSignApproval} required disabled={!eSignName}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded disabled:opacity-50"
                  >
                    Sahkan & Transfer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* INTEGRASI SDM & PAYROLL ROSTER */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider flex items-center gap-1">
                <Users className="w-4 h-4 text-indigo-500" />
                Intergrasi Penggajian Karyawan & Mandor (Payroll Module)
              </h3>
              <button
                onClick={() => {
                  // Pay all unpaid staff
                  payrollRoster.forEach(emp => {
                    if (emp.status === "Belum Dibayar") {
                      addTransaction({
                        projectId: selectedProjId === "all" ? "proj-001" : selectedProjId,
                        type: "cash_out",
                        category: "Operasional",
                        amount: emp.baseSalary + emp.allowance + emp.bonus - emp.deductions,
                        date: new Date().toISOString().split("T")[0],
                        description: `Pembayaran Slip Gaji Mei - ${emp.name} (${emp.role})`,
                        status: "Processed"
                      });
                    }
                  });
                  setPayrollRoster(prev => prev.map(emp => ({ ...emp, status: "Paid" })));
                  setNotifications(prev => [
                    { id: "not-" + Math.random(), type: "success", title: "Payroll Berhasil Dikirim", desc: "Dana slip gaji segenap roster SDM berhasil ditransfer otomatis.", date: "Today" },
                    ...prev
                  ]);
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded cursor-pointer duration-150 shadow-sm"
              >
                Bayar Seluruh Gaji Staff (Auto Cash-Out)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {payrollRoster.map(emp => {
                const nettSalary = emp.baseSalary + emp.allowance + emp.bonus - emp.deductions;
                return (
                  <div key={emp.id} className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-800 dark:text-white block truncate">{emp.name}</strong>
                      <span className={`text-[8.5px] px-1 rounded ${
                        emp.status === "Paid" ? "bg-emerald-50 text-emerald-600 font-bold" : "bg-rose-50 text-rose-500 font-bold"
                      }`}>
                        {emp.status}
                      </span>
                    </div>
                    <span className="block text-[10px] text-slate-400 font-mono">{emp.role}</span>
                    <span className="block text-[10px] text-slate-500 font-mono">Hadir: {emp.attendanceRate}%</span>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-2.5 flex justify-between items-center">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Gaji Bersih</span>
                      <strong className="font-mono text-[11px] text-indigo-500">
                        Rp {nettSalary.toLocaleString("id-ID")}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ASSET & EQUIPMENT LEDGER */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider mb-4 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-sky-500" />
              Alat Berat & Aset Sewa Cash Flow Ledger
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {assets.map(a => (
                <div key={a.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-500 uppercase font-bold font-mono">{a.category}</span>
                    <span className="text-[9px] text-slate-400 font-mono font-bold">Depresiasi: {a.depreciationRate}%/thn</span>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-white uppercase truncate">{a.assetName}</h4>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono pt-2 border-t">
                    <div>
                      <span>Harga Pembelian:</span>
                      <strong className="block text-slate-700 dark:text-slate-300">Rp {a.purchaseCost.toLocaleString("id-ID")}</strong>
                    </div>
                    <div>
                      <span>Biaya Pemeliharaan:</span>
                      <strong className="block text-rose-500">Rp {a.maintenanceCost.toLocaleString("id-ID")}</strong>
                    </div>
                  </div>
                  {a.rentalRevenue > 0 && (
                    <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-600 dark:text-emerald-400 font-bold flex justify-between items-center text-[11px] font-mono">
                      <span>Pendapatan Sewa Alat:</span>
                      <span>+ Rp {a.rentalRevenue.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DEBT receivables & payables AGING BAR */}
      {activeSubTab === "receivables" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Receivables - Piutang */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-5">
              <div>
                <h3 className="font-bold text-slate-850 dark:text-white text-sm flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  Piutang Pelanggan (Account Receivables Aging)
                </h3>
                <p className="text-xs text-slate-400">Analisis keterlambatan pembayaran tagihan dari owner proyek.</p>
              </div>

              {/* Aging Schedule Progress Indicators */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border">
                <span className="text-[10.5px] text-slate-400 uppercase font-mono font-bold block mb-1">Aging Schedule (Hari Keterlambatan)</span>
                
                {/* 0-30 Days */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="font-bold">0 - 30 Hari (Lancar)</span>
                    <span className="text-emerald-550">Rp 5.550.000.000</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded mt-1 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded" style={{ width: "80%" }} />
                  </div>
                </div>

                {/* 31-60 Days */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="font-bold">31 - 60 Hari</span>
                    <span className="text-amber-500">Rp 2.400.000.000</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded mt-1 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded" style={{ width: "35%" }} />
                  </div>
                </div>

                {/* 61-90 Days */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="font-bold">61 - 90 Hari</span>
                    <span className="text-orange-500">Rp 0</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded mt-1 overflow-hidden">
                    <div className="bg-orange-500 h-full rounded" style={{ width: "0%" }} />
                  </div>
                </div>

                {/* >90 Days */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="font-bold">&gt; 90 Hari (Macet)</span>
                    <span className="text-rose-500">Rp 0</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded mt-1 overflow-hidden">
                    <div className="bg-rose-500 h-full rounded" style={{ width: "0%" }} />
                  </div>
                </div>
              </div>

              {/* Outstanding AR Invoice Schedule Details */}
              <div className="space-y-3">
                {receivables.map(r => (
                  <div key={r.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-slate-800 dark:text-white">{r.invoiceNo}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">{r.customerName}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase truncate max-w-[200px]">{r.projectName}</p>
                      <span className="text-[9px] font-mono font-bold text-slate-400 block mt-1">Jatuh Tempo: {r.dueDate}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                        r.status === "Paid" ? "bg-emerald-50 text-emerald-600 font-mono" :
                        r.status === "Unpaid" ? "bg-rose-50 text-rose-500 font-mono" : "bg-slate-50 text-slate-500"
                      }`}>
                        {r.status}
                      </span>
                      <strong className="block font-mono text-xs text-slate-800 dark:text-white mt-1.5">
                        Rp {r.amount.toLocaleString("id-ID")}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Payables - Hutang */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-5">
              <div>
                <h3 className="font-bold text-slate-850 dark:text-white text-sm flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-rose-500" />
                  Hutang Supplier & Subkontraktor (Account Payables)
                </h3>
                <p className="text-xs text-slate-400">Monitoring tagihan bahan baku PO dan invoice subkontraktor.</p>
              </div>

              {/* AP status grouping list */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-2.5 bg-sky-50 dark:bg-sky-950/20 border border-sky-100 rounded-lg text-center">
                  <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold block">BELUM JATUH TEMPO</span>
                  <strong className="block text-sm font-mono mt-1 text-slate-800 dark:text-white">Rp 1.2M</strong>
                </div>
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 rounded-lg text-center">
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold block">DEKAT JATUH TEMPO</span>
                  <strong className="block text-sm font-mono mt-1 text-slate-800 dark:text-white">Rp 320M</strong>
                </div>
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 rounded-lg text-center">
                  <span className="text-[10px] font-mono text-rose-600 dark:text-rose-450 font-bold block animate-pulse">OVERDUE DEVIASI</span>
                  <strong className="block text-sm font-mono mt-1 text-slate-800 dark:text-white">Rp 450M</strong>
                </div>
              </div>

              {/* Outstanding AP Supplier Schedule Details */}
              <div className="space-y-3">
                {payables.map(p => (
                  <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-800 dark:text-white">{p.supplierName}</strong>
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 py-0.5 rounded font-mono font-bold">{p.poNo}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Invoice: {p.invoiceNo} | Surat Terima: {p.grNo}</p>
                      <span className="text-[9px] font-mono font-bold text-slate-400 block mt-1">Jatuh Tempo Tagihan: {p.dueDate}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                        p.status === "Overdue" ? "bg-rose-50 text-rose-600 animate-pulse font-mono" :
                        p.status === "Jatuh Tempo" ? "bg-amber-50 text-amber-600 font-mono" : "bg-sky-50 text-sky-600 font-mono"
                      }`}>
                        {p.status}
                      </span>
                      <strong className="block font-mono text-xs text-rose-555 dark:text-rose-400 mt-1.5">
                        Rp {p.amount.toLocaleString("id-ID")}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: BUDGETS CONTROL vs ACTUALS */}
      {activeSubTab === "budgets" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="font-bold text-slate-850 dark:text-white text-sm flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-blue-500" />
              Kontrol Pemantauan Anggaran Proyek (Budget vs Realisasi)
            </h3>
            <p className="text-xs text-slate-400">Analisis deviasi pengeluaran cash out material, pekerja, alat berat, dan operasional dibanding RAB.</p>
          </div>

          <div className="space-y-6">
            {[
              { component: "Material Konstruksi", budget: 3500000000, actual: 2800000000, color: "bg-blue-500", rawVal: "Material" },
              { component: "Tenaga Kerja / Upah Mandor", budget: 1200000000, actual: 950000000, color: "bg-orange-500", rawVal: "Upah" },
              { component: "Sewa Alat Berat & Mobilisasi", budget: 800000000, actual: 450000000, color: "bg-indigo-500", rawVal: "Alat" },
              { component: "Pekerjaan Subkontraktor Spesialis", budget: 2200000000, actual: 1800000000, color: "bg-purple-500", rawVal: "Subkontraktor" },
              { component: "Operasional Site & Kantor Pusat", budget: 500000000, actual: 520000000, color: "bg-rose-500", rawVal: "Operasional" }
            ].map(b => {
              const variance = b.budget - b.actual;
              const pct = (b.actual / b.budget) * 100;
              const statusColor = pct > 100 ? "text-rose-500 font-bold" : pct > 85 ? "text-amber-500 font-bold" : "text-emerald-500 font-bold";

              return (
                <div key={b.component} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl text-xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 font-bold">
                    <span className="text-slate-800 dark:text-white">{b.component}</span>
                    <span className={`text-[10px] uppercase tracking-wide px-2 rounded font-mono ${statusColor}`}>
                      Deviasi: {pct.toFixed(1)}% {pct > 100 ? "(OVER BUDGET)" : pct > 85 ? "(WARNING LIMIT)" : "(AMAN)"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-[11px] text-slate-500 font-mono py-1">
                    <div>
                      <span>Anggaran RAB:</span>
                      <strong className="block text-slate-700 dark:text-slate-200">Rp {b.budget.toLocaleString("id-ID")}</strong>
                    </div>
                    <div>
                      <span>Pengeluaran Aktual:</span>
                      <strong className="block text-slate-800 dark:text-white">Rp {b.actual.toLocaleString("id-ID")}</strong>
                    </div>
                    <div>
                      <span>Sisa Selisih Alokasi:</span>
                      <strong className={`block ${variance >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {variance >= 0 ? "+" : ""} Rp {variance.toLocaleString("id-ID")}
                      </strong>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded mt-2 overflow-hidden">
                    <div className={`${b.color} h-full rounded`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 7: AI FINANCIAL ASSISTANT CONVERSATIONAL */}
      {activeSubTab === "ai" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-200">
          {/* Quick analysis preset queries */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">AI Intelligent Presets</h3>
            
            <button
              onClick={() => askAIAssistant("Minta Prediksi Likuiditas & Cash Flow Proyek 30 Hari")}
              className="w-full p-3 bg-white dark:bg-slate-900 hover:bg-slate-100 text-left border border-slate-200 rounded-xl text-xs font-medium space-y-1 block hover:border-blue-400 cursor-pointer text-slate-700 dark:text-slate-300 transition"
            >
              <TrendingUp className="w-4 h-4 text-blue-500 mb-1" />
              <strong className="block">Forecast Cash Flow 30 Hari</strong>
              <span className="text-[10px] text-slate-400 font-mono">Estimasi tagihan masuk & keluar</span>
            </button>

            <button
              onClick={() => askAIAssistant("Apakah ada risiko Budgets Overrun atau Kekurangan Dana jangka pendek?")}
              className="w-full p-3 bg-white dark:bg-slate-900 hover:bg-slate-100 text-left border border-slate-200 rounded-xl text-xs font-medium space-y-1 block hover:border-blue-400 cursor-pointer text-slate-700 dark:text-slate-300 transition"
            >
              <AlertTriangle className="w-4 h-4 text-amber-500 mb-1" />
              <strong className="block">Warning Pembengkakan Biaya</strong>
              <span className="text-[10px] text-slate-400 font-mono">Deteksi over-budget proyek</span>
            </button>

            <button
              onClick={() => askAIAssistant("Adakah anomali transaksi atau kuitansi janggal dalam log kas?")}
              className="w-full p-3 bg-white dark:bg-slate-900 hover:bg-slate-100 text-left border border-slate-200 rounded-xl text-xs font-medium space-y-1 block hover:border-blue-400 cursor-pointer text-slate-700 dark:text-slate-300 transition"
            >
              <Search className="w-4 h-4 text-emerald-500 mb-1" />
              <strong className="block">Deteksi Anomali Transaksi</strong>
              <span className="text-[10px] text-slate-400 font-mono">Pemeriksaan bukti bayar ganda</span>
            </button>

            <button
              onClick={() => askAIAssistant("Berikan rekomendasi efisiensi biaya operasional lapangan")}
              className="w-full p-3 bg-white dark:bg-slate-900 hover:bg-slate-100 text-left border border-slate-200 rounded-xl text-xs font-medium space-y-1 block hover:border-blue-400 cursor-pointer text-slate-700 dark:text-slate-300 transition"
            >
              <Sparkles className="w-4 h-4 text-indigo-500 mb-1" />
              <strong className="block">Rekomendasi Penghematan</strong>
              <span className="text-[10px] text-slate-400 font-mono">Optimasi armada & jatuh tempo vendor</span>
            </button>
          </div>

          {/* Interactive Chat interface */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between min-h-[460px]">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                <div>
                  <h4 className="font-bold text-slate-850 dark:text-white text-xs">Foresyndo AI Financial Investigator</h4>
                  <p className="text-[10px] text-slate-400">Konsultan kecerdasan keuangan multi-proyek real-time</p>
                </div>
              </div>

              {/* Message Log Container */}
              <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2">
                {aiChatHistory.map((item, idx) => (
                  <div key={idx} className={`flex items-start gap-2.5 ${item.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`p-3 rounded-2xl text-xs max-w-lg leading-relaxed ${
                      item.sender === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-slate-100 dark:bg-slate-950 dark:border border-slate-800 rounded-tl-none text-slate-800 dark:text-slate-300 font-serif"
                    }`}>
                      {/* Markdown mock renderer as text block formatting */}
                      <pre className="font-sans whitespace-pre-wrap">{item.text}</pre>
                    </div>
                  </div>
                ))}

                {aiProcessing && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                    <span>Gemini AI sedang menghitung taksiran keuangan & profitabilitas...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Input keyboard bottom */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                askAIAssistant();
              }}
              className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Tanyakan analisis profitabilitas, warning kas drop, atau pengeluaran ..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="flex-grow bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-205 dark:border-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 8: EXPORT REPORTS MANAGER */}
      {activeSubTab === "reports" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="font-bold text-slate-850 dark:text-white text-sm flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-500" />
              Pusat Dokumen Laporan ERP (PDF, Excel, & CSV)
            </h3>
            <p className="text-xs text-slate-400">Sertifikasi laporan keuangan siap cetak terotorisasi tanda tangan digital blockchain.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { type: "Cash Flow Statement", title: "Laporan Arus Kas Konsolidasi", desc: "Mutasi nominal keluar masuk berskala harian, bulanan, dan tahunan real-time." },
              { type: "Account Receivables Aging", title: "Laporan Umur Piutang Pelanggan", desc: "Histori keterlambatan termin dan progress klaim pencairan pemilik proyek." },
              { type: "Account Payables Outstanding", title: "Laporan Tagihan Hutang Vendor", desc: "Invoice bahan baku, surat terima material, dan PO belum lunas." },
              { type: "Profit & Loss (P&L)", title: "Laporan Laba Rugi Portofolio", desc: "Analisis gross profit per proyek, beban operasional, dan margin EBITDA." },
              { type: "Balance Sheet", title: "Laporan Posisi Neraca Keuangan", desc: "Taksiran aset peralatan, kasir giro, kewajiban hutang, dan ekuitas kas." },
              { type: "Bank Mutations Ledger", title: "Laporan Buku Rekonsiliasi Bank", desc: "Buku mutasi bank mandiri, BCA, dan bank pendukung digital." }
            ].map(r => (
              <div key={r.type} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-2xl text-xs space-y-3">
                <span className="text-[10px] bg-slate-250 px-2 py-0.5 rounded font-bold font-mono text-slate-500">{r.type}</span>
                <strong className="block text-slate-800 dark:text-slate-100 text-sm leading-tight">{r.title}</strong>
                <p className="text-[11px] text-slate-400 leading-relaxed">{r.desc}</p>
                
                <div className="grid grid-cols-2 gap-2 border-t pt-3 mt-1 font-mono">
                  <button
                    onClick={() => generatePDFReport(r.type)}
                    className="py-1.5 bg-slate-900 border text-white font-extrabold hover:bg-slate-800 text-[10px] flex items-center justify-center gap-1 rounded transition cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Ekspor PDF</span>
                  </button>
                  <button
                    onClick={() => triggerCSVExport(r.type)}
                    className="py-1.5 bg-blue-600 font-extrabold text-white text-[10px] flex items-center justify-center gap-1 rounded transition hover:bg-blue-700 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Excel / CSV</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
