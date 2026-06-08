export enum UserRole {
  DIREKTUR = "Direktur",
  PROJECT_MANAGER = "Project Manager",
  SITE_ENGINEER = "Site Engineer",
  QC_ENGINEER = "QC Engineer",
  SAFETY_OFFICER = "Safety Officer",
  FINANCE = "Finance",
  OWNER = "Owner",
  ADMIN = "Admin"
}

export enum ProjectStatus {
  TENDER = "Tender",
  PERSIAPAN = "Persiapan",
  BERJALAN = "Berjalan",
  SELESAI = "Selesai",
  PEMELIHARAAN = "Pemeliharaan"
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  company: string;
}

export interface PortalSettings {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  logoUrl?: string;
  adminUsername?: string;
  adminPassword?: string;
}

export interface Project {
  projectId: string;
  nomorProyek: string;
  namaProyek: string;
  lokasi: string;
  owner: string;
  konsultan: string;
  kontraktor: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  nilaiKontrak: number;
  status: ProjectStatus;
  progress: number; // 0 to 100
  unpaidInvoices?: number;
  activeTermin?: string;
  companyName: string;
}

export interface RABItem {
  id: string;
  projectId: string;
  kodeItem: string;
  uraianPekerjaan: string;
  volume: number;
  satuan: string;
  hargaSatuan: number;
  total: number;
}

export interface ProgressReport {
  id: string;
  projectId: string;
  tanggal: string;
  itemPekerjaan: string;
  volumeRealisasi: number;
  persentaseProgress: number; // incremental progress percentage at this date
  note?: string;
  imageUrl?: string;
}

export interface GanttTask {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number; // 0 to 100
  criticalPath: boolean;
  dependencies?: string[]; // parent task IDs
  status: "on time" | "delayed" | "critical";
  assignedTo?: string;
}

export interface FinanceTransaction {
  id: string;
  projectId: string;
  type: "cash_in" | "cash_out";
  category: "Uang Muka" | "Termin" | "Retensi" | "Addendum" | "Material" | "Upah" | "Subkontraktor" | "Alat" | "Operasional";
  amount: number;
  date: string;
  description: string;
  status: "Draft" | "Approved" | "Processed";
}

export interface PurchaseOrder {
  id: string;
  projectId: string;
  nomorPO: string;
  supplier: string;
  material: string;
  qty: number;
  harga: number;
  total: number;
  status: "Draft" | "Approved" | "Ordered" | "Delivered";
}

export interface MaterialInventory {
  id: string;
  projectId: string;
  materialName: string;
  currentStock: number;
  minStock: number;
  unit: string;
  lastUpdated: string;
}

export interface MaterialMutation {
  id: string;
  projectId: string;
  materialName: string;
  type: "masuk" | "keluar" | "mutasi";
  qty: number;
  date: string;
  qrCode: string;
  notes: string;
}

export interface SDMStaff {
  id: string;
  projectId: string;
  name: string;
  role: "Karyawan" | "Mandor" | "Subkontraktor";
  attendanceToday: boolean;
  dailyRate: number;
  productivity: number; // percentage
  phone?: string;
}

export interface SDMAttendance {
  id: string;
  projectId: string;
  staffId: string;
  date: string;
  status: "Hadir" | "Sakit" | "Izin" | "Alpa";
  overtimeHours: number;
}

export interface RFIDiscussionComment {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  timestamp: string;
}

export interface RFIStatusHistory {
  id: string;
  status: "Draft" | "Approved" | "Rejected" | "Pending Approval";
  changedBy: string;
  changedByRole: string;
  timestamp: string;
  note?: string;
}

export interface DocumentRecord {
  id: string;
  projectId: string;
  name: string;
  category: "Kontrak" | "Shop Drawing" | "As Built Drawing" | "RFI" | "Metode Kerja" | "Laporan Harian";
  url: string;
  version: string;
  status: "Draft" | "Approved" | "Rejected" | "Pending Approval";
  createdAt: string;
  dueDate?: string;
  comments?: RFIDiscussionComment[];
  statusHistory?: RFIStatusHistory[];
}

export interface QualityControlItem {
  id: string;
  projectId: string;
  checklistName: string;
  category: "Checklist QC" | "Inspection Request" | "NCR" | "Corrective Action";
  description: string;
  status: "Open" | "Progress" | "Closed";
  date: string;
  inspectorName: string;
}

export interface SafetyRecord {
  id: string;
  projectId: string;
  type: "Safety Induction" | "Safety Patrol" | "Incident Report" | "Toolbox Meeting";
  details: string;
  findings: number;
  accidents: number;
  safetyScore: number; // out of 100
  date: string;
}

export interface DailyReport {
  id: string;
  projectId: string;
  date: string;
  weather: "Cerah" | "Hujan" | "Gerimis" | "Mendung";
  laborDetails: string;
  equipmentDetails: string;
  materialDetails: string;
  activities: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface SubTask {
  id: string;
  title: string;
  assignedToName: string;
  role: UserRole;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedRole: UserRole; // Target division/role assigned to this task
  status: "Belum Mulai" | "Dalam Proses" | "Menunggu Review" | "Selesai";
  dueDate: string;
  creatorName: string;
  creatorRole: UserRole;
  priority: "Low" | "Medium" | "High";
  notes?: string;
  subTasks?: SubTask[];
}

export interface DivisionalMessage {
  id: string;
  projectId: string;
  senderName: string;
  senderRole: UserRole;
  targetRole: UserRole | "Semua"; // Targeted division/role or all roles
  text: string;
  timestamp: string; // e.g. "YYYY-MM-DD HH:MM"
}

