import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  Project, ProjectStatus, RABItem, GanttTask, FinanceTransaction, PurchaseOrder, 
  MaterialInventory, SDMStaff, QualityControlItem, SafetyRecord, DocumentRecord, 
  DailyReport, UserRole, UserProfile, AuditLog, MaterialMutation, ProgressReport,
  RFIDiscussionComment, RFIStatusHistory, PortalSettings, Task, DivisionalMessage
} from "../types";
import { 
  initialProjects, initialRABItems, initialGanttTasks, initialTransactions, 
  initialPurchaseOrders, initialInventory, initialStaff, initialQC, initialSafety, 
  initialDocuments, initialDailyReports 
} from "../mockData";
import { auth, db, googleProvider } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, where, deleteDoc } from "firebase/firestore";

interface ProjectContextType {
  currentUser: UserProfile | null;
  loadingAuth: boolean;
  authError: { code: string; message: string; hostname: string } | null;
  setAuthError: (err: { code: string; message: string; hostname: string } | null) => void;
  projects: Project[];
  selectedProject: Project | null;
  rabItems: RABItem[];
  ganttTasks: GanttTask[];
  transactions: FinanceTransaction[];
  purchaseOrders: PurchaseOrder[];
  inventory: MaterialInventory[];
  mutations: MaterialMutation[];
  staff: SDMStaff[];
  attendance: Record<string, "Hadir" | "Sakit" | "Izin" | "Alpa">;
  qcItems: QualityControlItem[];
  safetyRecords: SafetyRecord[];
  documents: DocumentRecord[];
  dailyReports: DailyReport[];
  progressReports: ProgressReport[];
  tasks: Task[];
  messages: DivisionalMessage[];
  notifications: Array<{ id: string; title: string; message: string; read: boolean; date: string }>;
  auditLogs: AuditLog[];
  darkMode: boolean;
  multiCompany: string;
  activeCompany: string;
  portalSettings: PortalSettings;
  updatePortalSettings: (settings: PortalSettings) => Promise<void>;
  
  // Setters & Triggers
  signInWithGoogle: () => Promise<void>;
  signInWithBypass: (role: UserRole, name: string) => void;
  logOut: () => Promise<void>;
  switchProject: (projectId: string) => void;
  setDarkMode: (val: boolean) => void;
  setActiveCompany: (val: string) => void;
  
  // CRUD & Transactions
  addProject: (p: Omit<Project, "projectId" | "progress">) => void;
  updateProject: (p: Project) => void;
  deleteProject: (projectId: string) => void;
  addRABItem: (item: Omit<RABItem, "id" | "projectId">) => void;
  deleteRABItem: (id: string) => void;
  addGanttTask: (task: Omit<GanttTask, "id" | "projectId">) => void;
  updateGanttTask: (task: GanttTask) => void;
  deleteGanttTask: (id: string) => void;
  addTransaction: (tx: Omit<FinanceTransaction, "id" | "projectId">) => void;
  approveTransaction: (id: string) => void;
  addPurchaseOrder: (po: Omit<PurchaseOrder, "id" | "projectId">) => void;
  updatePOStatus: (id: string, status: "Draft" | "Approved" | "Ordered" | "Delivered") => void;
  adjustInventory: (materialName: string, amount: number) => void;
  addMaterialMutation: (mut: Omit<MaterialMutation, "id" | "projectId">) => void;
  addInventoryItem: (item: Omit<MaterialInventory, "id" | "projectId" | "lastUpdated">) => void;
  updateInventoryItem: (item: MaterialInventory) => void;
  deleteInventoryItem: (id: string) => void;
  addSDMStaff: (st: Omit<SDMStaff, "id" | "projectId">) => void;
  toggleAttendance: (staffId: string) => void;
  addQCItem: (qc: Omit<QualityControlItem, "id" | "projectId">) => void;
  updateQCStatus: (id: string, status: "Open" | "Progress" | "Closed") => void;
  addSafetyRecord: (saf: Omit<SafetyRecord, "id" | "projectId">) => void;
  addDocument: (doc: Omit<DocumentRecord, "id" | "projectId" | "createdAt">) => void;
  approveDocument: (id: string, approved: boolean) => void;
  addRFIComment: (docId: string, text: string) => void;
  updateRFIStatus: (docId: string, status: "Draft" | "Approved" | "Rejected" | "Pending Approval", note?: string) => void;
  addDailyReport: (rep: Omit<DailyReport, "id" | "projectId">) => void;
  addProgressReport: (pr: Omit<ProgressReport, "id" | "projectId">) => void;

  // Tasks & Divisional Communication CRUD
  addTask: (task: Omit<Task, "id" | "projectId" | "creatorName" | "creatorRole">) => void;
  updateTaskStatus: (id: string, status: Task["status"], notes?: string) => void;
  deleteTask: (id: string) => void;
  addDivisionalMessage: (targetRole: UserRole | "Semua", text: string) => void;
  addSubTask: (taskId: string, title: string, assignedToName: string, role: UserRole) => void;
  toggleSubTask: (taskId: string, subTaskId: string) => void;
  deleteSubTask: (taskId: string, subTaskId: string) => void;
  
  // AI Tools trigger
  runAIAnalysis: (type: "delay_analysis" | "cashflow_prediction" | "risk_assessment" | "minutes_generator" | "report_generator", extraPayload?: any) => Promise<{ text: string; isMocked: boolean; message?: string }>;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<{ code: string; message: string; hostname: string } | null>(null);

  const defaultPortalSettings: PortalSettings = {
    companyName: "PT Foresyndo Group",
    companyAddress: "Jl. Jenderal Sudirman No. 88, Jakarta Selatan",
    companyEmail: "info@foresyndo.com",
    companyPhone: "+62 21-8888-888",
    logoUrl: "/src/assets/images/fgi_logo_1780821983844.png",
    adminUsername: "admin",
    adminPassword: "Password123"
  };

