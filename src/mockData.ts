import { Project, ProjectStatus, RABItem, GanttTask, FinanceTransaction, PurchaseOrder, MaterialInventory, SDMStaff, QualityControlItem, SafetyRecord, DocumentRecord, DailyReport, UserRole } from "./types";

export const initialProjects: Project[] = [
  {
    projectId: "proj-001",
    nomorProyek: "PR-2026-CV-001",
    namaProyek: "Pembangunan Gedung Kantor Foresyndo Center",
    lokasi: "Kuningan, Jakarta Selatan",
    owner: "PT Foresyndo Integra",
    konsultan: "PD Arch & Assoc",
    kontraktor: "CV Foresyndo Karya Utama",
    tanggalMulai: "2026-02-01",
    tanggalSelesai: "2026-11-30",
    nilaiKontrak: 18500000000,
    status: ProjectStatus.BERJALAN,
    progress: 45.2,
    unpaidInvoices: 350000000,
    activeTermin: "Termin II (40%)",
    companyName: "Foresyndo Contractors"
  },
  {
    projectId: "proj-002",
    nomorProyek: "PR-2026-MEP-012",
    namaProyek: "Instalasi MEP Apartemen Signature Tower",
    lokasi: "BSD City, Tangerang Selatan",
    owner: "PT Sinarmas Signature",
    konsultan: "Mitra MEP Engineering",
    kontraktor: "Foresyndo MEP Specialist",
    tanggalMulai: "2026-04-10",
    tanggalSelesai: "2026-12-15",
    nilaiKontrak: 9200000000,
    status: ProjectStatus.BERJALAN,
    progress: 21.8,
    unpaidInvoices: 0,
    activeTermin: "Uang Muka (20%)",
    companyName: "Foresyndo Contractors"
  },
  {
    projectId: "proj-003",
    nomorProyek: "PR-2026-CV-005",
    namaProyek: "Tender Pembangunan Prasarana Tol Japek",
    lokasi: "Cikarang, Bekasi",
    owner: "PT Jasa Marga TBK",
    konsultan: "KSO Adhi-Waskita Konsultan",
    kontraktor: "Foresyndo Civil Infrastructure",
    tanggalMulai: "2026-07-01",
    tanggalSelesai: "2027-06-30",
    nilaiKontrak: 45000000000,
    status: ProjectStatus.TENDER,
    progress: 0.0,
    unpaidInvoices: 0,
    activeTermin: "-",
    companyName: "Foresyndo Contractors"
  },
  {
    projectId: "proj-004",
    nomorProyek: "PR-2025-CV-082",
    namaProyek: "Pekerjaan Restorasi Rumah Dinas Menteng",
    lokasi: "Menteng, Jakarta Pusat",
    owner: "Sekretariat Negara RI",
    konsultan: "Studio Budirjo Heritage",
    kontraktor: "Foresyndo Premium Renovations",
    tanggalMulai: "2025-08-10",
    tanggalSelesai: "2026-01-30",
    nilaiKontrak: 4200000000,
    status: ProjectStatus.SELESAI,
    progress: 100.0,
    unpaidInvoices: 0,
    activeTermin: "Retensi (5%)",
    companyName: "Foresyndo Contractors"
  }
];

