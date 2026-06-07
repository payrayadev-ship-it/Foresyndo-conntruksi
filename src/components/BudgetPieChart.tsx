import React, { useState } from "react";
import { useProject } from "../context/ProjectContext";
import { PieChart, TrendingUp, Wallet, CheckCircle, Info } from "lucide-react";

interface ChartSlice {
  label: string;
  amount: number;
  percentage: number;
  color: string;
  darkColor: string;
}

export const BudgetPieChart: React.FC = () => {
  const { rabItems, transactions, selectedProject } = useProject();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 1. Calculate total RAB (sum of all items in rabItems)
  const totalRAB = rabItems.reduce((sum, item) => sum + item.total, 0);

  // 2. Calculate cash out per category for Upah, Material, Alat, Subkontraktor
  const upahCost = transactions
    .filter(t => t.type === "cash_out" && t.category === "Upah" && t.status !== "Draft")
    .reduce((sum, t) => sum + t.amount, 0);

  const materialCost = transactions
    .filter(t => t.type === "cash_out" && t.category === "Material" && t.status !== "Draft")
    .reduce((sum, t) => sum + t.amount, 0);

  const alatCost = transactions
    .filter(t => t.type === "cash_out" && t.category === "Alat" && t.status !== "Draft")
    .reduce((sum, t) => sum + t.amount, 0);

  const subconCost = transactions
    .filter(t => t.type === "cash_out" && t.category === "Subkontraktor" && t.status !== "Draft")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpentCategories = upahCost + materialCost + alatCost + subconCost;

  // 3. Sisa RAB is the total RAB minus the expenditures in these 4 categories.
  // Bound to at least 0.
  const remainingRAB = Math.max(0, totalRAB - totalSpentCategories);

  const finalTotalForChart = totalRAB > 0 ? totalRAB : (totalSpentCategories > 0 ? totalSpentCategories : 1);

  // 4. Construct Slices representation
  const slicesRaw = [
    { label: "Upah", amount: upahCost, color: "#f59e0b", darkColor: "#f59e0b" }, // orange-500
    { label: "Material", amount: materialCost, color: "#3b82f6", darkColor: "#60a5fa" }, // blue-500 / 400
    { label: "Alat", amount: alatCost, color: "#6366f1", darkColor: "#818cf8" }, // indigo-500 / 400
    { label: "Subkontraktor", amount: subconCost, color: "#ec4899", darkColor: "#f472b6" }, // pink-500 / 400
    { label: "Sisa Alokasi RAB", amount: remainingRAB, color: "#10b981", darkColor: "#34d399" }, // emerald-500 / 400
  ];

  // Map to include percentage
  const slices: ChartSlice[] = slicesRaw
    .map(slice => ({
      ...slice,
      percentage: finalTotalForChart > 0 ? (slice.amount / finalTotalForChart) * 100 : 0
    }))
    .filter(slice => slice.amount > 0);

  // SVG parameters
  const size = 200;
  const radius = 80;
  const centerX = 100;
  const centerY = 100;

  // Trigonometry helpers to draw SVG arc path
  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians)
    };
  };

  const getArcPath = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", cx, cy,
      "L", start.x, start.y,
      "A", r, r, 0, largeArcFlag, 1, end.x, end.y,
      "Z"
    ].join(" ");
  };

  // Convert slice array into slices with custom start/end angles
  let accumulatedAngle = 0;
  const slicesWithAngles = slices.map((slice) => {
    const angleSpan = (slice.percentage / 100) * 360;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + angleSpan;
    accumulatedAngle += angleSpan;
    return {
      ...slice,
      startAngle,
      endAngle
    };
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-amber-500" />
            Proporsi Biaya Terhadap RAB
          </h3>
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
            {selectedProject?.nomorProyek || "PROYEK"}
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Komparasi pengeluaran per kategori taktis dengan total rancangan anggaran biaya.
        </p>
      </div>

      {totalRAB === 0 && totalSpentCategories === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-150 dark:border-slate-850 text-center flex-grow min-h-[180px]">
          <Info className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
          <p className="text-xs text-slate-500 font-medium">Data RAB atau Transaksi tidak ditemukan</p>
          <p className="text-[10.5px] text-slate-400 mt-1 max-w-[200px]">
            Daftarkan item rencana biaya di modul RAB atau catat pengeluaran di menu Keuangan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-grow">
          {/* Pie Chart SVG container */}
          <div className="md:col-span-6 flex justify-center relative my-2">
            {slices.length === 1 ? (
              // Edge case: exactly 1 slice with 100% value
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform rotate-[-90deg]">
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  fill={slices[0].color}
                  className="transition-all duration-350 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(0)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    transform: hoveredIndex === 0 ? "scale(1.05)" : "scale(1)",
                    transformOrigin: "center"
                  }}
                />
              </svg>
            ) : (
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <defs>
                  {/* Subtle inner glow / shadow filter for a modern UI layer */}
                  <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.1" />
                  </filter>
                </defs>
                <g filter="url(#softGlow)">
                  {slicesWithAngles.map((slice, idx) => {
                    const isHovered = hoveredIndex === idx;
                    const path = getArcPath(centerX, centerY, radius, slice.startAngle, slice.endAngle);
                    
                    // Slightly offset the hovered slice for an exploding effect
                    const middleAngle = slice.startAngle + (slice.endAngle - slice.startAngle) / 2;
                    const offsetDistance = isHovered ? 6 : 0;
                    const offsetRad = ((middleAngle - 90) * Math.PI) / 180;
                    const offsetX = offsetDistance * Math.cos(offsetRad);
                    const offsetY = offsetDistance * Math.sin(offsetRad);

                    return (
                      <path
                        key={slice.label}
                        d={path}
                        fill={slice.color}
                        transform={`translate(${offsetX}, ${offsetY})`}
                        className="transition-all duration-200 cursor-pointer stroke-white dark:stroke-slate-900 stroke-[2.5]"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        style={{
                          opacity: hoveredIndex === null || isHovered ? 1 : 0.65,
                        }}
                      />
                    );
                  })}
                </g>
                {/* Center hole for Donut look & central information */}
                <circle cx={centerX} cy={centerY} r={radius * 0.55} className="fill-white dark:fill-slate-900" />
                
                {/* Central Labels inside the hole */}
                <foreignObject x={centerX - radius * 0.5} y={centerY - radius * 0.5} width={radius} height={radius}>
                  <div className="flex flex-col items-center justify-center h-full w-full select-none">
                    {hoveredIndex !== null ? (
                      <>
                        <span className="text-[9px] font-black uppercase text-slate-400 font-mono tracking-wider">
                          {slices[hoveredIndex].label}
                        </span>
                        <span className="text-[12px] font-extrabold text-slate-800 dark:text-white mt-0.5">
                          {slices[hoveredIndex].percentage.toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[8.5px] font-black uppercase text-slate-400 font-mono tracking-wider">
                          TOTAL RAB
                        </span>
                        <span className="text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 mt-1 font-mono text-center leading-none">
                          Rp {(totalRAB || totalSpentCategories).toLocaleString("id-ID")}
                        </span>
                      </>
                    )}
                  </div>
                </foreignObject>
              </svg>
            )}
          </div>

          {/* Interactive Legend in columns of 6 */}
          <div className="md:col-span-6 space-y-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono block mb-1">
              Daftar Proporsi & Volume
            </span>
            <div className="space-y-1.5">
              {slices.map((slice, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <div 
                    key={slice.label}
                    className={`flex items-center justify-between p-2 rounded-lg border transition duration-150 ${
                      isHovered 
                        ? "bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 shadow-xs" 
                        : "bg-transparent border-transparent"
                    }`}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <span 
                        className="w-3 h-3 rounded-full flex-shrink-0 transition-transform duration-150" 
                        style={{ 
                          backgroundColor: slice.color,
                          transform: isHovered ? "scale(1.25)" : "scale(1)"
                        }} 
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {slice.label}
                      </span>
                    </div>
                    <div className="text-right pl-2 shrink-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-white font-mono">
                        Rp {slice.amount.toLocaleString("id-ID")}
                      </div>
                      <div className="text-[9.5px] font-extrabold text-slate-400 font-mono">
                        {slice.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Footer statistics */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 mt-4 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1">
          <Wallet className="w-3.5 h-3.5 text-emerald-500" />
          <span>Total Terelokasi: <strong>Rp {totalSpentCategories.toLocaleString("id-ID")}</strong></span>
        </div>
        <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="w-3 h-3" />
          <span>Aktif & Terverifikasi</span>
        </div>
      </div>
    </div>
  );
};
