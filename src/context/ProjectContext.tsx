import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  Project, ProjectStatus, RABItem, GanttTask, FinanceTransaction, PurchaseOrder, 
  MaterialInventory, SDMStaff, QualityControlItem, SafetyRecord, DocumentRecord, 
  DailyReport, UserRole, UserProfile, AuditLog, MaterialMutation, ProgressReport,
  RFIDiscussionComment, RFIStatusHistory, PortalSettings
} from "../types";
import { 
  initialProjects, initialRABItems, initialGanttTasks, initialTransactions, 
  initialPurchaseOrders, initialInventory, initialStaff, initialQC, initialSafety, 
  initialDocuments, initialDailyReports 
} from "../mockData";
import { auth, db, googleProvider } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, where } from "firebase/firestore";

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
  
  // AI Tools trigger
  runAIAnalysis: (type: "delay_analysis" | "cashflow_prediction" | "risk_assessment" | "minutes_generator" | "report_generator", extraPayload?: any) => Promise<{ text: string; isMocked: boolean; message?: string }>;
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
    logoUrl: "",
    adminUsername: "admin",
    adminPassword: "Password123"
  };

  const [portalSettings, setPortalSettings] = useState<PortalSettings>(() => {
    const saved = localStorage.getItem("fos_portal_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
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
  };

  // RAB Items
  const addRABItem = (item: Omit<RABItem, "id" | "projectId">) => {
    const id = "rab-" + Math.random().toString(36).substr(2, 9);
    const newIt: RABItem = { ...item, id, projectId: activeProjId };
    
    setRabAll(prev => {
      const currentList = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [...currentList, newIt] };
    });
    logAction("Tambah RAB", `Menambahkan item RAB ${item.uraianPekerjaan}`);
  };

  const deleteRABItem = (id: string) => {
    setRabAll(prev => {
      const currentList = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: currentList.filter(it => it.id !== id) };
    });
    logAction("Hapus RAB", `Menghapus item RAB ID: ${id}`);
  };

  // Gantt Chart Tasks
  const addGanttTask = (task: Omit<GanttTask, "id" | "projectId">) => {
    const id = "gt-" + Math.random().toString(36).substr(2, 9);
    const newTask: GanttTask = { ...task, id, projectId: activeProjId };

    setGanttAll(prev => {
      const currentList = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [...currentList, newTask] };
    });
    logAction("Tambah Jadwal Pekerjaan", `Menambahkan jadwal ${task.name}`);
  };

  const updateGanttTask = (task: GanttTask) => {
    setGanttAll(prev => {
      const currentList = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: currentList.map(item => item.id === task.id ? task : item) };
    });
    logAction("Update Jadwal Pekerjaan", `Memperbarui jadwal & penanggung jawab ${task.name}`);
  };

  const deleteGanttTask = (id: string) => {
    setGanttAll(prev => {
      const currentList = prev[activeProjId] || [];
      const itemToDelete = currentList.find(it => it.id === id);
      const name = itemToDelete ? itemToDelete.name : id;
      logAction("Hapus Jadwal Pekerjaan", `Menghapus jadwal ${name}`);
      return { ...prev, [activeProjId]: currentList.filter(it => it.id !== id) };
    });
  };

  // Transactions
  const addTransaction = (tx: Omit<FinanceTransaction, "id" | "projectId">) => {
    const id = "tr-" + Math.random().toString(36).substr(2, 9);
    const newTx: FinanceTransaction = { ...tx, id, projectId: activeProjId };

    setTrxAll(prev => {
      const currentList = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [newTx, ...currentList] };
    });
    logAction("Tambah Transaksi Keuangan", `Menambahkan kas dari kategori ${tx.category} senilai Rp ${tx.amount}`);
  };

  const approveTransaction = (id: string) => {
    setTrxAll(prev => {
      const currentList = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: currentList.map(tx => tx.id === id ? { ...tx, status: "Approved" } : tx) };
    });
    logAction("Persetujuan Transaksi", `Menyetujui transaksi ID: ${id}`);
  };

  // Purchase Order
  const addPurchaseOrder = (po: Omit<PurchaseOrder, "id" | "projectId">) => {
    const id = "po-" + Math.random().toString(36).substr(2, 9);
    const newPo: PurchaseOrder = { ...po, id, projectId: activeProjId };

    setPoAll(prev => {
      const currentList = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [...currentList, newPo] };
    });
    logAction("Tambah PO", `Membuat Purchase Order baru untuk supplier ${po.supplier}`);
  };

  const updatePOStatus = (id: string, status: "Draft" | "Approved" | "Ordered" | "Delivered") => {
    setPoAll(prev => {
      const currentList = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: currentList.map(item => item.id === id ? { ...item, status } : item) };
    });
    logAction("Update Status PO", `Mengubah status PO ${id} menjadi ${status}`);
    
    // Auto add to inventory if Delivered
    if (status === "Delivered") {
      const targetPO = purchaseOrders.find(p => p.id === id);
      if (targetPO) {
        adjustInventory(targetPO.material, targetPO.qty);
      }
    }
  };

  // Inventory & mutations
  const adjustInventory = (materialName: string, amount: number) => {
    setInvAll(prev => {
      const list = prev[activeProjId] || [];
      const exists = list.some(i => i.materialName.toLowerCase() === materialName.toLowerCase());
      if (exists) {
        return {
          ...prev,
          [activeProjId]: list.map(item => 
            item.materialName.toLowerCase() === materialName.toLowerCase() 
              ? { ...item, currentStock: item.currentStock + amount, lastUpdated: new Date().toISOString().split("T")[0] } 
              : item
          )
        };
      } else {
        const id = "inv-" + Math.random().toString(36).substr(2, 9);
        const newItem: MaterialInventory = {
          id,
          projectId: activeProjId,
          materialName,
          currentStock: amount,
          minStock: 10,
          unit: "Pcs",
          lastUpdated: new Date().toISOString().split("T")[0]
        };
        return { ...prev, [activeProjId]: [...list, newItem] };
      }
    });

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

  const addMaterialMutation = (mut: Omit<MaterialMutation, "id" | "projectId">) => {
    const id = "mut-" + Math.random().toString(36).substr(2, 9);
    const newMut: MaterialMutation = { ...mut, id, projectId: activeProjId };

    setMutationAll(prev => {
      const currentList = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [newMut, ...currentList] };
    });

    // Substract or Add Stock
    const factor = mut.type === "masuk" ? mut.qty : -mut.qty;
    adjustInventory(mut.materialName, factor);

    logAction("Mutasi Material", `Mutasi ${mut.type} baha: ${mut.materialName} qty: ${mut.qty}`);
  };

  // SDM
  const addSDMStaff = (st: Omit<SDMStaff, "id" | "projectId">) => {
    const id = "st-" + Math.random().toString(36).substr(2, 9);
    const newSt: SDMStaff = { ...st, id, projectId: activeProjId };

    setStaffAll(prev => {
      const list = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [...list, newSt] };
    });
    logAction("Tambah SDM", `Mendaftarkan tenaga kerja baru ${st.name}`);
  };

  const toggleAttendance = (staffId: string) => {
    setStaffAll(prev => {
      const list = prev[activeProjId] || [];
      return {
        ...prev,
        [activeProjId]: list.map(item => item.id === staffId ? { ...item, attendanceToday: !item.attendanceToday } : item)
      };
    });
    logAction("Ubah Absensi", `Mengubah status absensi harian staff ${staffId}`);
  };

  // Quality Control
  const addQCItem = (qc: Omit<QualityControlItem, "id" | "projectId">) => {
    const id = "qc-" + Math.random().toString(36).substr(2, 9);
    const newQc: QualityControlItem = { ...qc, id, projectId: activeProjId };

    setQcAll(prev => {
      const list = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [...list, newQc] };
    });
    logAction("Tambah Item QC", `Membuat kontrol QC baru: ${qc.checklistName}`);
  };

  const updateQCStatus = (id: string, status: "Open" | "Progress" | "Closed") => {
    setQcAll(prev => {
      const list = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: list.map(item => item.id === id ? { ...item, status } : item) };
    });
    logAction("Ubah Status QC", `Mengubah status QC ${id} menjadi ${status}`);
  };

  // Safety Records
  const addSafetyRecord = (saf: Omit<SafetyRecord, "id" | "projectId">) => {
    const id = "sf-" + Math.random().toString(36).substr(2, 9);
    const newSf: SafetyRecord = { ...saf, id, projectId: activeProjId };

    setSafetyAll(prev => {
      const list = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [...list, newSf] };
    });
    logAction("Tambah Safety Patrol/Event", `Menginput record K3: ${saf.type}`);
  };

  // Documents
  const addDocument = (document: Omit<DocumentRecord, "id" | "projectId" | "createdAt">) => {
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
  };

  const approveDocument = (id: string, approved: boolean) => {
    const statusVal = approved ? "Approved" : "Rejected";
    const changedBy = currentUser?.name || "Offline User";
    const changedByRole = currentUser?.role || "Site Engineer";
    
    setDocAll(prev => {
      const list = prev[activeProjId] || [];
      return { 
        ...prev, 
        [activeProjId]: list.map(item => {
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
            return { 
              ...item, 
              status: statusVal,
              statusHistory: item.category === "RFI" ? [...historyArray, histItem] : historyArray
            };
          }
          return item;
        }) 
      };
    });
    logAction("Approval Dokumen", `Memproses persetujuan dokumen ${id} -> ${approved ? "Disetujui" : "Ditolak"}`);
  };

  const addRFIComment = (docId: string, commentText: string) => {
    const authorName = currentUser?.name || "Offline User";
    const authorRole = currentUser?.role || "Site Engineer";
    const newComment = {
      id: "comment-" + Math.random().toString(36).substr(2, 9),
      authorName,
      authorRole,
      text: commentText,
      timestamp: new Date().toISOString().replace('T', ' ').substr(0, 16)
    };

    setDocAll(prev => {
      const list = prev[activeProjId] || [];
      return {
        ...prev,
        [activeProjId]: list.map(docItem => {
          if (docItem.id === docId) {
            const commentsArray = docItem.comments || [];
            return {
              ...docItem,
              comments: [...commentsArray, newComment]
            };
          }
          return docItem;
        })
      };
    });
    logAction("Diskusi RFI", `Menambahkan komentar di RFI ID: ${docId}`);
  };

  const updateRFIStatus = (docId: string, status: "Draft" | "Approved" | "Rejected" | "Pending Approval", note?: string) => {
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

    setDocAll(prev => {
      const list = prev[activeProjId] || [];
      return {
        ...prev,
        [activeProjId]: list.map(docItem => {
          if (docItem.id === docId) {
            const historyArray = docItem.statusHistory || [];
            return {
              ...docItem,
              status,
              statusHistory: [...historyArray, newHistory]
            };
          }
          return docItem;
        })
      };
    });
    logAction("Status RFI", `Mengubah status RFI ID: ${docId} menjadi ${status}`);
  };

  // Daily Reports
  const addDailyReport = (rep: Omit<DailyReport, "id" | "projectId">) => {
    const id = "dr-" + Math.random().toString(36).substr(2, 9);
    const newRep: DailyReport = { ...rep, id, projectId: activeProjId };

    setDailyAll(prev => {
      const list = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [newRep, ...list] };
    });
    logAction("Tambah Laporan Harian", `Menginput progres laporan harian tanggal ${rep.date}`);
  };

  // Progress Reports
  const addProgressReport = (pr: Omit<ProgressReport, "id" | "projectId">) => {
    const id = "pr-" + Math.random().toString(36).substr(2, 9);
    const newPr: ProgressReport = { ...pr, id, projectId: activeProjId };

    setProgressAll(prev => {
      const list = prev[activeProjId] || [];
      return { ...prev, [activeProjId]: [...list, newPr] };
    });

    // Auto adjust parent project progress
    if (selectedProject) {
      const maxNewProgress = Math.min(100, selectedProject.progress + pr.persentaseProgress);
      updateProject({
        ...selectedProject,
        progress: parseFloat(maxNewProgress.toFixed(1))
      });
    }

    logAction("Tambah Progress Fisik", `Pekerjaan ${pr.itemPekerjaan} menyumbang progres ${pr.persentaseProgress}%`);
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
