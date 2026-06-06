import React, { useState } from "react";
import { useProject } from "../context/ProjectContext";
import { TrendingUp, Plus, Calendar, Flame, AlertCircle } from "lucide-react";

export const SPlusCurve: React.FC = () => {
  const { progressReports, addProgressReport, selectedProject } = useProject();
  const [showInput, setShowInput] = useState(false);
  const [itemName, setItemName] = useState("");
  const [vol, setVol] = useState<number>(1);
  const [pct, setPct] = useState<number>(5);
  const [date, setDate] = useState("");

  const handleProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName) return;
    addProgressReport({
      tanggal: date || new Date().toISOString().split("T")[0],
      itemPekerjaan: itemName,
      volumeRealisasi: vol,
      persentaseProgress: pct
    });
    setItemName("");
    setVol(1);
    setPct(5);
    setShowInput(false);
  };

  // Predefined target S-Curve monthly cumulative percentages for 2026
  const targetCurve = [
    { month: "Feb", rencana: 5, realisasi: 5 },
    { month: "Mar", rencana: 12, realisasi: 12 },
    { month: "Apr", rencana: 22, realisasi: 24 },
    { month: "May", rencana: 35, realisasi: 35 },
    { month: "Jun", rencana: 48, realisasi: selectedProject ? selectedProject.progress : 45.2 },
    { month: "Jul", rencana: 62, realisasi: 0 },
    { month: "Aug", rencana: 75, realisasi: 0 },
    { month: "Sep", rencana: 88, realisasi: 0 },
    { month: "Oct", rencana: 95, realisasi: 0 },
    { month: "Nov", rencana: 100, realisasi: 0 }
  ];

  // Calculate coordinates for SVG plotting
  const width = 600;
  const height = 180;
  const paddingX = 40;
  const paddingY = 20;

  const getCoordinates = (index: number, val: number) => {
    const totalPoints = targetCurve.length - 1;
    const x = paddingX + (index / totalPoints) * (width - 2 * paddingX);
    // val goes from 0 to 100
    const y = height - paddingY - (val / 100) * (height - 2 * paddingY);
    return { x, y };
  };

  // Generate rencana path string
  let targetPath = "";
  targetCurve.forEach((pt, i) => {
    const { x, y } = getCoordinates(i, pt.rencana);
    targetPath += `${i === 0 ? "M" : "L"} ${x} ${y}`;
  });

  // Generate realisasi path string (only plot months that have realisasi > 0, or index up to currently running month (June = index 4))
  let actualPath = "";
  let plotCount = 5; // up to June
  for (let i = 0; i < plotCount; i++) {
    const pt = targetCurve[i];
    const { x, y } = getCoordinates(i, pt.realisasi);
    actualPath += `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }

  const deviation = (selectedProject?.progress || 45.2) - 48; // June actual 45.2 vs plan 48

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Kurva S & Deviasi Progress</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Memetakan akumulasi rencana progres kerja terhadap realisasi fisik mingguan</p>
        </div>
        <button
          onClick={() => setShowInput(!showInput)}
          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold mt-3 sm:mt-0 cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Input Progres Fisik</span>
        </button>
      </div>

      {showInput && (
        <form onSubmit={handleProgressSubmit} className="bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Item Pekerjaan</label>
            <input
              type="text"
              placeholder="Semen kolom Lt 2"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:ring-1 focus:ring-blue-600 text-slate-800 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Vol Realisasi</label>
            <input
              type="number"
              value={vol}
              onChange={(e) => setVol(parseInt(e.target.value) || 1)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:ring-1 focus:ring-blue-600 text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Bobot Tambahan Progres (%)</label>
            <input
              type="number"
              step="0.1"
              value={pct}
              onChange={(e) => setPct(parseFloat(e.target.value) || 1)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:ring-1 focus:ring-blue-600 text-slate-800 dark:text-white"
            />
          </div>
          <div className="flex flex-col justify-end">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded text-xs py-2 font-bold cursor-pointer transition shadow-sm"
            >
              Kirim Progres
            </button>
          </div>
        </form>
      )}

      {/* S-Curve Graph Drawing */}
      <div className="mb-6 overflow-hidden">
        <h4 className="text-xs font-mono font-bold text-slate-400 mb-2 uppercase">Grafik Akumulasi S-Curve (Plotted)</h4>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[620px]">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
              {/* Back grid lines */}
              <line x1={paddingX} y1={paddingY} x2={width-paddingX} y2={paddingY} stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1={paddingX} y1={(height/2)} x2={width-paddingX} y2={(height/2)} stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1={paddingX} y1={height-paddingY} x2={width-paddingX} y2={height-paddingY} stroke="#cbd5e1" />

              {/* Rencana Target Line Path */}
              <path d={targetPath} fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="4 4" />
              
              {/* Realisasi Actual Line Path */}
              <path d={actualPath} fill="none" stroke="#2563eb" strokeWidth="3" />

              {/* Monthly dot indicators & labels */}
              {targetCurve.map((m, i) => {
                const plans = getCoordinates(i, m.rencana);
                const actual = getCoordinates(i, m.realisasi);

                return (
                  <g key={i}>
                    {/* Vertical guideline */}
                    <line x1={plans.x} y1={paddingY} x2={plans.x} y2={height-paddingY} stroke="#f1f5f9" strokeWidth="1" />
                    
                    {/* Rencana point */}
                    <circle cx={plans.x} cy={plans.y} r="3.5" fill="#94a3b8" className="hover:scale-150 transition-all cursor-pointer" />
                    
                    {/* Realisasi point (only show if plotted) */}
                    {i < plotCount && (
                      <circle cx={actual.x} cy={actual.y} r="4.5" fill="#2563eb" className="hover:scale-150 transition-all cursor-pointer" />
                    )}

                    {/* X-axis labels */}
                    <text x={plans.x} y={height - 2} textAnchor="middle" fill="#94a3b8" className="text-[10px] font-mono font-bold">
                      {m.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 justify-center mt-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-4 h-0.5 border-t border-dashed border-slate-400" />
            <span className="text-slate-400 font-medium">Target Rencana Rencana</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-4 h-0.5 border-t-2 border-blue-600" />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Realisasi Lapangan</span>
          </div>
        </div>
      </div>

      {/* S-Curve statistics & deviasi analysis */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start space-x-3">
          <Flame className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Deviasi Progres</span>
            <span className={`text-md font-extrabold ${deviation < 0 ? "text-amber-500" : "text-emerald-500"}`}>
              {deviation.toFixed(1)}% {deviation < 0 ? "(Terlambat)" : "(Aman)"}
            </span>
            <p className="text-[10px] text-slate-400 mt-1">Acuan bulan Juni 2026: target 48% vs rill {selectedProject?.progress || 45.2}%</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Riwayat Input Progress</span>
          <div className="space-y-2 max-h-[85px] overflow-y-auto pr-1">
            {progressReports.map((r, i) => (
              <div key={r.id || i} className="flex justify-between items-center text-[10px] border-b border-slate-100 dark:border-slate-800 pb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{r.itemPekerjaan}</span>
                <div className="space-x-1.5 flex items-center font-mono">
                  <span className="text-slate-400">{r.tanggal}</span>
                  <span className="text-amber-500 font-bold">+{r.persentaseProgress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Siklus Pelaporan</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Harian, Mingguan, Bulanan</span>
            <p className="text-[10px] text-slate-400 mt-1">Perkiraan serah terima utama (PHO): 30 November 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};
