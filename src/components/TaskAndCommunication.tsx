import React, { useState } from "react";
import { useProject } from "../context/ProjectContext";
import { UserRole, Task, DivisionalMessage } from "../types";
import { 
  CheckSquare, MessageSquare, Send, Trash2, Plus, Calendar, AlertCircle, 
  Filter, Check, Clock, User, ClipboardList, ShieldAlert, BadgeInfo, Play, ArrowRight, CornerDownRight,
  Search, FileText
} from "lucide-react";
import { jsPDF } from "jspdf";

export function TaskAndCommunication() {
  const { 
    currentUser, tasks, messages, projects, addTask, updateTaskStatus, deleteTask, addDivisionalMessage 
  } = useProject();

  // Task Filter and Sorting states
  const [taskFilter, setTaskFilter] = useState<UserRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<Task["status"] | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"default" | "priority_desc" | "priority_asc" | "closest_due">("default");
  const [taskSearch, setTaskSearch] = useState("");
  
  // Message Filter states
  const [messageFilter, setMessageFilter] = useState<UserRole | "Semua" | "ALL">("ALL");

  // New Task form states
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAssignedRole, setNewAssignedRole] = useState<UserRole>(UserRole.SITE_ENGINEER);
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<"Low" | "Medium" | "High">("Medium");

  // New Message states
  const [msgText, setMsgText] = useState("");
  const [msgTargetRole, setMsgTargetRole] = useState<UserRole | "Semua">("Semua");

  // Notes update state per task
  const [editingTaskNotesId, setEditingTaskNotesId] = useState<string | null>(null);
  const [taskNotesText, setTaskNotesText] = useState("");

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    addTask({
      title: newTitle.trim(),
      description: newDesc.trim(),
      assignedRole: newAssignedRole,
      status: "Belum Mulai",
      dueDate: newDueDate || new Date().toISOString().split("T")[0],
      priority: newPriority
    });
    setNewTitle("");
    setNewDesc("");
    setNewDueDate("");
    setNewPriority("Medium");
    setShowAddTask(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    addDivisionalMessage(msgTargetRole, msgText.trim());
    setMsgText("");
  };

  const handleApplyMacro = (text: string) => {
    setMsgText(text);
  };

  // Predefined quick-reply macros for construction/project divisions
  const macros = [
    { sender: UserRole.SITE_ENGINEER, text: "Bahan ready di gudang. Mohon inspeksi QC.", label: "Site to QC" },
    { sender: UserRole.QC_ENGINEER, text: "Inspeksi dilakukan. Status pending untuk penguatan tulangan.", label: "QC Pending" },
    { sender: UserRole.SAFETY_OFFICER, text: "Harap perbaiki pelindung jaring tepi luar lantai 3 segera.", label: "Safety Alert" },
    { sender: UserRole.DIREKTUR, text: "RAB Tambah Kurang disetujui. Silakan diproses transaksinya.", label: "Direktur Approve" },
    { sender: UserRole.FINANCE, text: "Pembayaran termin 2 material semen telah ditransfer.", label: "Finance Payment" }
  ];

  // Map roles to colors for badges
  const getRoleBadgeColor = (role: UserRole | "Semua") => {
    switch (role) {
      case UserRole.DIREKTUR:
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-355";
      case UserRole.PROJECT_MANAGER:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case UserRole.SITE_ENGINEER:
        return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300";
      case UserRole.QC_ENGINEER:
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300";
      case UserRole.SAFETY_OFFICER:
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case UserRole.FINANCE:
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-350";
      case "Semua":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      default:
        return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-350";
    }
  };

  // Map task statuses to colors
  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "Belum Mulai":
        return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
      case "Dalam Proses":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400";
      case "Menunggu Review":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400";
      case "Selesai":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400";
    }
  };

  // Map task priorities to colors
  const getPriorityBadgeColor = (prio: Task["priority"]) => {
    switch (prio) {
      case "High":
        return "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/30";
      case "Medium":
        return "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-955/30 dark:text-amber-300 dark:border-amber-900/30";
      case "Low":
        return "bg-emerald-100 text-emerald-700 border border-emerald-205 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/30";
      default:
        return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  const getPriorityWeight = (prio: Task["priority"]) => {
    switch (prio) {
      case "High": return 3;
      case "Medium": return 2;
      case "Low": return 1;
      default: return 0;
    }
  };

  // Filter lists
  const filteredTasks = tasks.filter(task => {
    const matchRole = taskFilter === "ALL" || task.assignedRole === taskFilter;
    const matchStatus = statusFilter === "ALL" || task.status === statusFilter;
    
    // Search query matching
    let matchQuery = true;
    if (taskSearch.trim() !== "") {
      const queryLower = taskSearch.toLowerCase();
      
      // Matching title
      const titleMatches = task.title.toLowerCase().includes(queryLower);
      
      // Matching description
      const descMatches = task.description?.toLowerCase().includes(queryLower);
      
      // Matching assignee (assignedRole)
      const assigneeMatches = task.assignedRole.toLowerCase().includes(queryLower);
      
      // Matching creator
      const creatorMatches = task.creatorName.toLowerCase().includes(queryLower);
      
      // Matching project name (by looking up project via projectId)
      const proj = projects?.find(p => p.projectId === task.projectId);
      const projectMatches = proj ? proj.namaProyek.toLowerCase().includes(queryLower) : false;
      
      matchQuery = titleMatches || descMatches || assigneeMatches || creatorMatches || projectMatches;
    }

    return matchRole && matchStatus && matchQuery;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "priority_desc") {
      return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    }
    if (sortBy === "priority_asc") {
      return getPriorityWeight(a.priority) - getPriorityWeight(b.priority);
    }
    if (sortBy === "closest_due") {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0; // default (creation order / backend sequence)
  });

  const filteredMessages = messages.filter(msg => {
    if (messageFilter === "ALL") return true;
    return msg.senderRole === messageFilter || msg.targetRole === messageFilter;
  });

  const activeUserRole = currentUser?.role || UserRole.SITE_ENGINEER;

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
    doc.setFontSize(12);
    doc.text("LAPORAN RAPAT KOORDINASI TUGAS", 115, 15);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Ekspor Oleh : ${currentUser?.name || "User"} (${activeUserRole})`, 115, 21);
    doc.text(`Tanggal     : ${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID", {hour: "2-digit", minute:"2-digit"})}`, 115, 26);

    currentY = 48;

    // Filters Summary Box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(marginX, currentY, 180, 20, "F");
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.rect(marginX, currentY, 180, 20, "S");

    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text("KRITERIA LAPORAN & ALAT SARING", marginX + 5, currentY + 5);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Saringan Devisi : ${taskFilter === "ALL" ? "Semua Devisi" : taskFilter}`, marginX + 5, currentY + 11);
    doc.text(`Saringan Status : ${statusFilter === "ALL" ? "Semua Status" : statusFilter}`, marginX + 5, currentY + 16);
    
    doc.text(`Pencarian Kata  : ${taskSearch ? `"${taskSearch}"` : "Tidak ada"}`, marginX + 95, currentY + 11);
    doc.text(`Urutan Laporan  : ${sortBy === "priority_desc" ? "Prioritas Tertinggi" : sortBy === "priority_asc" ? "Prioritas Terendah" : sortBy === "closest_due" ? "Tenggat Terdekat" : "Terbaru"}`, marginX + 95, currentY + 16);

    currentY += 28;

    // Table Header
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(marginX, currentY, 180, 9, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    
    // Header Column titles
    doc.text("NO", marginX + 3, currentY + 6);
    doc.text("DETAIL TUGAS & INSTRUKSI DELEGASI", marginX + 11, currentY + 6);
    doc.text("DEVISI", marginX + 112, currentY + 6);
    doc.text("PRIORITAS", marginX + 137, currentY + 6);
    doc.text("TENGGAT", marginX + 158, currentY + 6);
    doc.text("STATUS", marginX + 175, currentY + 6);

    currentY += 9;

    // Table Rows
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85); // slate-700

    if (sortedTasks.length === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, currentY, 180, 15, "F");
      
      doc.setTextColor(115, 115, 115);
      doc.setFont("Helvetica", "italic");
      doc.text("Belum ada tugas didelegasikan dengan kriteria saringan aktif ini.", marginX + 50, currentY + 9);
    } else {
      sortedTasks.forEach((task, index) => {
        const pageHeightLimit = 270;
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        const titleLines = doc.splitTextToSize(task.title, 95);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        const descLines = doc.splitTextToSize(task.description || "", 95);
        const noteLines = task.notes ? doc.splitTextToSize(`Catatan tambahan: ${task.notes}`, 95) : [];

        // calculate total needed height for this row
        const padding = 6;
        const rowHeight = Math.max(
          (titleLines.length * 4) + (descLines.length * 3.2) + (noteLines.length > 0 ? (noteLines.length * 3.2 + 2) : 0) + padding,
          14 // minimum row height
        );

        // Page break check
        if (currentY + rowHeight > pageHeightLimit) {
          doc.addPage();
          currentY = 20;

          // Header on new page
          doc.setFillColor(30, 41, 59);
          doc.rect(marginX, currentY, 180, 9, "F");
          
          doc.setTextColor(255, 255, 255);
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(8.5);
          doc.text("NO", marginX + 3, currentY + 6);
          doc.text("DETAIL TUGAS & INSTRUKSI DELEGASI", marginX + 11, currentY + 6);
          doc.text("DEVISI", marginX + 112, currentY + 6);
          doc.text("PRIORITAS", marginX + 137, currentY + 6);
          doc.text("TENGGAT", marginX + 158, currentY + 6);
          doc.text("STATUS", marginX + 175, currentY + 6);

          currentY += 9;
        }

        // Draw Row Zebra Background
        if (index % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(marginX, currentY, 180, rowHeight, "F");
        }

        // Row border
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.1);
        doc.line(marginX, currentY + rowHeight, marginX + 180, currentY + rowHeight);

        // Print values
        doc.setTextColor(15, 23, 42); // slate-900
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.text((index + 1).toString(), marginX + 3, currentY + 5);

        // Print Detail Tugas (Title + Desc + Creator + Note)
        let textY = currentY + 5;
        titleLines.forEach((line: string) => {
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
          doc.text(line, marginX + 11, textY);
          textY += 4;
        });

        // Print small info on Creator
        doc.setFont("Helvetica", "italic");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Pembuat: ${task.creatorName} (${task.creatorRole})`, marginX + 11, textY);
        textY += 3.5;

        descLines.forEach((line: string) => {
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(51, 65, 85);
          doc.text(line, marginX + 11, textY);
          textY += 3.2;
        });

        if (noteLines.length > 0) {
          textY += 1;
          noteLines.forEach((line: string) => {
            doc.setFont("Helvetica", "italic");
            doc.setFontSize(7);
            doc.setTextColor(14, 116, 144);
            doc.text(line, marginX + 11, textY);
            textY += 3.2;
          });
        }

        // Print Assigned Division, Priority, DueDate, Status
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(task.assignedRole, marginX + 112, currentY + 6);

        // Priority Badge text with coloring
        if (task.priority === "High") {
          doc.setTextColor(225, 29, 72); // rose-600
          doc.text("HIGH (Tinggi)", marginX + 137, currentY + 6);
        } else if (task.priority === "Medium") {
          doc.setTextColor(217, 119, 6); // amber-600
          doc.text("MEDIUM (Sdg)", marginX + 137, currentY + 6);
        } else {
          doc.setTextColor(5, 150, 105); // emerald-600
          doc.text("LOW (Rendah)", marginX + 137, currentY + 6);
        }

        // Due date
        doc.setTextColor(71, 85, 105); // slate-600
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text(task.dueDate, marginX + 158, currentY + 6);

        // Status
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(7.5);
        if (task.status === "Selesai") {
          doc.setTextColor(22, 163, 74); // green-600
        } else if (task.status === "Menunggu Review") {
          doc.setTextColor(79, 70, 229); // indigo-600
        } else if (task.status === "Dalam Proses") {
          doc.setTextColor(217, 119, 6); // amber-650
        } else {
          doc.setTextColor(100, 116, 139); // slate-500
        }
        doc.text(task.status, marginX + 175, currentY + 6);

        currentY += rowHeight;
      });
    }

    // Signatures / footer notes at bottom of document
    if (currentY + 35 > 280) {
      doc.addPage();
      currentY = 20;
    }
    
    currentY += 15;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(marginX, currentY, marginX + 180, currentY);
    
    currentY += 6;
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Dokumen ini dihasilkan secara otomatis sistem koordinasi lapangan korporasi Foresyndo Konstruksi.", marginX, currentY);
    doc.text("Setiap keputusan dalam rapat koordinasi ini bersifat mengikat dan wajib ditindaklanjuti divisi bersangkutan.", marginX, currentY + 4);

    // Save PDF
    doc.save(`Laporan_Koordinasi_Tugas_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-850 dark:text-slate-100">
      {/* Tab Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <ClipboardList className="w-5 h-5 font-bold" />
            <span className="text-xs uppercase tracking-widest font-extrabold font-mono">Modul Kolaborasi Lapangan</span>
          </div>
          <h2 className="text-xl font-black font-sans tracking-tight text-slate-900 dark:text-white">
            Tugas Devisi &amp; Komunikasi Antar Devisi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Portal koordinasi kerja, delegasi instruksi, dan rekonsiliasi dokumen instan di antara divisi konstruksi.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-150 dark:border-slate-800 text-xs">
          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <div>
            <div className="font-mono text-[10px] text-slate-400">ROLE AKTIF ANDA</div>
            <div className="font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5 mt-0.5">
              <span>{currentUser?.name || "Offline User"}</span>
              <span className={`px-2 py-[1px] text-[9px] rounded-full font-bold ${getRoleBadgeColor(activeUserRole)}`}>
                {activeUserRole}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: TASK TRACKING PANEL (7 COLS) */}
        <section className="xl:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-150 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#e0a96d] dark:text-[#f4d19b]" />
              <h3 className="font-bold text-sm tracking-tight">Daftar Tugas &amp; Delegasi Devisi</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={triggerPDFExport}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] px-2.5 py-1.5 rounded transition cursor-pointer shadow-xs border border-rose-600"
                title="Ekspor daftar tugas tersaring ke PDF"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ekspor PDF</span>
              </button>
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] px-2.5 py-1.5 rounded transition cursor-pointer shadow-xs border border-blue-600"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddTask ? "Batal" : "Tugas Baru"}</span>
              </button>
            </div>
          </div>

          {/* Expanded Task Creation Form */}
          {showAddTask && (
            <form onSubmit={handleCreateTask} className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-850 rounded-lg space-y-3 animate-slide-down">
              <h4 className="text-xs font-extrabold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-blue-500" />
                <span>Buat Delegasi Instruksi Baru</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400">Judul Instruksi Kerja</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Audit mutu beton K-300..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400">Tanggal Jatuh Tempo</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full text-xs p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1 md:col-span-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400">Tugaskan Ke Devisi</label>
                  <select
                    value={newAssignedRole}
                    onChange={(e) => setNewAssignedRole(e.target.value as UserRole)}
                    className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white"
                  >
                    {Object.values(UserRole).map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 md:col-span-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400">Prioritas Tugas</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as "Low" | "Medium" | "High")}
                    className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white"
                  >
                    <option value="High">🔴 High (Tinggi)</option>
                    <option value="Medium">🟡 Medium (Sedang)</option>
                    <option value="Low">🟢 Low (Rendah)</option>
                  </select>
                </div>
                <div className="space-y-1 md:col-span-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400">&nbsp;</label>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 rounded shadow transition cursor-pointer"
                  >
                    Delegasikan Tugas
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-400">Deskripsi Pekerjaan</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Detail spesifikasi, cakupan lokasi, dan hasil yang diwajibkan..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>
            </form>
          )}

          {/* Filters & Sorting Grid Selection */}
          <div className="flex flex-col gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-150 dark:border-slate-800 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Filter className="w-3.5 h-3.5 font-bold text-blue-500" />
                <span className="font-extrabold uppercase tracking-wider text-[10px] font-mono">Alat Saring &amp; Urut</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Terlihat: <span className="font-extrabold text-blue-600 dark:text-blue-400">{filteredTasks.length} tugas</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              {/* Search input bar */}
              <div className="md:col-span-2 space-y-1">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Cari Tugas</span>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari judul, divisi, pembuat, proyek..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-7 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  {taskSearch && (
                    <button
                      type="button"
                      onClick={() => setTaskSearch("")}
                      className="absolute right-2.5 top-2 text-slate-450 hover:text-red-500 dark:hover:text-red-400 text-sm font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Target Devisi dropdown */}
              <div className="space-y-1">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Target Devisi</span>
                <select
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value as UserRole | "ALL")}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300"
                >
                  <option value="ALL">Semua Devisi</option>
                  {Object.values(UserRole).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {/* Status dropdown */}
              <div className="space-y-1">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as Task["status"] | "ALL")}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="Belum Mulai">Belum Mulai</option>
                  <option value="Dalam Proses">Dalam Proses</option>
                  <option value="Menunggu Review">Menunggu Review</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 mt-1 border-t border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Urutkan Berdasarkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400"
                >
                  <option value="default">Terbaru (Pemuatan)</option>
                  <option value="priority_desc">🔴 Prioritas Tertinggi</option>
                  <option value="priority_asc">🟢 Prioritas Terendah</option>
                  <option value="closest_due">📅 Tenggat Terdekat</option>
                </select>
              </div>
              {taskSearch && (
                <span className="text-[10px] text-slate-500 font-medium">
                  Menyaring kata kunci: <b className="text-blue-600 dark:text-blue-400">"{taskSearch}"</b>
                </span>
              )}
            </div>
          </div>

          {/* Main Tasks Lists display */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {sortedTasks.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-250 dark:border-slate-800 rounded-xl space-y-2">
                <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Belum ada tugas didelegasikan dengan kriteria filter tersebut.</p>
              </div>
            ) : (
              sortedTasks.map((task) => {
                const isAssignedToMe = task.assignedRole === activeUserRole;
                const daysRemaining = Math.max(0, Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
                
                return (
                  <div 
                    key={task.id} 
                    className={`p-4 bg-white dark:bg-slate-900 border rounded-xl hover:shadow-xs transition space-y-3 ${
                      isAssignedToMe ? "border-l-4 border-l-blue-500 border-slate-200 dark:border-slate-800" : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {/* Header line of Task Card */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          {isAssignedToMe && (
                            <span className="inline-flex items-center gap-1 bg-blue-550/15 text-blue-600 dark:text-blue-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-full font-mono">
                              🔧 Tugas Divisi Anda
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 text-[9px] rounded-full font-bold font-mono ${getPriorityBadgeColor(task.priority)}`}>
                            {task.priority === "High" ? "🔴 High" : task.priority === "Medium" ? "🟡 Medium" : "🟢 Low"}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 leading-snug">
                          {task.title}
                        </h4>
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mt-1 font-mono">
                          <span>Oleh: <b className="text-slate-500">{task.creatorName} ({task.creatorRole})</b></span>
                          <span>•</span>
                          <span>Tempo: <b className="text-slate-500">{task.dueDate} ({daysRemaining === 0 ? "Hari ini" : `${daysRemaining} hari lagi`})</b></span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        
                        {/* Delete Task for creator or Admin / PM */}
                        {(task.creatorRole === activeUserRole || activeUserRole === UserRole.PROJECT_MANAGER || activeUserRole === UserRole.DIREKTUR) && (
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="bg-transparent hover:bg-slate-100 dark:hover:bg-slate-850 p-1 rounded transition text-rose-500 focus:outline-none"
                            title="Hapus Tugas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Deskripsi tugas */}
                    <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-150 dark:border-slate-850">
                      {task.description}
                    </p>

                    {/* Completion notes / technical evaluation */}
                    {task.notes && (
                      <div className="text-[11px] bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-2.5 rounded-md space-y-1">
                        <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-[10px] flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Laporan Hasil Pekerjaan (Notes)</span>
                        </div>
                        <p className="text-slate-500 font-sans italic">{task.notes}</p>
                      </div>
                    )}

                    {/* Action Line per Task card */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-mono">DILIMPAHKAN KE:</span>
                        <span className={`px-2 py-[1.5px] rounded-full text-[10px] font-mono font-bold ${getRoleBadgeColor(task.assignedRole)}`}>
                          {task.assignedRole}
                        </span>
                      </div>

                      {/* Interactive update of task progress/notes (Any user can update status to push workflow - PM/Direktur can review) */}
                      <div className="flex items-center gap-2">
                        {editingTaskNotesId === task.id ? (
                          <div className="flex items-center gap-2 animate-fade-in w-full">
                            <input
                              type="text"
                              required
                              placeholder="Masukkan hasil tinjauan laporan/alat..."
                              value={taskNotesText}
                              onChange={(e) => setTaskNotesText(e.target.value)}
                              className="text-[11px] p-1 bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded min-w-[150px] text-slate-800 dark:text-white text-xs"
                            />
                            <button
                              onClick={() => {
                                updateTaskStatus(task.id, "Selesai", taskNotesText.trim());
                                setEditingTaskNotesId(null);
                                setTaskNotesText("");
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px]"
                            >
                              Selesai &amp; Lapor
                            </button>
                            <button
                              onClick={() => setEditingTaskNotesId(null)}
                              className="text-slate-400 text-[10px] font-medium"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {task.status !== "Selesai" && (
                              <>
                                {task.status === "Belum Mulai" && (isAssignedToMe || activeUserRole === UserRole.PROJECT_MANAGER) && (
                                  <button
                                    onClick={() => updateTaskStatus(task.id, "Dalam Proses")}
                                    className="px-2 py-1 bg-amber-600/10 text-amber-600 hover:bg-amber-600 hover:text-white transition rounded font-extrabold text-[10px] border border-amber-600/20"
                                  >
                                    Mulai Kerjakan
                                  </button>
                                )}
                                {task.status === "Dalam Proses" && (isAssignedToMe || activeUserRole === UserRole.PROJECT_MANAGER) && (
                                  <button
                                    onClick={() => updateTaskStatus(task.id, "Menunggu Review")}
                                    className="px-2 py-1 bg-indigo-650/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition rounded font-extrabold text-[10px] border border-indigo-600/20"
                                  >
                                    Ajukan Review
                                  </button>
                                )}
                                {task.status === "Menunggu Review" && (activeUserRole === UserRole.PROJECT_MANAGER || activeUserRole === UserRole.DIREKTUR || task.creatorRole === activeUserRole) && (
                                  <button
                                    onClick={() => {
                                      setEditingTaskNotesId(task.id);
                                      setTaskNotesText(task.notes || "");
                                    }}
                                    className="px-2 py-1 bg-emerald-650/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition rounded font-extrabold text-[10px] border border-emerald-500/20"
                                  >
                                    Verifikasi Selesai
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: DIVISION COMMUNICATIONS & CHAT ROOM (5 COLS) */}
        <section className="xl:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-150 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-sm tracking-tight">Kanal Komunikasi Antar Devisi</h3>
            </div>
            
            {/* Thread Selectors */}
            <select
              value={messageFilter}
              onChange={(e) => setMessageFilter(e.target.value as UserRole | "Semua" | "ALL")}
              className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded p-1 text-[10px] font-semibold"
            >
              <option value="ALL">Semua Diskusi</option>
              <option value="Semua">Target: Semua</option>
              {Object.values(UserRole).map(role => (
                <option key={role} value={role}>Devisi: {role}</option>
              ))}
            </select>
          </div>

          {/* Guidelines on Communication */}
          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-md border border-slate-150 dark:border-slate-850 flex items-start gap-2 text-[10px] text-slate-550 leading-relaxed">
            <BadgeInfo className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p>
              Gunakan kanal ini untuk mempercepat koordinasi harian. Anda dapat mengklik <b>Rekomendasi Balasan Cepat</b> di bawah untuk posting format pesan standar lapangan instan.
            </p>
          </div>

          {/* Messages Streams display window */}
          <div className="space-y-3.5 max-h-[350px] min-h-[250px] overflow-y-auto pr-1 flex flex-col pt-1">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-10 my-auto text-slate-400">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-[11px] italic">Tidak ada pesan divisi yang sesuai saringan filter ini.</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSentByMe = msg.senderRole === activeUserRole;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col space-y-1 text-xs max-w-[85%] hover:scale-[1.005] transition origin-left ${
                      isSentByMe ? "self-end items-end ml-auto text-right" : "self-start items-start mr-auto text-left"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                      {!isSentByMe && <span className="font-extrabold text-slate-500 dark:text-slate-300">{msg.senderName}</span>}
                      <span className={`px-1 rounded text-[8px] font-bold ${getRoleBadgeColor(msg.senderRole)}`}>
                        {msg.senderRole}
                      </span>
                      <ArrowRight className="w-2.5 h-2.5 text-slate-350" />
                      <span className="text-slate-500 text-[8px] font-black uppercase font-mono">
                        {msg.targetRole === "Semua" ? "📢 Semua" : `📩 ${msg.targetRole}`}
                      </span>
                      <span className="text-[8px] text-slate-400">{msg.timestamp.split(" ")[1] || msg.timestamp}</span>
                    </div>

                    <div className={`p-2.5 rounded-lg border leading-relaxed font-sans ${
                      isSentByMe 
                        ? "bg-blue-600 border-blue-650 text-white rounded-tr-none text-left" 
                        : "bg-slate-50 dark:bg-slate-800 border-slate-150 dark:border-slate-850 text-slate-800 dark:text-slate-100 rounded-tl-none text-left"
                    }`}>
                      <p className="text-[11px] font-medium leading-normal">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick-reply recommendations macros list */}
          <div className="space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <span className="block text-[9px] font-bold uppercase text-slate-400 tracking-wider">Rekomendasi Balasan Cepat</span>
            <div className="flex flex-wrap gap-1">
              {macros.map((macro, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyMacro(macro.text)}
                  className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 text-[9px] transition cursor-pointer"
                >
                  {macro.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat text composition send area */}
          <form onSubmit={handleSendMessage} className="space-y-2">
            <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-150 dark:border-slate-850 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Tujuan Penerima:</span>
              <select
                value={msgTargetRole}
                onChange={(e) => setMsgTargetRole(e.target.value as UserRole | "Semua")}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-705 p-1 rounded font-bold text-xs"
              >
                <option value="Semua">📢 Semua Devisi (BroadCast)</option>
                {Object.values(UserRole).map(role => (
                  <option key={role} value={role}>📩 Penerima: {role}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Diskusikan teknis, kendala mutu, atau instruksi..."
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 bg-blue-600 border border-blue-600 cursor-pointer shadow-xs flex items-center justify-center transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