export const initialRABItems: Record<string, RABItem[]> = {
  "proj-001": [
    { id: "rab-101", projectId: "proj-001", kodeItem: "A.01", uraianPekerjaan: "Pekerjaan Persiapan & Mobilisasi", volume: 1, satuan: "Lump Sum", hargaSatuan: 150000000, total: 150000000 },
    { id: "rab-102", projectId: "proj-001", kodeItem: "B.01", uraianPekerjaan: "Galian Tanah & Pondasi Bore Pile S-1", volume: 180, satuan: "m3", hargaSatuan: 1200000, total: 216000000 },
    { id: "rab-103", projectId: "proj-001", kodeItem: "C.01", uraianPekerjaan: "Beton Bertulang K-350 Struktur Kolom", volume: 450, satuan: "m3", hargaSatuan: 3500000, total: 1575000000 },
    { id: "rab-104", projectId: "proj-001", kodeItem: "C.02", uraianPekerjaan: "Pekerjaan Plat Lantai & Balok Beton D-15", volume: 820, satuan: "m3", hargaSatuan: 3800000, total: 3116000000 },
    { id: "rab-105", projectId: "proj-001", kodeItem: "D.01", uraianPekerjaan: "Arsitektur Dinding Bata Ringan plaster", volume: 3200, satuan: "m2", hargaSatuan: 220000, total: 704000000 },
    { id: "rab-106", projectId: "proj-001", kodeItem: "D.02", uraianPekerjaan: "Pekerjaan Daun Jendela Aluminium & Kaca", volume: 85, satuan: "unit", hargaSatuan: 6500000, total: 552500000 },
    { id: "rab-107", projectId: "proj-001", kodeItem: "E.01", uraianPekerjaan: "Instalasi Elektrikal & Kabel Tray Daya Utama", volume: 1, satuan: "Lump Sum", hargaSatuan: 850000000, total: 850000000 }
  ],
  "proj-002": [
    { id: "rab-201", projectId: "proj-002", kodeItem: "MEP.01", uraianPekerjaan: "Pengadaan Diesel Generator Set 500kVA", volume: 2, satuan: "Unit", hargaSatuan: 1200000000, total: 2400000000 },
    { id: "rab-202", projectId: "proj-002", kodeItem: "MEP.02", uraianPekerjaan: "Instalasi Chiller Air-Conditioner VRV", volume: 20, satuan: "Set", hargaSatuan: 180000000, total: 3600000000 },
    { id: "rab-203", projectId: "proj-002", kodeItem: "MEP.03", uraianPekerjaan: "Pipa Plumbing & Riser Air Bersih PEX-a", volume: 1200, satuan: "meter", hargaSatuan:  350000, total:  420000000 }
  ]
};

export const initialGanttTasks: Record<string, GanttTask[]> = {
  "proj-001": [
    { id: "task-01", projectId: "proj-001", name: "Land Clearing & Bouwplank", startDate: "2026-02-01", endDate: "2026-02-20", progress: 100, criticalPath: false, status: "on time" },
    { id: "task-02", projectId: "proj-001", name: "Galian & Bore Pile Pondasi", startDate: "2026-02-21", endDate: "2026-03-31", progress: 100, criticalPath: true, status: "on time" },
    { id: "task-03", projectId: "proj-001", name: "Struktur Balok & Kolom Lantai 1", startDate: "2026-04-01", endDate: "2026-05-15", progress: 100, criticalPath: true, status: "on time", dependencies: ["task-02"] },
    { id: "task-04", projectId: "proj-001", name: "Struktur Plat & Balok Lantai 2", startDate: "2026-05-16", endDate: "2026-06-30", progress: 50, criticalPath: true, status: "delayed", dependencies: ["task-03"] },
    { id: "task-05", projectId: "proj-001", name: "Pekerjaan MEP Kasar Lantai 1-2", startDate: "2026-06-15", endDate: "2026-08-10", progress: 10, criticalPath: false, status: "on time", dependencies: ["task-03"] },
    { id: "task-06", projectId: "proj-001", name: "Pemasangan Bata & Plesteran", startDate: "2026-07-01", endDate: "2026-09-15", progress: 0, criticalPath: false, status: "on time" },
    { id: "task-07", projectId: "proj-001", name: "Finishing Cat & Curtain Wall Kaca", startDate: "2026-09-16", endDate: "2026-11-20", progress: 0, criticalPath: false, status: "on time" }
  ],
  "proj-002": [
    { id: "task-m1", projectId: "proj-002", name: "Pengecekan Layout & Pre-Procurement", startDate: "2026-04-10", endDate: "2026-05-10", progress: 100, criticalPath: false, status: "on time" },
    { id: "task-m2", projectId: "proj-002", name: "Pengiriman unit Genset & Chiller", startDate: "2026-05-11", endDate: "2026-07-15", progress: 30, criticalPath: true, status: "on time" },
    { id: "task-m3", projectId: "proj-002", name: "Instalasi Piping & Wiring Ducting", startDate: "2026-07-16", endDate: "2026-10-30", progress: 0, criticalPath: true, status: "on time" }
  ]
};

