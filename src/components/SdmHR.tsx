import React, { useState } from "react";
import { useProject } from "../context/ProjectContext";
import { Users, UserPlus, Check, X, ShieldAlert, CalendarRange, Clock, Banknote } from "lucide-react";

export const SdmHR: React.FC = () => {
  const { staff, addSDMStaff, toggleAttendance } = useProject();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"Karyawan" | "Mandor" | "Subkontraktor">("Karyawan");
  const [rate, setRate] = useState<number>(200000);
  const [phone, setPhone] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    addSDMStaff({
      name,
      role,
      dailyRate: rate,
      attendanceToday: true,
      productivity: 90,
      phone
    });
    setName("");
    setPhone("");
    setShowAdd(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">SDM & Tenaga Kerja Lapangan</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Mencatat kehadiran harian pekerja, kalkulator payroll harian/lembur, dan analisis produktivitas</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold mt-3 sm:mt-0 cursor-pointer shadow-sm"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Tambah Staff Baru</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} className="bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Nama Lengkap</label>
            <input
              type="text"
              placeholder="Contoh: Pak Budi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:ring-1 focus:ring-blue-600 text-slate-800 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Klasifikasi Pekerjaan</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded focus:outline-none"
            >
              <option value="Karyawan">Karyawan Harian / Helper Office</option>
              <option value="Mandor">Mandor Lapangan</option>
              <option value="Subkontraktor">Subkontraktor Struktur / Arsitektur</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Tarif Harian (Rupiah)</label>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(parseInt(e.target.value) || 0)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:ring-1 focus:ring-blue-600 text-slate-800 dark:text-white"
              required
            />
          </div>
          <div className="flex flex-col justify-end">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded text-xs py-2 font-bold cursor-pointer transition shadow-sm"
            >
              Daftarkan Pekerja
            </button>
          </div>
        </form>
      )}

      {/* Staff Grid Attendance and Productivity indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {staff.map((p) => {
          const estimatedWeeklyPayroll = p.attendanceToday ? p.dailyRate * 6 : 0;
          return (
            <div key={p.id} className="p-4 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/10 hover:shadow-sm transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">{p.name}</h4>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 font-semibold uppercase px-2 py-0.5 rounded inline-block mt-1">
                    {p.role}
                  </span>
                </div>
                
                {/* Attendance Marker toggler */}
                <button
                  onClick={() => toggleAttendance(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                    p.attendanceToday 
                      ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400" 
                      : "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400"
                  }`}
                >
                  {p.attendanceToday ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>{p.attendanceToday ? "Hadir" : "Absen"}</span>
                </button>
              </div>

              {/* Attendance metrics */}
              <div className="grid grid-cols-3 gap-3 border-t border-slate-150 dark:border-slate-800/50 pt-3 mt-4 text-xs font-medium">
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase">Tarif Harian</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Rp {p.dailyRate.toLocaleString("id-ID")}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase">Weekly Est (6h)</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Rp {estimatedWeeklyPayroll.toLocaleString("id-ID")}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase">Rasio Prod</span>
                  <span className={`font-semibold ${p.productivity >= 85 ? "text-emerald-500" : "text-amber-500"}`}>
                    {p.productivity}% Ratio
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Consolidation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
        <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg">
          <CalendarRange className="w-5 h-5 text-blue-500" />
          <div>
            <span className="block text-[9px] text-slate-400 uppercase">Kehadiran Hari Ini</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {staff.filter(s => s.attendanceToday).length} dari {staff.length} Pekerja Aktif
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg">
          <Clock className="w-5 h-5 text-emerald-500" />
          <div>
            <span className="block text-[9px] text-slate-400 uppercase">Rata-Rata Lembur</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              +1.5 Jam / Hari
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg">
          <Banknote className="w-5 h-5 text-sky-500" />
          <div>
            <span className="block text-[9px] text-slate-400 uppercase">Kesehatan Payroll</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 text-emerald-500">
              98.2% Disbursed (Ontime)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