  const [portalSettings, setPortalSettings] = useState<PortalSettings>(() => {
    const saved = localStorage.getItem("fos_portal_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.logoUrl || parsed.logoUrl === "") {
          parsed.logoUrl = "/src/assets/images/fgi_logo_1780821983844.png";
        }
        return parsed;
      } catch (e) {
        return defaultPortalSettings;
      }
    }
    return defaultPortalSettings;
  });

  // Load Portal Settings
  useEffect(() => {
    const fetchPortalSettings = async () => {
      try {
        const docRef = doc(db, "portal_settings", "config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as PortalSettings;
          if (!data.logoUrl || data.logoUrl === "") {
            data.logoUrl = "/src/assets/images/fgi_logo_1780821983844.png";
          }
          setPortalSettings(data);
          localStorage.setItem("fos_portal_settings", JSON.stringify(data));
          if (data.companyName) {
            setActiveCompany(data.companyName);
          }
        } else {
          try {
            await setDoc(docRef, defaultPortalSettings);
            localStorage.setItem("fos_portal_settings", JSON.stringify(defaultPortalSettings));
          } catch (err) {
            console.warn("Could not save initial settings back to Firestore on mount (may be offline / permission check):", err);
          }
        }
      } catch (error) {
        console.warn("Offline or failed fetching portal settings from Firestore (using local cache):", error);
      }
    };
    fetchPortalSettings();
  }, []);

  const updatePortalSettings = async (settings: PortalSettings) => {
    // Optimistic & instant local update
    setPortalSettings(settings);
    localStorage.setItem("fos_portal_settings", JSON.stringify(settings));
    if (settings.companyName) {
      setActiveCompany(settings.companyName);
    }
    
    try {
      await setDoc(doc(db, "portal_settings", "config"), settings);
      logAction("Ubah Pengaturan Portal", `Berhasil mengubah profil perusahaan menjadi ${settings.companyName}`);
    } catch (error) {
      console.warn("Failed to sync updated portal settings to Firestore (saved locally for offline use):", error);
    }
  };

  // Core App states
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem("fos_projects");
    return saved ? JSON.parse(saved) : initialProjects;
  });
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    const saved = localStorage.getItem("fos_selected_project_id");
    return saved || "proj-001";
  });

  const [rabAll, setRabAll] = useState<Record<string, RABItem[]>>(() => {
    const saved = localStorage.getItem("fos_rab_items");
    return saved ? JSON.parse(saved) : initialRABItems;
  });

  const [ganttAll, setGanttAll] = useState<Record<string, GanttTask[]>>(() => {
    const saved = localStorage.getItem("fos_gantt_tasks");
    return saved ? JSON.parse(saved) : initialGanttTasks;
  });

  const [trxAll, setTrxAll] = useState<Record<string, FinanceTransaction[]>>(() => {
    const saved = localStorage.getItem("fos_transactions");
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [poAll, setPoAll] = useState<Record<string, PurchaseOrder[]>>(() => {
    const saved = localStorage.getItem("fos_purchase_orders");
    return saved ? JSON.parse(saved) : initialPurchaseOrders;
  });

  const [invAll, setInvAll] = useState<Record<string, MaterialInventory[]>>(() => {
    const saved = localStorage.getItem("fos_inventory");
    return saved ? JSON.parse(saved) : initialInventory;
  });

  const [mutationAll, setMutationAll] = useState<Record<string, MaterialMutation[]>>(() => {
    const saved = localStorage.getItem("fos_mutations");
    return saved ? JSON.parse(saved) : {};
  });

  const [staffAll, setStaffAll] = useState<Record<string, SDMStaff[]>>(() => {
    const saved = localStorage.getItem("fos_staff");
    return saved ? JSON.parse(saved) : initialStaff;
  });

  const [attendance, setAttendance] = useState<Record<string, "Hadir" | "Sakit" | "Izin" | "Alpa">>({});

  const [qcAll, setQcAll] = useState<Record<string, QualityControlItem[]>>(() => {
    const saved = localStorage.getItem("fos_qc");
    return saved ? JSON.parse(saved) : initialQC;
  });

  const [safetyAll, setSafetyAll] = useState<Record<string, SafetyRecord[]>>(() => {
    const saved = localStorage.getItem("fos_safety");
    return saved ? JSON.parse(saved) : initialSafety;
  });

  const [docAll, setDocAll] = useState<Record<string, DocumentRecord[]>>(() => {
    const saved = localStorage.getItem("fos_documents");
    return saved ? JSON.parse(saved) : initialDocuments;
  });

  const [dailyAll, setDailyAll] = useState<Record<string, DailyReport[]>>(() => {
    const saved = localStorage.getItem("fos_daily_reports");
    return saved ? JSON.parse(saved) : initialDailyReports;
  });

  const [progressAll, setProgressAll] = useState<Record<string, ProgressReport[]>>(() => {
    const saved = localStorage.getItem("fos_progress_reports");
    if (saved) return JSON.parse(saved);
    // Seed default progress
    return {
      "proj-001": [
        { id: "pr-01", projectId: "proj-001", tanggal: "2026-05-15", itemPekerjaan: "Struktur Balok & Kolom Lantai 1", volumeRealisasi: 100, persentaseProgress: 35 },
        { id: "pr-02", projectId: "proj-001", tanggal: "2026-06-01", itemPekerjaan: "Struktur Plat & Balok Lantai 2", volumeRealisasi: 40, persentaseProgress: 10.2 }
      ]
    };
  });

  const [tasksAll, setTasksAll] = useState<Record<string, Task[]>>(() => {
    const saved = localStorage.getItem("fos_tasks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all loaded tasks have a priority field fallback
        Object.keys(parsed).forEach(key => {
          parsed[key] = parsed[key].map((t: any) => ({
            ...t,
            priority: t.priority || "Medium"
          }));
        });
        return parsed;
      } catch (e) {
        // ignore and fallback
      }
    }
    return {
      "proj-001": [
        {
          id: "task-01",
          projectId: "proj-001",
          title: "Verifikasi Mutasi Semen Portland",
          description: "Lakukan audit dan sinkronisasi stok semen pc 50kg di gudang utama logistik.",
          assignedRole: UserRole.QC_ENGINEER,
          status: "Dalam Proses",
          dueDate: "2026-06-10",
          creatorName: "Hermawan (PM)",
          creatorRole: UserRole.PROJECT_MANAGER,
          priority: "High",
          notes: "Sesuai laporan RFI #002."
        },
        {
          id: "task-02",
          projectId: "proj-001",
          title: "Persetujuan RAB Addendum Balok Utama",
          description: "Evaluasi pengajuan addendum biaya tambahan baja tulangan d22 lantai 3.",
          assignedRole: UserRole.DIREKTUR,
          status: "Belum Mulai",
          dueDate: "2026-06-08",
          creatorName: "Hermawan (PM)",
          creatorRole: UserRole.PROJECT_MANAGER,
          priority: "Medium"
        },
        {
          id: "task-03",
          projectId: "proj-001",
          title: "Induksi K3 & Evaluasi Pengaman Tepi",
          description: "Sosialisasi toolbox meeting tentang penggunaan safety harness di ketinggian > 2 meter.",
          assignedRole: UserRole.SAFETY_OFFICER,
          status: "Selesai",
          dueDate: "2026-06-06",
          creatorName: "Hermawan (PM)",
          creatorRole: UserRole.PROJECT_MANAGER,
          priority: "Low",
          notes: "Telah selesai dilakukan dengan 12 staff lapangan."
        }
      ]
    };
  });

  const [messagesAll, setMessagesAll] = useState<Record<string, DivisionalMessage[]>>(() => {
    const saved = localStorage.getItem("fos_messages");
    if (saved) return JSON.parse(saved);
    return {
      "proj-001": [
        {
          id: "msg-01",
          projectId: "proj-001",
          senderName: "Budi Santoso",
          senderRole: UserRole.PROJECT_MANAGER,
          targetRole: "Semua",
          text: "Selamat pagi semua divisi. Mohon pastikan rencana kerja harian di-submit tepat waktu melalui portal.",
          timestamp: "2026-06-06 08:00"
        },
        {
          id: "msg-02",
          projectId: "proj-001",
          senderName: "Anton Wijaya",
          senderRole: UserRole.SITE_ENGINEER,
          targetRole: UserRole.QC_ENGINEER,
          text: "Pak QC, berkas RFI #002 untuk pengecoran plat lantai 2 sudah siap divisualisasi. Mohon bantuannya.",
          timestamp: "2026-06-06 08:45"
        },
        {
          id: "msg-03",
          senderName: "Rian Hidayat",
          senderRole: UserRole.QC_ENGINEER,
          targetRole: UserRole.SITE_ENGINEER,
          projectId: "proj-001",
          text: "Siap pak, jam 10:00 saya akan laksanakan inspeksi lapangan ke lokasi pengecoran.",
          timestamp: "2026-06-06 09:12"
        }
      ]
    };
  });

  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; read: boolean; date: string }>>([
    { id: "n-1", title: "RAB Tertunda", message: "Rencana Anggaran Biaya Proyek BSD City perlu persetujuan Direktur.", read: false, date: "2026-06-06 08:30" },
    { id: "n-2", title: "Keterlambatan Progres", message: "Kurva S Proyek Foresyndo Center menunjukkan deviasi negatif -4.1%", read: false, date: "2026-06-05 17:00" },
    { id: "n-3", title: "Safety Finding", message: "Safety officer melaporkan 2 temuan K3 di area balok luar lt 2.", read: true, date: "2026-06-05 10:00" }
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("fos_dark_mode");
    return saved === "true";
  });
  const [activeCompany, setActiveCompany] = useState<string>("PT Foresyndo Group");

  // Track Firebase User Integration
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoadingAuth(true);
      if (fbUser) {
        // Look up or establish custom user profile in Firestore
        const userRef = doc(db, "users", fbUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setCurrentUser(userSnap.data() as UserProfile);
          } else {
            // New register fallback, map user email from runtime as admin/director where appropriate
            const defaultRole = fbUser.email === "payrayadev@gmail.com" ? UserRole.DIREKTUR : UserRole.PROJECT_MANAGER;
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
              email: fbUser.email || "",
              role: defaultRole,
              company: "PT Foresyndo Group"
            };
            await setDoc(userRef, newProfile);
            setCurrentUser(newProfile);
            logAction("Daftar Akun Baru", `Berhasil mendaftarkan pengguna ${newProfile.name} dengan peran ${newProfile.role}`);
          }
        } catch (e) {
          console.error("Error retrieving user document from Firestore:", e);
          // Set local fallback user
          setCurrentUser({
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split("@")[0] || "Guest",
            email: fbUser.email || "",
            role: fbUser.email === "payrayadev@gmail.com" ? UserRole.DIREKTUR : UserRole.PROJECT_MANAGER,
            company: "PT Foresyndo Group"
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper to seed Firestore if empty
  const seedDefaultDataToFirestore = async () => {
    try {
      console.log("Seeding initial data into Firestore...");
      for (const p of initialProjects) {
        const pid = p.projectId;
        await setDoc(doc(db, "projects", pid), p);

        // Seed RAB
        const rabs = initialRABItems[pid] || [];
        for (const item of rabs) {
          await setDoc(doc(db, "projects", pid, "rab", item.id), item);
        }

        // Seed Gantt Tasks
        const gtTasks = initialGanttTasks[pid] || [];
        for (const t of gtTasks) {
          await setDoc(doc(db, "projects", pid, "gantt_tasks", t.id), t);
        }

        // Seed Transactions
        const txs = initialTransactions[pid] || [];
        for (const tx of txs) {
          await setDoc(doc(db, "projects", pid, "transactions", tx.id), tx);
        }

        // Seed Purchase Orders
        const pos = initialPurchaseOrders[pid] || [];
        for (const po of pos) {
          await setDoc(doc(db, "projects", pid, "purchase_orders", po.id), po);
        }

        // Seed Inventory
        const invs = initialInventory[pid] || [];
        for (const inv of invs) {
          await setDoc(doc(db, "projects", pid, "inventory", inv.id), inv);
        }

        // Seed Staff
        const staffs = initialStaff[pid] || [];
        for (const st of staffs) {
          await setDoc(doc(db, "projects", pid, "sdm_staff", st.id), st);
        }

        // Seed QC Items
        const qcs = initialQC[pid] || [];
        for (const qc of qcs) {
          await setDoc(doc(db, "projects", pid, "quality_control", qc.id), qc);
        }

        // Seed Safety
        const safeties = initialSafety[pid] || [];
        for (const sf of safeties) {
          await setDoc(doc(db, "projects", pid, "safety_k3", sf.id), sf);
        }

        // Seed Documents
        const docsArr = initialDocuments[pid] || [];
        for (const d of docsArr) {
          await setDoc(doc(db, "projects", pid, "documents", d.id), d);
        }

        // Seed Daily Reports
        const dailies = initialDailyReports[pid] || [];
        for (const d of dailies) {
          await setDoc(doc(db, "projects", pid, "daily_reports", d.id), d);
        }

        // Seed Progress Reports
        const progresses = [
          { id: "pr-01", projectId: pid, tanggal: "2026-05-15", itemPekerjaan: "Struktur Balok & Kolom Lantai 1", volumeRealisasi: 100, persentaseProgress: 35 },
          { id: "pr-02", projectId: pid, tanggal: "2026-06-01", itemPekerjaan: "Struktur Plat & Balok Lantai 2", volumeRealisasi: 40, persentaseProgress: 10.2 }
        ];
        if (pid === "proj-001") {
          for (const pr of progresses) {
            await setDoc(doc(db, "projects", pid, "progress_reports", pr.id), pr);
          }
        }

        // Seed Tasks
        const defaultTasks = [
          {
            id: "task-01",
            projectId: pid,
            title: "Verifikasi Mutasi Semen Portland",
            description: "Lakukan audit dan sinkronisasi stok semen pc 50kg di gudang utama logistik.",
            assignedRole: UserRole.QC_ENGINEER,
            status: "Dalam Proses",
            dueDate: "2026-06-10",
            creatorName: "Hermawan (PM)",
            creatorRole: UserRole.PROJECT_MANAGER,
            priority: "High",
            notes: "Sesuai laporan RFI #002."
          },
          {
            id: "task-02",
            projectId: pid,
            title: "Persetujuan RAB Addendum Balok Utama",
            description: "Evaluasi pengajuan addendum biaya tambahan baja tulangan d22 lantai 3.",
            assignedRole: UserRole.DIREKTUR,
            status: "Belum Mulai",
            dueDate: "2026-06-08",
            creatorName: "Hermawan (PM)",
            creatorRole: UserRole.PROJECT_MANAGER,
            priority: "Medium"
          },
          {
            id: "task-03",
            projectId: pid,
            title: "Induksi K3 & Evaluasi Pengaman Tepi",
            description: "Sosialisasi toolbox meeting tentang penggunaan safety harness di ketinggian > 2 meter.",
            assignedRole: UserRole.SAFETY_OFFICER,
            status: "Selesai",
            dueDate: "2026-06-06",
            creatorName: "Hermawan (PM)",
            creatorRole: UserRole.PROJECT_MANAGER,
            priority: "Low",
            notes: "Telah selesai dilakukan dengan 12 staff lapangan."
          }
        ];
        if (pid === "proj-001") {
          for (const t of defaultTasks) {
            await setDoc(doc(db, "projects", pid, "tasks", t.id), t);
          }
        }

        // Seed divisional messages
        const defaultMessages = [
          {
            id: "msg-01",
            projectId: pid,
            senderName: "Budi Santoso",
            senderRole: UserRole.PROJECT_MANAGER,
            targetRole: "Semua",
            text: "Selamat pagi semua divisi. Mohon pastikan rencana kerja harian di-submit tepat waktu melalui portal.",
            timestamp: "2026-06-06 08:00"
          },
          {
            id: "msg-02",
            projectId: pid,
            senderName: "Anton Wijaya",
            senderRole: UserRole.SITE_ENGINEER,
            targetRole: UserRole.QC_ENGINEER,
            text: "Pak QC, berkas RFI #002 untuk pengecoran plat lantai 2 sudah siap divisualisasi. Mohon bantuannya.",
            timestamp: "2026-06-06 08:45"
          },
          {
            id: "msg-03",
            senderName: "Rian Hidayat",
            senderRole: UserRole.QC_ENGINEER,
            targetRole: UserRole.SITE_ENGINEER,
            projectId: pid,
            text: "Siap pak, jam 10:00 saya akan laksanakan inspeksi lapangan ke lokasi pengecoran.",
            timestamp: "2026-06-06 09:12"
          }
        ];
        if (pid === "proj-001") {
          for (const m of defaultMessages) {
            await setDoc(doc(db, "projects", pid, "divisional_messages", m.id), m);
          }
        }
      }
      console.log("Firestore seeding done!");
    } catch (e) {
      console.error("Failed to seed default data to Firestore:", e);
    }
  };

  // Synchronize data from Firestore on Auth Login
  useEffect(() => {
    let isMounted = true;
    const loadAllModulesFromFirestore = async () => {
      if (!currentUser) return;
      try {
        const projectsRef = collection(db, "projects");
        const projectsSnap = await getDocs(projectsRef);
        
        let dbProjects: Project[] = [];
        projectsSnap.forEach(docSnap => {
          dbProjects.push(docSnap.data() as Project);
        });

        if (dbProjects.length === 0) {
          await seedDefaultDataToFirestore();
          if (isMounted) {
            setProjects(initialProjects);
            setRabAll(initialRABItems);
            setGanttAll(initialGanttTasks);
            setTrxAll(initialTransactions);
            setPoAll(initialPurchaseOrders);
            setInvAll(initialInventory);
            setStaffAll(initialStaff);
            setQcAll(initialQC);
            setSafetyAll(initialSafety);
            setDocAll(initialDocuments);
            setDailyAll(initialDailyReports);
          }
          return;
        }

        const loadedProjects = dbProjects;
        const rabTemp: Record<string, RABItem[]> = {};
        const ganttTemp: Record<string, GanttTask[]> = {};
        const trxTemp: Record<string, FinanceTransaction[]> = {};
        const poTemp: Record<string, PurchaseOrder[]> = {};
        const invTemp: Record<string, MaterialInventory[]> = {};
        const mutationTemp: Record<string, MaterialMutation[]> = {};
        const staffTemp: Record<string, SDMStaff[]> = {};
        const qcTemp: Record<string, QualityControlItem[]> = {};
        const safetyTemp: Record<string, SafetyRecord[]> = {};
        const docTemp: Record<string, DocumentRecord[]> = {};
        const dailyTemp: Record<string, DailyReport[]> = {};
        const progressTemp: Record<string, ProgressReport[]> = {};
        const tasksTemp: Record<string, Task[]> = {};
        const messagesTemp: Record<string, DivisionalMessage[]> = {};

        await Promise.all(loadedProjects.map(async (project) => {
          const pid = project.projectId;
          
          try {
            const subSnap = await getDocs(collection(db, "projects", pid, "rab"));
            rabTemp[pid] = [];
            subSnap.forEach(s => rabTemp[pid].push(s.data() as RABItem));
          } catch(e) { console.warn("Load error on RAB for project", pid, e); }

          try {
            const subSnap = await getDocs(collection(db, "projects", pid, "gantt_tasks"));
            ganttTemp[pid] = [];
            subSnap.forEach(s => ganttTemp[pid].push(s.data() as GanttTask));
          } catch(e) { console.warn("Load error on Gantt Tasks for project", pid, e); }

          try {
            const subSnap = await getDocs(collection(db, "projects", pid, "transactions"));
            trxTemp[pid] = [];
            subSnap.forEach(s => trxTemp[pid].push(s.data() as FinanceTransaction));
          } catch(e) { console.warn("Load error on Transactions for project", pid, e); }

          try {
            const subSnap = await getDocs(collection(db, "projects", pid, "purchase_orders"));
            poTemp[pid] = [];
            subSnap.forEach(s => poTemp[pid].push(s.data() as PurchaseOrder));
          } catch(e) { console.warn("Load error on Purchase Orders for project", pid, e); }

          try {
            const subSnap = await getDocs(collection(db, "projects", pid, "inventory"));
            invTemp[pid] = [];
            subSnap.forEach(s => invTemp[pid].push(s.data() as MaterialInventory));
          } catch(e) { console.warn("Load error on Inventory for project", pid, e); }

          try {
            const subSnap = await getDocs(collection(db, "projects", pid, "mutations"));
            mutationTemp[pid] = [];
            subSnap.forEach(s => mutationTemp[pid].push(s.data() as MaterialMutation));
          } catch(e) { console.warn("Load error on Mutations for project", pid, e); }

          try {
            const subSnap = await getDocs(collection(db, "projects", pid, "sdm_staff"));
            staffTemp[pid] = [];
            subSnap.forEach(s => staffTemp[pid].push(s.data() as SDMStaff));
          } catch(e) { console.warn("Load error on SDM Staff for project", pid, e); }

          try {
            const subSnap = await getDocs(collection(db, "projects", pid, "quality_control"));
            qcTemp[pid] = [];
            subSnap.forEach(s => qcTemp[pid].push(s.data() as QualityControlItem));
          } catch(e) { console.warn("Load error on Quality Control for project", pid, e); }

          try {
            const subSnap = await getDocs(collection(db, "projects", pid, "safety_k3"));
            safetyTemp[pid] = [];
            subSnap.forEach(s => safetyTemp[pid].push(s.data() as SafetyRecord));
          } catch(e) { console.warn("Load error on Safety for project", pid, e); }

          try {
            const subSnap = await getDocs(collection(db, "projects", pid, "documents"));
            docTemp[pid] = [];
            subSnap.forEach(s => docTemp[pid].push(s.data() as DocumentRecord));
          } catch(e) { console.warn("Load error on Documents for project", pid, e); }

          try {
            const subSnap = await getDocs(collection(db, "projects", pid, "daily_reports"));
            dailyTemp[pid] = [];
            subSnap.forEach(s => dailyTemp[pid].push(s.data() as DailyReport));
          } catch(e) { console.warn("Load error on Daily Reports for project", pid, e); }

          try {
            const subSnap = await getDocs(collection(db, "projects", pid, "progress_reports"));
            progressTemp[pid] = [];
            subSnap.forEach(s => progressTemp[pid].push(s.data() as ProgressReport));
          } catch(e) { console.warn("Load error on Progress Reports for project", pid, e); }

          try {
            const subSnap = await getDocs(collection(db, "projects", pid, "tasks"));
            tasksTemp[pid] = [];
            subSnap.forEach(s => tasksTemp[pid].push(s.data() as Task));
          } catch(e) { console.warn("Load error on Tasks for project", pid, e); }

          try {
            const subSnap = await getDocs(collection(db, "projects", pid, "divisional_messages"));
            messagesTemp[pid] = [];
            subSnap.forEach(s => messagesTemp[pid].push(s.data() as DivisionalMessage));
          } catch(e) { console.warn("Load error on Divisional Messages for project", pid, e); }
        }));

        if (isMounted) {
          setProjects(loadedProjects);
          setRabAll(rabTemp);
          setGanttAll(ganttTemp);
          setTrxAll(trxTemp);
          setPoAll(poTemp);
          setInvAll(invTemp);
          setMutationAll(mutationTemp);
          setStaffAll(staffTemp);
          setQcAll(qcTemp);
          setSafetyAll(safetyTemp);
          setDocAll(docTemp);
          setDailyAll(dailyTemp);
          setProgressAll(progressTemp);
          setTasksAll(tasksTemp);
          setMessagesAll(messagesTemp);
        }
      } catch (err) {
        console.warn("Firestore data load error, running with offline synchronization fallback:", err);
      }
    };

    loadAllModulesFromFirestore();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Save to localStorage on state changes
  useEffect(() => {
    localStorage.setItem("fos_projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("fos_selected_project_id", selectedProjectId);
  }, [selectedProjectId]);

  useEffect(() => {
    localStorage.setItem("fos_rab_items", JSON.stringify(rabAll));
  }, [rabAll]);

  useEffect(() => {
    localStorage.setItem("fos_gantt_tasks", JSON.stringify(ganttAll));
  }, [ganttAll]);

  useEffect(() => {
    localStorage.setItem("fos_transactions", JSON.stringify(trxAll));
  }, [trxAll]);

  useEffect(() => {
    localStorage.setItem("fos_purchase_orders", JSON.stringify(poAll));
  }, [poAll]);

  useEffect(() => {
    localStorage.setItem("fos_inventory", JSON.stringify(invAll));
  }, [invAll]);

  useEffect(() => {
    localStorage.setItem("fos_mutations", JSON.stringify(mutationAll));
  }, [mutationAll]);

  useEffect(() => {
    localStorage.setItem("fos_staff", JSON.stringify(staffAll));
  }, [staffAll]);

  useEffect(() => {
    localStorage.setItem("fos_qc", JSON.stringify(qcAll));
  }, [qcAll]);

  useEffect(() => {
    localStorage.setItem("fos_safety", JSON.stringify(safetyAll));
  }, [safetyAll]);

  useEffect(() => {
    localStorage.setItem("fos_documents", JSON.stringify(docAll));
  }, [docAll]);

  useEffect(() => {
    localStorage.setItem("fos_daily_reports", JSON.stringify(dailyAll));
  }, [dailyAll]);

  useEffect(() => {
    localStorage.setItem("fos_progress_reports", JSON.stringify(progressAll));
  }, [progressAll]);

  useEffect(() => {
    localStorage.setItem("fos_tasks", JSON.stringify(tasksAll));
  }, [tasksAll]);

  useEffect(() => {
    localStorage.setItem("fos_messages", JSON.stringify(messagesAll));
  }, [messagesAll]);

  useEffect(() => {
    localStorage.setItem("fos_dark_mode", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Auth Operations
  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      console.error("Gagal Google Login: ", e);
      setAuthError({
        code: e.code || "auth/unknown",
        message: e.message || "Gagal masuk menggunakan Google",
        hostname: window.location.hostname
      });
    }
  };

  const signInWithBypass = (role: UserRole, name: string) => {
    const fakeUid = "bypass-" + Math.random().toString(36).substr(2, 9);
    const userProfile: UserProfile = {
      uid: fakeUid,
      name: name || "Demo User",
      email: `${(name || "demo").toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`,
      role: role,
      company: "PT Foresyndo Group"
    };
    setCurrentUser(userProfile);
    setAuthError(null);
    logAction("Login Bypass Pengembang", `Masuk sebagai ${role} dengan nama ${userProfile.name}`);
  };

  const logOut = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (e) {
      console.error("Gagal Logout: ", e);
    }
  };

  // Helper selectors
  const activeProjId = selectedProjectId;
  const selectedProject = projects.find(p => p.projectId === activeProjId) || projects[0] || null;
  const rabItems = rabAll[activeProjId] || [];
  const ganttTasks = ganttAll[activeProjId] || [];
  const transactions = trxAll[activeProjId] || [];
  const purchaseOrders = poAll[activeProjId] || [];
  const inventory = invAll[activeProjId] || [];
  const mutations = mutationAll[activeProjId] || [];
  const staff = staffAll[activeProjId] || [];
  const qcItems = qcAll[activeProjId] || [];
  const safetyRecords = safetyAll[activeProjId] || [];
  const documents = docAll[activeProjId] || [];
  const dailyReports = dailyAll[activeProjId] || [];
  const progressReports = progressAll[activeProjId] || [];
  const tasks = tasksAll[activeProjId] || [];
  const messages = messagesAll[activeProjId] || [];

  const logAction = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser?.uid || "system",
      userName: currentUser?.name || "Offline User",
      action,
      details,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const switchProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    logAction("Switch Project", `Berpindah melihat proyek ID: ${projectId}`);
  };

  // State Mutating Functions (with automated mock & syncing to Firestore when logged in)
  const addProject = async (p: Omit<Project, "projectId" | "progress">) => {
    const id = "proj-" + Math.random().toString(36).substr(2, 9);
    const newPr: Project = { ...p, projectId: id, progress: 0 };
    
    // Save locally
    setProjects(prev => [...prev, newPr]);

    // Save online if authenticated
    if (currentUser) {
      try {
        await setDoc(doc(db, "projects", id), newPr);
      } catch (e) {
        console.error("Firestore sync error on add project:", e);
      }
    }

    logAction("Tambah Proyek Baru", `Membuat proyek ${p.namaProyek} dengan nilai kontrak ${p.nilaiKontrak}`);
  };

  const updateProject = async (p: Project) => {
    setProjects(prev => prev.map(item => item.projectId === p.projectId ? p : item));

    if (currentUser) {
      try {
        await setDoc(doc(db, "projects", p.projectId), p);
      } catch (e) {
        console.error("Firestore sync error on update project:", e);
      }
    }
    logAction("Update Proyek", `Memperbarui detail proyek ${p.namaProyek}`);
  };

  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.projectId !== id));
    logAction("Hapus Proyek", `Menghapus proyek ID: ${id}`);
    if (currentUser) {
      try {
        await deleteDoc(doc(db, "projects", id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `projects/${id}`);
      }
    }
  };

  // RAB Items
  const addRABItem = async (item: Omit<RABItem, "id" | "projectId">) => {
    const id = "rab-" + Math.random().toString(36).substr(2, 9);
    const newIt: RABItem = { ...item, id, projectId: activeProjId };
    
    setRabAll(prev => {
      const currentList = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [...currentList, newIt] };
    });
    logAction("Tambah RAB", `Menambahkan item RAB ${item.uraianPekerjaan}`);
    if (currentUser) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "rab", id), newIt);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/rab/${id}`);
      }
    }
  };

  const deleteRABItem = async (id: string) => {
    setRabAll(prev => {
      const currentList = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: currentList.filter(it => it.id !== id) };
    });
    logAction("Hapus RAB", `Menghapus item RAB ID: ${id}`);
    if (currentUser) {
      try {
        await deleteDoc(doc(db, "projects", activeProjId, "rab", id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `projects/${activeProjId}/rab/${id}`);
      }
    }
  };

  // Gantt Chart Tasks
  const addGanttTask = async (task: Omit<GanttTask, "id" | "projectId">) => {
    const id = "gt-" + Math.random().toString(36).substr(2, 9);
    const newTask: GanttTask = { ...task, id, projectId: activeProjId };

    setGanttAll(prev => {
      const currentList = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [...currentList, newTask] };
    });
    logAction("Tambah Jadwal Pekerjaan", `Menambahkan jadwal ${task.name}`);
    if (currentUser) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "gantt_tasks", id), newTask);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/gantt_tasks/${id}`);
      }
    }
  };

  const updateGanttTask = async (task: GanttTask) => {
    setGanttAll(prev => {
      const currentList = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: currentList.map(item => item.id === task.id ? task : item) };
    });
    logAction("Update Jadwal Pekerjaan", `Memperbarui jadwal & penanggung jawab ${task.name}`);
    if (currentUser) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "gantt_tasks", task.id), task);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/gantt_tasks/${task.id}`);
      }
    }
  };

  const deleteGanttTask = async (id: string) => {
    setGanttAll(prev => {
      const currentList = prev[activeProjId] || [];
      const itemToDelete = currentList.find(it => it.id === id);
      const name = itemToDelete ? itemToDelete.name : id;
      logAction("Hapus Jadwal Pekerjaan", `Menghapus jadwal ${name}`);
      return { ...prev, [activeProjId]: currentList.filter(it => it.id !== id) };
    });
    if (currentUser) {
      try {
        await deleteDoc(doc(db, "projects", activeProjId, "gantt_tasks", id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `projects/${activeProjId}/gantt_tasks/${id}`);
      }
    }
  };

  // Transactions
  const addTransaction = async (tx: Omit<FinanceTransaction, "id" | "projectId">) => {
    const id = "tr-" + Math.random().toString(36).substr(2, 9);
    const newTx: FinanceTransaction = { ...tx, id, projectId: activeProjId };

    setTrxAll(prev => {
      const currentList = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [newTx, ...currentList] };
    });
    logAction("Tambah Transaksi Keuangan", `Menambahkan kas dari kategori ${tx.category} senilai Rp ${tx.amount}`);
    if (currentUser) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "transactions", id), newTx);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/transactions/${id}`);
      }
    }
  };

  const approveTransaction = async (id: string) => {
    const txToApprove = transactions.find(t => t.id === id);
    setTrxAll(prev => {
      const currentList = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: currentList.map(tx => tx.id === id ? { ...tx, status: "Approved" } : tx) };
    });
    logAction("Persetujuan Transaksi", `Menyetujui transaksi ID: ${id}`);
    if (currentUser && txToApprove) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "transactions", id), { ...txToApprove, status: "Approved" });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/transactions/${id}`);
      }
    }
  };

  // Purchase Order
  const addPurchaseOrder = async (po: Omit<PurchaseOrder, "id" | "projectId">) => {
    const id = "po-" + Math.random().toString(36).substr(2, 9);
    const newPo: PurchaseOrder = { ...po, id, projectId: activeProjId };

    setPoAll(prev => {
      const currentList = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [...currentList, newPo] };
    });
    logAction("Tambah PO", `Membuat Purchase Order baru untuk supplier ${po.supplier}`);
    if (currentUser) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "purchase_orders", id), newPo);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/purchase_orders/${id}`);
      }
    }
  };

  const updatePOStatus = async (id: string, status: "Draft" | "Approved" | "Ordered" | "Delivered") => {
    const targetPO = purchaseOrders.find(p => p.id === id);

    setPoAll(prev => {
      const currentList = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: currentList.map(item => item.id === id ? { ...item, status } : item) };
    });
    logAction("Update Status PO", `Mengubah status PO ${id} menjadi ${status}`);

    if (currentUser && targetPO) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "purchase_orders", id), { ...targetPO, status });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/purchase_orders/${id}`);
      }
    }
    
    // Notify when PO transitions from Draft to Approved by Direksi
    if (targetPO && targetPO.status === "Draft" && status === "Approved") {
      setNotifications(prev => [
        {
          id: `po-approved-${id}-${Date.now()}`,
          title: "PO Baru Disetujui Direksi",
          message: `Purchase Order ${targetPO.nomorPO} (${targetPO.material}, Qty: ${targetPO.qty}) telah disetujui oleh Direksi. Surat pesanan resmi dengan digital barcode siap diunduh!`,
          read: false,
          date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...prev
      ]);
    }

    // Auto add to inventory if Delivered
    if (status === "Delivered") {
      if (targetPO) {
        await adjustInventory(targetPO.material, targetPO.qty);
      }
    }
  };

  // Inventory & mutations
  const adjustInventory = async (materialName: string, amount: number) => {
    let updatedItem: MaterialInventory | null = null;
    setInvAll(prev => {
      const list = prev[activeProjId] || [];
      const exists = list.some(i => i.materialName.toLowerCase() === materialName.toLowerCase());
      if (exists) {
        const newList = list.map(item => {
          if (item.materialName.toLowerCase() === materialName.toLowerCase()) {
            updatedItem = { ...item, currentStock: item.currentStock + amount, lastUpdated: new Date().toISOString().split("T")[0] };
            return updatedItem;
          }
          return item;
        });
        return { ...prev, [activeProjId]: newList };
      } else {
        const id = "inv-" + Math.random().toString(36).substr(2, 9);
        updatedItem = {
          id,
          projectId: activeProjId,
          materialName,
          currentStock: amount,
          minStock: 10,
          unit: "Pcs",
          lastUpdated: new Date().toISOString().split("T")[0]
        };
        return { ...prev, [activeProjId]: [...list, updatedItem] };
      }
    });

    if (currentUser && updatedItem) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "inventory", (updatedItem as MaterialInventory).id), updatedItem);
      } catch (e) {
        console.error(e);
      }
    }

    // Notify if low stock
    const invItem = inventory.find(i => i.materialName.toLowerCase() === materialName.toLowerCase());
    if (invItem && (invItem.currentStock + amount) < invItem.minStock) {
      setNotifications(prev => [
        {
          id: Math.random().toString(),
          title: "Peringatan Stok Minimum",
          message: `Stok material ${materialName} saat ini di bawah batas minimum (${invItem.currentStock + amount} ${invItem.unit})!`,
          read: false,
          date: new Date().toLocaleString()
        },
        ...prev
      ]);
    }
  };

  const addMaterialMutation = async (mut: Omit<MaterialMutation, "id" | "projectId">) => {
    const id = "mut-" + Math.random().toString(36).substr(2, 9);
    const newMut: MaterialMutation = { ...mut, id, projectId: activeProjId };

    setMutationAll(prev => {
      const currentList = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [newMut, ...currentList] };
    });

    // Substract or Add Stock
    const factor = mut.type === "masuk" ? mut.qty : -mut.qty;
    await adjustInventory(mut.materialName, factor);

    logAction("Mutasi Material", `Mutasi ${mut.type} baha: ${mut.materialName} qty: ${mut.qty}`);

    if (currentUser) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "mutations", id), newMut);
      } catch(e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/mutations/${id}`);
      }
    }
  };

  const addInventoryItem = async (item: Omit<MaterialInventory, "id" | "projectId" | "lastUpdated">) => {
    const id = "inv-" + Math.random().toString(36).substr(2, 9);
    const newItem: MaterialInventory = {
      ...item,
      id,
      projectId: activeProjId,
      lastUpdated: new Date().toISOString().split("T")[0]
    };
    setInvAll(prev => {
      const list = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [...list, newItem] };
    });
    logAction("Tambah Material", `Menambahkan material baru: ${item.materialName}`);
    if (currentUser) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "inventory", id), newItem);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/inventory/${id}`);
      }
    }
  };

  const updateInventoryItem = async (updated: MaterialInventory) => {
    const nextItem = { ...updated, lastUpdated: new Date().toISOString().split("T")[0] };
    setInvAll(prev => {
      const list = prev[activeProjId] || [];
      return {
        ...prev,
        [activeProjId]: list.map(item => item.id === updated.id ? nextItem : item)
      };
    });
    logAction("Edit Material", `Memperbarui detail material: ${updated.materialName}`);
    if (currentUser) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "inventory", updated.id), nextItem);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/inventory/${updated.id}`);
      }
    }
  };

  const deleteInventoryItem = async (id: string) => {
    setInvAll(prev => {
      const list = prev[activeProjId] || [];
      return {
        ...prev,
        [activeProjId]: list.filter(item => item.id !== id)
      };
    });
    logAction("Hapus Material", `Menghapus material ID: ${id}`);
    if (currentUser) {
      try {
        await deleteDoc(doc(db, "projects", activeProjId, "inventory", id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `projects/${activeProjId}/inventory/${id}`);
      }
    }
  };

  // SDM
  const addSDMStaff = async (st: Omit<SDMStaff, "id" | "projectId">) => {
    const id = "st-" + Math.random().toString(36).substr(2, 9);
    const newSt: SDMStaff = { ...st, id, projectId: activeProjId };

    setStaffAll(prev => {
      const list = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [...list, newSt] };
    });
    logAction("Tambah SDM", `Mendaftarkan tenaga kerja baru ${st.name}`);
    if (currentUser) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "sdm_staff", id), newSt);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/sdm_staff/${id}`);
      }
    }
  };

  const toggleAttendance = async (staffId: string) => {
    const targetStaff = staff.find(s => s.id === staffId);
    setStaffAll(prev => {
      const list = prev[activeProjId] || [];
      return {
        ...prev,
        [activeProjId]: list.map(item => item.id === staffId ? { ...item, attendanceToday: !item.attendanceToday } : item)
      };
    });
    logAction("Ubah Absensi", `Mengubah status absensi harian staff ${staffId}`);
    if (currentUser && targetStaff) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "sdm_staff", staffId), { ...targetStaff, attendanceToday: !targetStaff.attendanceToday });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/sdm_staff/${staffId}`);
      }
    }
  };

  // Quality Control
  const addQCItem = async (qc: Omit<QualityControlItem, "id" | "projectId">) => {
    const id = "qc-" + Math.random().toString(36).substr(2, 9);
    const newQc: QualityControlItem = { ...qc, id, projectId: activeProjId };

    setQcAll(prev => {
      const list = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [...list, newQc] };
    });
    logAction("Tambah Item QC", `Membuat kontrol QC baru: ${qc.checklistName}`);
    if (currentUser) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "quality_control", id), newQc);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/quality_control/${id}`);
      }
    }
  };

  const updateQCStatus = async (id: string, status: "Open" | "Progress" | "Closed") => {
    const targetQC = qcItems.find(q => q.id === id);
    setQcAll(prev => {
      const list = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: list.map(item => item.id === id ? { ...item, status } : item) };
    });
    logAction("Ubah Status QC", `Mengubah status QC ${id} menjadi ${status}`);
    if (currentUser && targetQC) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "quality_control", id), { ...targetQC, status });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/quality_control/${id}`);
      }
    }
  };

  // Safety Records
  const addSafetyRecord = async (saf: Omit<SafetyRecord, "id" | "projectId">) => {
    const id = "sf-" + Math.random().toString(36).substr(2, 9);
    const newSf: SafetyRecord = { ...saf, id, projectId: activeProjId };

    setSafetyAll(prev => {
      const list = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [...list, newSf] };
    });
    logAction("Tambah Safety Patrol/Event", `Menginput record K3: ${saf.type}`);
    if (currentUser) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "safety_k3", id), newSf);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/safety_k3/${id}`);
      }
    }
  };

  // Documents
  const addDocument = async (document: Omit<DocumentRecord, "id" | "projectId" | "createdAt">) => {
    const id = "doc-" + Math.random().toString(36).substr(2, 9);
    const initialHist = document.category === "RFI" ? [{
      id: "hist-" + Math.random().toString(36).substr(2, 9),
      status: "Pending Approval" as const,
      changedBy: currentUser?.name || "Offline User",
      changedByRole: currentUser?.role || "Site Engineer",
      timestamp: new Date().toISOString().replace('T', ' ').substr(0, 16),
      note: "Dokumen RFI diarsipkan dan menunggu persetujuan progres"
    }] : [];

    const newDocObj: DocumentRecord = { 
      ...document, 
      id, 
      projectId: activeProjId, 
      createdAt: new Date().toISOString().split("T")[0],
      comments: [],
      statusHistory: initialHist
    };

    setDocAll(prev => {
      const list = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [...list, newDocObj] };
    });
    logAction("Upload Dokumen", `Mengirim dokumen arsitektural/sipil: ${document.name}`);
    if (currentUser) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "documents", id), newDocObj);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/documents/${id}`);
      }
    }
  };

  const approveDocument = async (id: string, approved: boolean) => {
    const statusVal = approved ? "Approved" : "Rejected";
    const changedBy = currentUser?.name || "Offline User";
    const changedByRole = currentUser?.role || "Site Engineer";
    
    let updatedDocObj: DocumentRecord | null = null;
    setDocAll(prev => {
      const list = prev[activeProjId] || [];
      const newList = list.map(item => {
        if (item.id === id) {
          const histItem: RFIStatusHistory = {
            id: "hist-" + Math.random().toString(36).substr(2, 9),
            status: statusVal,
            changedBy,
            changedByRole,
            timestamp: new Date().toISOString().replace('T', ' ').substr(0, 16),
            note: `Dokumen ${approved ? "disetujui" : "ditolak"} oleh ${changedBy}`
          };
          const historyArray = item.statusHistory || [];
          updatedDocObj = { 
            ...item, 
            status: statusVal,
            statusHistory: item.category === "RFI" ? [...historyArray, histItem] : historyArray
          };
          return updatedDocObj;
        }
        return item;
      });
      return { 
        ...prev, 
        [activeProjId]: newList 
      };
    });
    logAction("Approval Dokumen", `Memproses persetujuan dokumen ${id} -> ${approved ? "Disetujui" : "Ditolak"}`);
    if (currentUser && updatedDocObj) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "documents", id), updatedDocObj);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/documents/${id}`);
      }
    }
  };

  const addRFIComment = async (docId: string, commentText: string) => {
    const authorName = currentUser?.name || "Offline User";
    const authorRole = currentUser?.role || "Site Engineer";
    const newComment = {
      id: "comment-" + Math.random().toString(36).substr(2, 9),
      authorName,
      authorRole,
      text: commentText,
      timestamp: new Date().toISOString().replace('T', ' ').substr(0, 16)
    };

    let updatedDocObj: DocumentRecord | null = null;
    setDocAll(prev => {
      const list = prev[activeProjId] || [];
      const newList = list.map(docItem => {
        if (docItem.id === docId) {
          const commentsArray = docItem.comments || [];
          updatedDocObj = {
            ...docItem,
            comments: [...commentsArray, newComment]
          };
          return updatedDocObj;
        }
        return docItem;
      });
      return {
        ...prev,
        [activeProjId]: newList
      };
    });
    logAction("Diskusi RFI", `Menambahkan komentar di RFI ID: ${docId}`);
    if (currentUser && updatedDocObj) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "documents", docId), updatedDocObj);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/documents/${docId}`);
      }
    }
  };

  const updateRFIStatus = async (docId: string, status: "Draft" | "Approved" | "Rejected" | "Pending Approval", note?: string) => {
    const changedBy = currentUser?.name || "Offline User";
    const changedByRole = currentUser?.role || "Site Engineer";
    const newHistory: RFIStatusHistory = {
      id: "hist-" + Math.random().toString(36).substr(2, 9),
      status,
      changedBy,
      changedByRole,
      timestamp: new Date().toISOString().replace('T', ' ').substr(0, 16),
      note: note || `Mengubah status dokumen RFI menjadi ${status}`
    };

    let updatedDocObj: DocumentRecord | null = null;
    setDocAll(prev => {
      const list = prev[activeProjId] || [];
      const newList = list.map(docItem => {
        if (docItem.id === docId) {
          const historyArray = docItem.statusHistory || [];
          updatedDocObj = {
            ...docItem,
            status,
            statusHistory: [...historyArray, newHistory]
          };
          return updatedDocObj;
        }
        return docItem;
      });
      return {
        ...prev,
        [activeProjId]: newList
      };
    });
    logAction("Status RFI", `Mengubah status RFI ID: ${docId} menjadi ${status}`);
    if (currentUser && updatedDocObj) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "documents", docId), updatedDocObj);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/documents/${docId}`);
      }
    }
  };

  // Daily Reports
  const addDailyReport = async (rep: Omit<DailyReport, "id" | "projectId">) => {
    const id = "dr-" + Math.random().toString(36).substr(2, 9);
    const newRep: DailyReport = { ...rep, id, projectId: activeProjId };

    setDailyAll(prev => {
      const list = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [newRep, ...list] };
    });
    logAction("Tambah Laporan Harian", `Menginput progres laporan harian tanggal ${rep.date}`);
    if (currentUser) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "daily_reports", id), newRep);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/daily_reports/${id}`);
      }
    }
  };

  // Progress Reports
  const addProgressReport = async (pr: Omit<ProgressReport, "id" | "projectId">) => {
    const id = "pr-" + Math.random().toString(36).substr(2, 9);
    const newPr: ProgressReport = { ...pr, id, projectId: activeProjId };

    setProgressAll(prev => {
      const list = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [...list, newPr] };
    });

    // Auto adjust parent project progress
    if (selectedProject) {
      const maxNewProgress = Math.min(100, selectedProject.progress + pr.persentaseProgress);
      await updateProject({
        ...selectedProject,
        progress: parseFloat(maxNewProgress.toFixed(1))
      });
    }

    logAction("Tambah Progress Fisik", `Pekerjaan ${pr.itemPekerjaan} menyumbang progres ${pr.persentaseProgress}%`);
    if (currentUser) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "progress_reports", id), newPr);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/progress_reports/${id}`);
      }
    }
  };

  const addTask = async (task: Omit<Task, "id" | "projectId" | "creatorName" | "creatorRole">) => {
    const id = "task-" + Math.random().toString(36).substr(2, 9);
    const newTask: Task = { 
      ...task, 
      id, 
      projectId: activeProjId,
      creatorName: currentUser?.name || "Offline User",
      creatorRole: currentUser?.role || UserRole.ADMIN
    };

    setTasksAll(prev => {
      const list = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [newTask, ...list] };
    });
    logAction("Tambah Tugas", `Membuat tugas baru: ${task.title} untuk divisi ${task.assignedRole}`);
    if (currentUser) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "tasks", id), newTask);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/tasks/${id}`);
      }
    }
  };

  const updateTaskStatus = async (id: string, status: Task["status"], notes?: string) => {
    const targetTask = tasks.find(t => t.id === id);
    setTasksAll(prev => {
      const list = prev[activeProjId] || [];
      return { 
        ...prev, 
        [activeProjId]: list.map(item => item.id === id ? { ...item, status, notes: notes !== undefined ? notes : item.notes } : item) 
      };
    });
    logAction("Ubah Status Tugas", `Mengubah status tugas ID: ${id} menjadi ${status}`);
    if (currentUser && targetTask) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "tasks", id), { ...targetTask, status, notes: notes !== undefined ? notes : targetTask.notes });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/tasks/${id}`);
      }
    }
  };

  const deleteTask = async (id: string) => {
    setTasksAll(prev => {
      const list = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: list.filter(item => item.id !== id) };
    });
    logAction("Hapus Tugas", `Menghapus tugas ID: ${id}`);
    if (currentUser) {
      try {
        await deleteDoc(doc(db, "projects", activeProjId, "tasks", id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `projects/${activeProjId}/tasks/${id}`);
      }
    }
  };

  const addSubTask = async (taskId: string, title: string, assignedToName: string, role: UserRole) => {
    const id = "subtask-" + Math.random().toString(36).substr(2, 9);
    const newSubTask = {
      id,
      title,
      assignedToName,
      role,
      isCompleted: false
    };

    let updatedTaskObj: Task | null = null;
    setTasksAll(prev => {
      const list = prev[activeProjId] || [];
      const newList = list.map(task => {
        if (task.id === taskId) {
          const subTasks = task.subTasks || [];
          updatedTaskObj = { ...task, subTasks: [...subTasks, newSubTask] };
          return updatedTaskObj;
        }
        return task;
      });
      return {
        ...prev,
        [activeProjId]: newList
      };
    });
    logAction("Tambah Sub-Tugas", `Menambahkan sub-tugas "${title}" ke tugas ID: ${taskId}`);
    if (currentUser && updatedTaskObj) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "tasks", taskId), updatedTaskObj);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/tasks/${taskId}`);
      }
    }
  };

  const toggleSubTask = async (taskId: string, subTaskId: string) => {
    let updatedTaskObj: Task | null = null;
    setTasksAll(prev => {
      const list = prev[activeProjId] || [];
      const newList = list.map(task => {
        if (task.id === taskId) {
          const subTasks = task.subTasks || [];
          const updatedSubTasks = subTasks.map(st => {
            if (st.id === subTaskId) {
              return { ...st, isCompleted: !st.isCompleted };
            }
            return st;
          });
          updatedTaskObj = { ...task, subTasks: updatedSubTasks };
          return updatedTaskObj;
        }
        return task;
      });
      return {
        ...prev,
        [activeProjId]: newList
      };
    });
    logAction("Toggle Sub-Tugas", `Mengubah status penyelesaian sub-tugas ID: ${subTaskId}`);
    if (currentUser && updatedTaskObj) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "tasks", taskId), updatedTaskObj);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/tasks/${taskId}`);
      }
    }
  };

  const deleteSubTask = async (taskId: string, subTaskId: string) => {
    let updatedTaskObj: Task | null = null;
    setTasksAll(prev => {
      const list = prev[activeProjId] || [];
      const newList = list.map(task => {
        if (task.id === taskId) {
          const subTasks = task.subTasks || [];
          updatedTaskObj = {
            ...task,
            subTasks: subTasks.filter(st => st.id !== subTaskId)
          };
          return updatedTaskObj;
        }
        return task;
      });
      return {
        ...prev,
        [activeProjId]: newList
      };
    });
    logAction("Hapus Sub-Tugas", `Menghapus sub-tugas ID: ${subTaskId} dari tugas ID: ${taskId}`);
    if (currentUser && updatedTaskObj) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "tasks", taskId), updatedTaskObj);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/tasks/${taskId}`);
      }
    }
  };

  const addDivisionalMessage = async (targetRole: UserRole | "Semua", text: string) => {
    const id = "msg-" + Math.random().toString(36).substr(2, 9);
    const newMsg: DivisionalMessage = {
      id,
      projectId: activeProjId,
      senderName: currentUser?.name || "Anonymous",
      senderRole: currentUser?.role || UserRole.SITE_ENGINEER,
      targetRole,
      text,
      timestamp: new Date().toLocaleDateString("id-ID") + " " + new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })
    };

    setMessagesAll(prev => {
      const list = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [...list, newMsg] };
    });
    logAction("Komunikasi Divisi", `Mengirim pesan komunikasi divisi untuk target ${targetRole}`);
    if (currentUser) {
      try {
        await setDoc(doc(db, "projects", activeProjId, "divisional_messages", id), newMsg);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `projects/${activeProjId}/divisional_messages/${id}`);
      }
    }
  };

  // Server-Side AI Assistant trigger
  const runAIAnalysis = async (
    type: "delay_analysis" | "cashflow_prediction" | "risk_assessment" | "minutes_generator" | "report_generator",
    extraPayload?: any
  ): Promise<{ text: string; isMocked: boolean; message?: string }> => {
    try {
      let payloadForAI: any = {};
      
      // Structure the specific payload according to AI assistant requirements
      if (type === "delay_analysis") {
        payloadForAI = {
          project: selectedProject,
          schedule: ganttTasks,
          delayedTasks: ganttTasks.filter(t => t.status === "delayed"),
          factors: {
            weatherRecords: dailyReports.map(r => r.weather),
            unfulfilledInventory: inventory.filter(i => i.currentStock < i.minStock)
          }
        };
      } else if (type === "cashflow_prediction") {
        payloadForAI = {
          project: selectedProject,
          budgetRAB: rabItems.reduce((acc, it) => acc + it.total, 0),
          cashIn: transactions.filter(t => t.type === "cash_in"),
          cashOut: transactions.filter(t => t.type === "cash_out"),
          terminStatus: {
            activeTermin: selectedProject?.activeTermin,
            unpaid: selectedProject?.unpaidInvoices
          }
        };
      } else if (type === "risk_assessment") {
        payloadForAI = {
          categories: ["Sipil", "MEP", "Pondasi", "Arsitektur"],
          externalFactors: {
            lokasi: selectedProject?.lokasi,
            kontraktor: selectedProject?.kontraktor
          },
          sdmSummary: {
            totalStaff: staff.length,
            mandorCount: staff.filter(s => s.role === "Mandor").length
          },
          safetyFindings: safetyRecords
        };
      } else {
        // Universal defaults
        payloadForAI = {
          project: selectedProject,
          notes: extraPayload?.notes || ["Evaluasi plat balok lantai 2", "Kekurangan stok semen"],
          topic: extraPayload?.topic || "Koordinasi Mingguan",
          decisions: extraPayload?.decisions || ["Mulai lembur 2 jam/hari"],
          actionItems: extraPayload?.actionItems || ["Revisi Plumbing design"],
          progress: selectedProject?.progress,
          deviation: -4.1,
          financialSummary: {
            totalCashIn: transactions.filter(t => t.type === "cash_in").reduce((sum, t) => sum + t.amount, 0),
            totalCashOut: transactions.filter(t => t.type === "cash_out").reduce((sum, t) => sum + t.amount, 0),
          }
        };
      }

      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          payload: payloadForAI
        })
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.message);
      }
      return {
        text: data.text,
        isMocked: data.isMocked,
        message: data.message
      };

    } catch (error) {
      console.error("AI Generation Error: ", error);
      throw error;
    }
  };

  return (
    <ProjectContext.Provider value={{
      currentUser,
      loadingAuth,
      authError,
      setAuthError,
      projects,
      selectedProject,
      rabItems,
      ganttTasks,
      transactions,
      purchaseOrders,
      inventory,
      mutations: mutations,
      staff,
      attendance,
      qcItems,
      safetyRecords,
      documents,
      dailyReports,
      progressReports,
      tasks,
      messages,
      notifications,
      auditLogs,
      darkMode,
      multiCompany: "PT Foresyndo Contractor Group",
      activeCompany,
      portalSettings,
      updatePortalSettings,
      signInWithGoogle,
      signInWithBypass,
      logOut,
      switchProject,
      setDarkMode,
      setActiveCompany,
      addProject,
      updateProject,
      deleteProject,
      addRABItem,
      deleteRABItem,
      addGanttTask,
      updateGanttTask,
      deleteGanttTask,
      addTransaction,
      approveTransaction,
      addPurchaseOrder,
      updatePOStatus,
      adjustInventory,
      addMaterialMutation,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      addSDMStaff,
      toggleAttendance,
      addQCItem,
      updateQCStatus,
      addSafetyRecord,
      addDocument,
      approveDocument,
      addRFIComment,
      updateRFIStatus,
      addDailyReport,
      addProgressReport,
      addTask,
      updateTaskStatus,
      deleteTask,
      addDivisionalMessage,
      addSubTask,
      toggleSubTask,
      deleteSubTask,
      runAIAnalysis
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used inside a ProjectProvider");
  }
  return context;
};