export const initialTransactions: Record<string, FinanceTransaction[]> = {
  "proj-001": [
    { id: "tr-001", projectId: "proj-001", type: "cash_in", category: "Uang Muka", amount: 3700000000, date: "2026-02-05", description: "Penerimaan DP 20% Kontrak Kerja", status: "Processed" },
    { id: "tr-002", projectId: "proj-001", type: "cash_out", category: "Material", amount: 1200000000, date: "2026-02-18", description: "Pembayaran Ready Mix & Besi Ulir Krakatau Steel", status: "Processed" },
    { id: "tr-003", projectId: "proj-001", type: "cash_out", category: "Subkontraktor", amount: 650000000, date: "2026-03-10", description: "Pembayaran Pondasi Bore Pile PT Berdikari", status: "Processed" },
    { id: "tr-004", projectId: "proj-001", type: "cash_out", category: "Upah", amount: 240000000, date: "2026-04-25", description: "Upah Harian Pekerja Struktur & Mandor Mei", status: "Approved" },
    { id: "tr-005", projectId: "proj-001", type: "cash_in", category: "Termin", amount: 5550000000, date: "2026-05-20", description: "Penerimaan Termin I Progres Fisik 30%", status: "Processed" },
    { id: "tr-006", projectId: "proj-001", type: "cash_out", category: "Alat", amount: 180000000, date: "2026-05-28", description: "Sewa Tower Crane & Mobile Crane PT Kawan Lama", status: "Processed" },
    { id: "tr-007", projectId: "proj-001", type: "cash_out", category: "Operasional", amount: 45000000, date: "2026-06-02", description: "Pembayaran Listrik Kerja & BBM Genset Site", status: "Draft" }
  ],
  "proj-002": [
    { id: "tr-201", projectId: "proj-002", type: "cash_in", category: "Uang Muka", amount: 1840000000, date: "2026-04-15", description: "Penerimaan DP MEP 20%", status: "Processed" }
  ]
};

export const initialPurchaseOrders: Record<string, PurchaseOrder[]> = {
  "proj-001": [
    { id: "po-01", projectId: "proj-001", nomorPO: "PO-FOS-101", supplier: "PT Krakatau Steel", material: "Besi Ulir D-22mm", qty: 45, harga: 14500, total: 652500, status: "Delivered" },
    { id: "po-02", projectId: "proj-001", nomorPO: "PO-FOS-102", supplier: "PT Holcim Jaya", material: "Beton Ready Mix K-350 N-F", qty: 156, harga: 980000, total: 152880000, status: "Delivered" },
    { id: "po-03", projectId: "proj-001", nomorPO: "PO-FOS-103", supplier: "Sinar Jaya Logam", material: "Semen Portland 50kg Tiga Roda", qty: 850, harga: 68000, total: 57800000, status: "Ordered" },
    { id: "po-04", projectId: "proj-001", nomorPO: "PO-FOS-104", supplier: "Homedecor Abadi Ltd", material: "Keramik Granit 60x60 Bianco", qty: 1200, harga: 185000, total: 222000000, status: "Draft" }
  ]
};

export const initialInventory: Record<string, MaterialInventory[]> = {
  "proj-001": [
    { id: "inv-01", projectId: "proj-001", materialName: "Semen Tiga Roda 50kg", currentStock: 350, minStock: 200, unit: "Sak", lastUpdated: "2026-06-05" },
    { id: "inv-02", projectId: "proj-001", materialName: "Besi Ulir D-22mm", currentStock: 12, minStock: 15, unit: "Ton", lastUpdated: "2026-06-03" },
    { id: "inv-03", projectId: "proj-001", materialName: "Batu Bata Merah", currentStock: 25000, minStock: 10000, unit: "Pcs", lastUpdated: "2026-06-01" },
    { id: "inv-04", projectId: "proj-001", materialName: "Kabel NYA 2.5mm Eterna", currentStock: 5, minStock: 8, unit: "Roll", lastUpdated: "2026-06-04" }
  ]
};

export const initialStaff: Record<string, SDMStaff[]> = {
  "proj-001": [
    { id: "staff-01", projectId: "proj-001", name: "Surya Kencana", role: "Karyawan", attendanceToday: true, dailyRate: 250000, productivity: 95 },
    { id: "staff-02", projectId: "proj-001", name: "Pak Subur", role: "Mandor", attendanceToday: true, dailyRate: 350000, productivity: 88 },
    { id: "staff-03", projectId: "proj-001", name: "Tim Tukang Batu Mandiri", role: "Subkontraktor", attendanceToday: true, dailyRate: 1200000, productivity: 92 },
    { id: "staff-04", projectId: "proj-001", name: "Irwan Setiawan", role: "Karyawan", attendanceToday: false, dailyRate: 220000, productivity: 75 }
  ]
};

