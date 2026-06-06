import React, { useState } from "react";
import { useProject } from "../context/ProjectContext";
import { Sparkles, Loader2, AlertCircle, RefreshCw, Copy, Check, FileDown, Clock, TrendingUp, AlertTriangle, FileText, Send } from "lucide-react";

export const AIAssistant: React.FC = () => {
  const { runAIAnalysis, selectedProject } = useProject();
  const [activeAnalysis, setActiveAnalysis] = useState<"delay_analysis" | "cashflow_prediction" | "risk_assessment" | "minutes_generator" | "report_generator">("delay_analysis");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isMocked, setIsMocked] = useState<boolean>(false);
  const [mockMessage, setMockMessage] = useState<string>("");
  const [customMinutesNote, setCustomMinutesNote] = useState<string>("");

  const triggerAnalysis = async (customPayload?: any) => {
    setLoading(true);
    setAiResponse("");
    try {
      const response = await runAIAnalysis(activeAnalysis, customPayload);
      setAiResponse(response.text);
      setIsMocked(response.isMocked);
      setMockMessage(response.message || "");
    } catch (e) {
      console.error(e);
      setAiResponse(`### ❌ Gagal Menghubungkan AI\n\nTerjadi kesalahan koneksi saat memanggil asisten Gemini. Pastikan koneksi internet stabil dan kunci API diatur.`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Gemini AI Project Investigator</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Analisis prediktif, evaluasi deviasi, dan mitigasi risiko otomatis</p>
          </div>
        </div>
        {selectedProject && (
          <span className="text-xs font-mono px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
            Active: {selectedProject.nomorProyek}
          </span>
        )}
      </div>

      {/* Analysis Presets Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
        <button
          onClick={() => setActiveAnalysis("delay_analysis")}
          className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
            activeAnalysis === "delay_analysis"
              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          <Clock className="w-4 h-4 mb-1" />
          <span className="text-[11px] font-medium leading-tight">Analisis Keterlambatan</span>
        </button>

        <button
          onClick={() => setActiveAnalysis("cashflow_prediction")}
          className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
            activeAnalysis === "cashflow_prediction"
              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          <TrendingUp className="w-4 h-4 mb-1" />
          <span className="text-[11px] font-medium leading-tight">Prediksi Cash Flow</span>
        </button>

        <button
          onClick={() => setActiveAnalysis("risk_assessment")}
          className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
            activeAnalysis === "risk_assessment"
              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          <AlertTriangle className="w-4 h-4 mb-1" />
          <span className="text-[11px] font-medium leading-tight">Penilaian Risiko</span>
        </button>

        <button
          onClick={() => setActiveAnalysis("minutes_generator")}
          className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
            activeAnalysis === "minutes_generator"
              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          <FileText className="w-4 h-4 mb-1" />
          <span className="text-[11px] font-medium leading-tight">Notulen Rapat</span>
        </button>

        <button
          onClick={() => setActiveAnalysis("report_generator")}
          className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
            activeAnalysis === "report_generator"
              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          <FileDown className="w-4 h-4 mb-1" />
          <span className="text-[11px] font-medium leading-tight">Automatic Report</span>
        </button>
      </div>

      {/* Description of active trigger context */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 mb-6">
        {activeAnalysis === "delay_analysis" && (
          <p>🔧 <strong>Model Keterlambatan</strong>: AI akan membandingkan kurva S, jadwal harian, dan ketersediaan stok inventori untuk mengidentifikasi deviasi kritis dan memberikan rekomendasi percepatan proyek.</p>
        )}
        {activeAnalysis === "cashflow_prediction" && (
          <p>💰 <strong>Arus Kas & Margin</strong>: AI menganalisis sisa termin progres, retensi 5% penjamin, arus kas keluar (material, subkon, upah), untuk memprediksi liabilitas dan laba rugi 3 bulan ke depan.</p>
        )}
        {activeAnalysis === "risk_assessment" && (
          <p>⚠️ <strong>Inspeksi HSE & K3</strong>: Mencangkup korelasi temuan K3 di lapangan, incident log, dsan tingkat bahaya area kerja struktural untuk melahirkan matriks mitigasi risiko.</p>
        )}
        {activeAnalysis === "minutes_generator" && (
          <div>
            <p className="mb-2">📝 <strong>Penyusun Notulen Rapat</strong>: Masukkan poin diskusi mentah pertemuan Anda untuk menyusun dokumen notulen rapat formal terstruktur.</p>
            <input 
              type="text"
              placeholder="Contoh: Pembahasan galian beton lift bocor, pic: Ir. Doni target besok selesai."
              value={customMinutesNote}
              onChange={(e) => setCustomMinutesNote(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-800 dark:text-white"
            />
          </div>
        )}
        {activeAnalysis === "report_generator" && (
          <p>📄 <strong>Executive Briefing</strong>: Menghasilkan laporan kualitas tinggi komprehensif bagi Direksi dan Owner mengenai progres fisik, kendala, deviasi, dan rekapitulasi realisasi anggaran.</p>
        )}
      </div>

      {/* Action triggers */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => triggerAnalysis(activeAnalysis === "minutes_generator" ? { notes: [customMinutesNote] } : undefined)}
          disabled={loading || !selectedProject}
          className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm shadow disabled:opacity-50 transition-all cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memetakan Proyek & Berpikir...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Mulai Analisis AI</span>
            </>
          )}
        </button>
      </div>

      {/* AI Output Window */}
      {aiResponse ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Header Panel */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Hasil Analisis Gemini 3.5</span>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={copyToClipboard}
                className="p-1 px-2.5 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Salin!" : "Salin Teks"}</span>
              </button>
            </div>
          </div>

          {/* Feedback/Warnings from server */}
          {isMocked && (
            <div className="bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-950/40 text-amber-600 dark:text-amber-400 p-3 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{mockMessage || "Sistem beroperasi pada mode simulasi. Data input proyek telah berhasil dievaluasi AI."}</span>
            </div>
          )}

          {/* Content Pane */}
          <div className="p-6 bg-slate-50/30 dark:bg-slate-950/10 min-h-[300px] text-justify text-slate-700 dark:text-slate-300 prose prose-slate max-w-none text-sm leading-relaxed overflow-x-auto whitespace-pre-line font-medium font-sans">
            {aiResponse}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 py-16 text-slate-400 dark:text-slate-600 rounded-xl">
            <Sparkles className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Siap Menerima Perintah</h3>
            <p className="text-xs text-slate-400 max-w-sm text-center">Silahkan tekan tombol <strong>Mulai Analisis AI</strong> di atas untuk melihat pembacaan mendalam parameter proyek terpilih Anda.</p>
          </div>
        )
      )}
    </div>
  );
};
