import React, { useState } from "react";
import { GanttTask, SDMStaff } from "../types";
import { useProject } from "../context/ProjectContext";
import { 
  Calendar, ChevronRight, AlertTriangle, CheckCircle2, ChevronDown, 
  Plus, ShieldCheck, User, FolderPlus, Trash2, Edit3, Save, X, Briefcase, Phone
} from "lucide-react";

export const GanttChart: React.FC = () => {
  const { 
    ganttTasks, 
    selectedProject, 
    staff, 
    addGanttTask, 
    updateGanttTask, 
    deleteGanttTask 
  } = useProject();

  // Controls for forms
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<GanttTask | null>(null);

  // Add Task form state
  const [taskName, setTaskName] = useState("");
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setEndDate] = useState("2026-07-15");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"on time" | "delayed" | "critical">("on time");
  const [critical, setCritical] = useState(false);
  const [assignedTo, setAssignedTo] = useState("");

  // Edit Task form state
  const [editTaskName, setEditTaskName] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editProgress, setEditProgress] = useState(0);
  const [editStatus, setEditStatus] = useState<"on time" | "delayed" | "critical">("on time");
  const [editCritical, setEditCritical] = useState(false);
  const [editAssignedTo, setEditAssignedTo] = useState("");

  // Gantt chart months helper
  const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Helper calculated percentage positions
  const getTaskGridInfo = (startStr: string, endStr: string) => {
    const start = new Date(startStr || "2026-02-01");
    const end = new Date(endStr || "2026-02-15");
    
    // Project boundaries: default baseline is Feb 2026 to Dec 2026
    const projStart = new Date("2026-02-01");
    const projEnd = new Date("2026-11-30");
    
    const totalDuration = projEnd.getTime() - projStart.getTime();
    const taskStartOffset = start.getTime() - projStart.getTime();
    const taskDuration = end.getTime() - start.getTime();

    const leftPercent = Math.max(0, Math.min(100, (taskStartOffset / totalDuration) * 100));
    const widthPercent = Math.max(2, Math.min(100 - leftPercent, (taskDuration / totalDuration) * 100));

    return { leftPercent, widthPercent };
  };

  // Helper to lookup staff role/details
  const getStaffDetails = (staffIdOrName: string): SDMStaff | undefined => {
    if (!staffIdOrName) return undefined;
    return staff.find(s => s.id === staffIdOrName || s.name === staffIdOrName);
  };

  // Submit handllers
  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    addGanttTask({
      name: taskName,
      startDate,
      endDate,
      progress,
      status,
      criticalPath: critical,
      assignedTo: assignedTo || undefined
    });

    // Reset Form
    setTaskName("");
    setStartDate("2026-06-01");
    setEndDate("2026-07-15");
    setProgress(0);
    setStatus("on time");
    setCritical(false);
    setAssignedTo("");
    setShowAddTask(false);
  };

  const handleStartEditing = (task: GanttTask) => {
    setEditingTask(task);
    setEditTaskName(task.name);
    setEditStartDate(task.startDate);
    setEditEndDate(task.endDate);
    setEditProgress(task.progress);
    setEditStatus(task.status);
    setEditCritical(task.criticalPath);
    setEditAssignedTo(task.assignedTo || "");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTaskName.trim()) return;

    updateGanttTask({
      ...editingTask,
      name: editTaskName,
      startDate: editStartDate,
      endDate: editEndDate,
      progress: editProgress,
      status: editStatus,
      criticalPath: editCritical,
      assignedTo: editAssignedTo || undefined
    });

    setEditingTask(null);
  };

  return (
    <div id="gantt-chart-module" className="space-y-6">
      
      {/* Overview Head Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Time Schedule & Gantt Chart
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Pantau jalurnya proyek, tandai hambatan (delayed), dan delegasikan pekerjaan kepada masing-masing personil penanggung jawab lapangan.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowAddTask(!showAddTask);
                setEditingTask(null);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition shadow flex items-center gap-1.5"
            >
              {showAddTask ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  Batal Tambah
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Paket Pekerjaan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Legend block */}
        <div className="flex flex-wrap items-center gap-6 mt-4 pt-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-blue-500/20 rounded-sm border border-blue-500" />
            Tepat Waktu (On Time)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-amber-500/20 rounded-sm border border-amber-500" />
            Terlambat (Delayed)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-rose-500/20 rounded-sm border border-rose-500" />
            Lajur Kritis (Critical Path)
          </span>
          <span className="flex items-center gap-1.5 ml-auto text-[11px] font-mono font-semibold text-indigo-500">
            * Rentang Garis Jadwal: Feb 2026 s/d Nov 2026
          </span>
        </div>
      </div>

      {/* FORM: ADD TASK */}
      {showAddTask && (
        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-6 shadow-sm animate-fadeIn">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-blue-600" />
            Buat Paket Pekerjaan Baru
          </h3>
          <form onSubmit={handleAddNewTask} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-3 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Nama Pekerjaan <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Simpan nama sektor pekerjaan (contoh: Instalasi Ducting Ac Lab, Pemasangan Panel)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 dark:border-slate-800 dark:bg-[#121824] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal Mulai <span className="text-rose-500">*</span></label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 dark:border-slate-800 dark:bg-[#121824] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal Selesai <span className="text-rose-500">*</span></label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 dark:border-slate-800 dark:bg-[#121824] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-305">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 dark:border-slate-800 dark:bg-[#121824] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
              >
                <option value="on time">Tepat Waktu (On Time)</option>
                <option value="delayed">Terlambat (Delayed)</option>
                <option value="critical">Kritis (Critical)</option>
              </select>
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Progres Kerja: {progress}%</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {/* ASSIGNEE FIELD (SDM PULL SINKRON) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-705 dark:text-slate-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-500" />
                Penanggung Jawab (Assignee)
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 dark:border-slate-800 dark:bg-[#121824] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
              >
                <option value="">-- Belum Ditunjuk --</option>
                {staff.length === 0 ? (
                  <option value="" disabled>*(Akun HR SDM Kosong)*</option>
                ) : (
                  staff.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex items-center pt-5 pl-2">
              <label className="inline-flex items-center cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={critical}
                  onChange={(e) => setCritical(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 mr-2 h-4 w-4"
                />
                Lajur Kritis (Critical Path)
              </label>
            </div>

            {staff.length === 0 && (
              <div className="md:col-span-3 text-[10.5px] p-2.5 rounded bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900 font-medium">
                💡 <b>Petunjuk:</b> Tidak ada staff di modul SDM untuk saat ini. Anda dapat tetap membuat jadwal, namun untuk menetapkan penanggung jawab, silakan tambahkan personil terlebih dahulu di menu <b>Staff & Kelola SDM</b>.
              </div>
            )}

            <div className="md:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddTask(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 hover:bg-blue-700 bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer shadow transition"
              >
                Simpan Paket Kerja
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FORM: EDIT TASK / SINKRON KREDENSIAL */}
      {editingTask && (
        <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-2xl p-6 shadow-sm animate-fadeIn">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-amber-500" />
            Edit Paket Pekerjaan: <span className="text-amber-600 dark:text-amber-400 font-mono">{editingTask.name}</span>
          </h3>
          <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-3 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Nama Pekerjaan <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={editTaskName}
                onChange={(e) => setEditTaskName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 dark:border-slate-800 dark:bg-[#121824] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal Mulai <span className="text-rose-500">*</span></label>
              <input
                type="date"
                required
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 dark:border-slate-800 dark:bg-[#121824] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal Selesai <span className="text-rose-500">*</span></label>
              <input
                type="date"
                required
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 dark:border-slate-800 dark:bg-[#121824] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-[#ccc]">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 dark:border-slate-800 dark:bg-[#121824] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
              >
                <option value="on time">Tepat Waktu (On Time)</option>
                <option value="delayed">Terlambat (Delayed)</option>
                <option value="critical">Kritis (Critical)</option>
              </select>
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">Progres Kerja: {editProgress}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={editProgress}
                onChange={(e) => setEditProgress(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* EDIT ASSIGNEE FIELD (SDM PULL SINKRON) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-500" />
                Ubah Penanggung Jawab
              </label>
              <select
                value={editAssignedTo}
                onChange={(e) => setEditAssignedTo(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 dark:border-slate-800 dark:bg-[#121824] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
              >
                <option value="">-- Belum Ditunjuk --</option>
                {staff.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center pt-5 pl-2">
              <label className="inline-flex items-center cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={editCritical}
                  onChange={(e) => setEditCritical(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 mr-2 h-4 w-4"
                />
                Lajur Kritis (Critical Path)
              </label>
            </div>

            <div className="md:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 hover:bg-amber-600 bg-amber-500 text-white text-xs font-bold rounded-lg cursor-pointer shadow transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CORE TIMELINE SHEET */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {ganttTasks.length === 0 ? (
          <div className="py-16 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl text-center text-slate-400 dark:text-slate-600 text-sm">
            😭 Belum ada paket jadwal pekerjaan untuk proyek yang Anda pilih. Silakan gunakan tombol di atas untuk berkreasi!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[1050px] p-6">
              
              {/* Timeline Horizontal Line Header */}
              <div className="grid grid-cols-12 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                <div className="col-span-5 pl-4">Item Pekerjaan & Penanggung Jawab</div>
                <div className="col-span-7 grid grid-cols-10 pl-4 border-l border-slate-100 dark:border-slate-800">
                  {months.slice(0, 10).map((m, i) => (
                    <div key={i} className="text-center hover:text-indigo-600 cursor-pointer">{m}</div>
                  ))}
                </div>
              </div>

              {/* Rows layout */}
              <div className="space-y-4">
                {ganttTasks.map((t) => {
                  const { leftPercent, widthPercent } = getTaskGridInfo(t.startDate, t.endDate);
                  const inCharge = getStaffDetails(t.assignedTo || "");
                  
                  return (
                    <div 
                      key={t.id} 
                      className="grid grid-cols-12 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/10 p-3 rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all duration-150 group"
                    >
                      {/* Left: Task Name + Assignee Badge */}
                      <div className="col-span-12 md:col-span-5 flex flex-col justify-start gap-1 pr-4">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5">
                            {t.status === "delayed" ? (
                              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 animate-bounce" />
                            ) : t.progress === 100 ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <Calendar className="w-4 h-4 text-sky-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex flex-wrap items-center gap-1.5 leading-snug">
                              {t.name}
                              {t.criticalPath && (
                                <span className="px-1.5 py-0.5 bg-rose-50 text-[8px] font-mono font-bold text-rose-500 border border-rose-200 rounded tracking-tighter dark:bg-rose-955/20 dark:border-rose-900/50">
                                  CRITICAL PATH
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-2">
                              <span>📅 {t.startDate} s/d {t.endDate}</span>
                              {t.assignedTo && <span className="opacity-40">|</span>}
                            </div>
                          </div>
                        </div>

                        {/* ASSIGNEE FIELD REPRESENTATION */}
                        <div className="mt-2.5 pl-6 flex flex-wrap items-center gap-2">
                          {inCharge ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50/70 border border-blue-100 text-[10px] text-blue-700 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-300">
                              <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center font-bold text-[9px]">
                                {inCharge.name[0]?.toUpperCase()}
                              </span>
                              <span className="font-bold">{inCharge.name}</span>
                              <span className="opacity-50">({inCharge.role})</span>
                              {inCharge.phone && (
                                <a 
                                  href={`tel:${inCharge.phone}`} 
                                  title={`Hubungi: ${inCharge.phone}`} 
                                  className="ml-1 text-slate-400 hover:text-blue-600"
                                >
                                  <Phone className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-dashed border-slate-200 text-slate-400 text-[9px] font-medium uppercase font-mono dark:border-slate-800 dark:text-slate-600">
                              <User className="w-3 h-3 text-slate-400" />
                              Belum ditunjuk
                            </div>
                          )}

                          {t.status === "delayed" && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-mono dark:bg-amber-955/20 dark:border-amber-900 dark:text-amber-400">
                              ⚠️ Terhambat
                            </span>
                          )}
                          {t.status === "critical" && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-mono dark:bg-rose-955/20 dark:border-rose-900 dark:text-rose-400">
                              🔥 Sektor Merah
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Interactive Chart + Row action buttons */}
                      <div className="col-span-12 md:col-span-7 flex items-center justify-between border-l border-slate-100 dark:border-slate-800 pl-4 h-12 relative">
                        {/* Underlay reference dotted path */}
                        <div className="absolute inset-x-0 h-[1px] bg-slate-100 dark:bg-slate-800/80 left-4" />

                        {/* Relative Task Timeline representer */}
                        <div 
                          className="absolute h-7 rounded-lg px-2 flex items-center transition-all duration-300 shadow-sm"
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                        >
                          {/* Inner color of gantt duration block */}
                          <div className={`absolute inset-0 rounded-lg opacity-10 ${
                            t.criticalPath ? "bg-rose-600" : t.status === "delayed" ? "bg-amber-500" : "bg-sky-500"
                          } border ${
                            t.criticalPath ? "border-rose-600" : t.status === "delayed" ? "border-amber-500" : "border-sky-500"
                          }`} />

                          {/* Progress bar inside */}
                          <div 
                            className={`absolute top-0 bottom-0 left-0 transition-all rounded-l-lg ${
                              t.criticalPath ? "bg-rose-500" : t.status === "delayed" ? "bg-amber-500" : "bg-sky-500"
                            }`}
                            style={{ width: `${t.progress}%` }}
                          />

                          {/* Float progress text inside */}
                          <span className="relative z-10 text-[9.5px] font-bold text-slate-700 dark:text-slate-105 ml-1 mix-blend-difference">
                            {t.progress}%
                          </span>
                        </div>

                        {/* Command controls shown at right end on hover/responsive */}
                        <div className="ml-auto relative z-10 flex items-center gap-1 opacity-10 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-white/90 dark:bg-slate-900/90 pl-2 rounded-l-md">
                          <button
                            type="button"
                            onClick={() => handleStartEditing(t)}
                            title="Edit Pekerjaan & Assignee"
                            className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-amber-500 cursor-pointer transition border border-transparent hover:border-slate-200"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin menghapus paket pekerjaan "${t.name}"?`)) {
                                deleteGanttTask(t.id);
                              }
                            }}
                            title="Hapus Pekerjaan"
                            className="p-1 px-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded text-slate-400 hover:text-red-500 cursor-pointer transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
};