export const initialQC: Record<string, QualityControlItem[]> = {
  "proj-001": [
    { id: "qc-01", projectId: "proj-001", checklistName: "Inspeksi Pembesian Plat Kolom Lantai 2", category: "Inspection Request", description: "Cek jarak sengkang pembesian kolom, diameter besi sekunder & primer.", status: "Closed", date: "2026-05-18", inspectorName: "Bayu Saputra (QC)" },
    { id: "qc-02", projectId: "proj-001", checklistName: "Kerapihan Pasangan Bata Ringan Lt 1 Koridor", category: "Checklist QC", description: "Perataan garis siar mortar bata ringan, deviasi ketegakkan dinding maks 5mm.", status: "Progress", date: "2026-06-01", inspectorName: "Bayu Saputra (QC)" },
    { id: "qc-03", projectId: "proj-001", checklistName: "NCR-01: Retak Rambut Plat Beton Dak Lift", category: "NCR", description: "Ditemukan garis retak halus pascal cor dak lift as F-4. Perlu perbaikan saringan sikat semen.", status: "Open", date: "2026-06-04", inspectorName: "Bayu Saputra (QC)" }
  ]
};

export const initialSafety: Record<string, SafetyRecord[]> = {
  "proj-001": [
    { id: "sf-01", projectId: "proj-001", type: "Safety Induction", details: "Sosialisasi APD wajib (Helm, Safety Shoes, Body Harness) untuk 12 helper subkon baru.", findings: 0, accidents: 0, safetyScore: 100, date: "2026-02-02" },
    { id: "sf-02", projectId: "proj-001", type: "Safety Patrol", details: "Ditemukan 2 pekerja melepas safety harness saat memasang bekisting luar balok lantai 2.", findings: 3, accidents: 0, safetyScore: 85, date: "2026-05-25" },
    { id: "sf-03", projectId: "proj-001", type: "Toolbox Meeting", details: "Evaluasi mingguan keselamatan kerja, perapian peletakan tumpukan material tajam.", findings: 0, accidents: 0, safetyScore: 98, date: "2026-06-03" }
  ]
};

export const initialDocuments: Record<string, DocumentRecord[]> = {
  "proj-001": [
    { id: "doc-01", projectId: "proj-001", name: "Kontrak Perjanjian Pemborongan CV-001.pdf", category: "Kontrak", url: "#", version: "v1.2", status: "Approved", createdAt: "2026-01-20" },
    { id: "doc-02", projectId: "proj-001", name: "Shop Drawing Pembesian Abutment Kolom A1-A5.pdf", category: "Shop Drawing", url: "#", version: "v4.0", status: "Approved", createdAt: "2026-03-12" },
    { 
      id: "doc-03", 
      projectId: "proj-001", 
      name: "RFI-12: Detail Sambungan Balok Baja Utama.pdf", 
      category: "RFI", 
      url: "#", 
      version: "v1.0", 
      status: "Pending Approval", 
      createdAt: "2026-06-02",
      comments: [
        {
          id: "c-1",
          authorName: "Pak Budi",
          authorRole: "Site Engineer",
          text: "Beban balok penyangga di sambungan kolom A3 terindikasi melebihi kapasitas desain awal. Butuh approval structural engineer.",
          timestamp: "2026-06-02 10:15"
        },
        {
          id: "c-2",
          authorName: "Ir. Doni",
          authorRole: "Project Manager",
          text: "Sudah saya teruskan ke Konsultan Perencana. Mohon disiapkan opsi pelat pengaku (stiffener plate) tambahan.",
          timestamp: "2026-06-02 14:30"
        }
      ],
      statusHistory: [
        {
          id: "h-1",
          status: "Draft",
          changedBy: "Pak Budi",
          changedByRole: "Site Engineer",
          timestamp: "2026-06-02 09:00",
          note: "Dokumen RFI awal diarsipkan"
        },
        {
          id: "h-2",
          status: "Pending Approval",
          changedBy: "Ir. Doni",
          changedByRole: "Project Manager",
          timestamp: "2026-06-02 14:35",
          note: "RFI diajukan ke Direksi dan Owner untuk review lanjut"
        }
      ]
    }
  ]
};

export const initialDailyReports: Record<string, DailyReport[]> = {
  "proj-001": [
    { id: "dr-01", projectId: "proj-001", date: "2026-06-05", weather: "Hujan", laborDetails: "Mandor: 1, Tukang: 8, Laden: 12", equipmentDetails: "Tower Crane: ON, Mixer: ON, Bar Bender: ON", materialDetails: "Diterima Semen 50 Sak, Besi D16 100 batang", activities: "Pengecoran sisa plat tangga sayap barat, plesteran interior zone A, setup pipa sparing conduit MEP lt 2." }
  ]
};
