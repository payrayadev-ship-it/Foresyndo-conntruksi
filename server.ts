import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || "MOCK_KEY";
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// Error handling helper
const handleServerAIError = (res: express.Response, error: any, message: string) => {
  console.error(message, error);
  res.status(500).json({
    error: true,
    message: `${message}: ${error instanceof Error ? error.message : String(error)}`
  });
};

// AI Endpoint: Generate analysis or report
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { type, payload } = req.body;
    
    if (!type || !payload) {
      return res.status(400).json({ error: true, message: "Type and payload are required" });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      // Graceful Mock for Local Workspace if API key is not yet set
      return res.json({
        success: true,
        text: getMockAnalysis(type, payload),
        isMocked: true,
        message: "Menggunakan hasil simulasi asisten AI. (Sediakan GEMINI_API_KEY di panel Secrets untuk hasil nyata)"
      });
    }

    const ai = getGeminiClient();
    let prompt = "";
    let systemInstruction = "Anda adalah asisten AI profesional untuk Foresyndo ConstrukPro, sistem manajemen konstruksi sipil, arsitektur, MEP, developer, dan pengawas. Berikan analisis mendalam, pragmatis, format Markdown terstruktur, dan tawarkan rekomendasi teknis berkualitas tinggi.";

    switch (type) {
      case "delay_analysis":
        prompt = `Lakukan analisis keterlambatan proyek berdasarkan data berikut:\n` +
                 `Proyek: ${JSON.stringify(payload.project || {})}\n` +
                 `Kurva S / Jadwal Pekerjaan: ${JSON.stringify(payload.schedule || [])}\n` +
                 `Pekerjaan Terlambat: ${JSON.stringify(payload.delayedTasks || [])}\n` +
                 `Faktor hambatan (misal cuaca, material, sdm): ${JSON.stringify(payload.factors || {})}\n\n` +
                 `Berikan kesimpulan tentang penyebab keterlambatan, analisis deviasi, dan usulkan rencana aksi percepatan proyek (catch-up plan) dengan detail taktis.`;
        break;

      case "cashflow_prediction":
        prompt = `Lakukan prediksi arus kas (cash flow) berdasarkan data keuangan berikut:\n` +
                 `Proyek: ${JSON.stringify(payload.project || {})}\n` +
                 `Anggaran RAB: Rp ${payload.budgetRAB || 0}\n` +
                 `Penerimaan (Cash In): ${JSON.stringify(payload.cashIn || [])}\n` +
                 `Pengeluaran (Cash Out): ${JSON.stringify(payload.cashOut || [])}\n` +
                 `Status Termin & Retensi: ${JSON.stringify(payload.terminStatus || {})}\n\n` +
                 `Berikan prediksi arus kas untuk 3 bulan ke depan, estimasi laba/rugi, identifikasi risiko likuiditas (bottleneck), dan usulkan rekomendasi optimalisasi keuangan.`;
        break;

      case "risk_assessment":
        prompt = `Identifikasi dan lakukan penilaian risiko proyek konstruksi berdasarkan informasi:\n` +
                 `Kategori Pekerjaan: ${JSON.stringify(payload.categories || [])}\n` +
                 `Faktor Eksternal (Cuaca/Lokasi): ${JSON.stringify(payload.externalFactors || {})}\n` +
                 `SDM & Subkontraktor: ${JSON.stringify(payload.sdmSummary || {})}\n` +
                 `Temuan K3/Safety: ${JSON.stringify(payload.safetyFindings || [])}\n\n` +
                 `Buat daftar matriks risiko proyek (Dampak vs Probabilitas), pencegahan bahaya K3, risiko kontraktual, serta mitigasi risiko struktural.`;
        break;

      case "minutes_generator":
        prompt = `Buat Notulen Rapat Konstruksi (Meeting Minutes) formal berdasarkan poin-poin mentah berikut:\n` +
                 `Topik Rapat: ${payload.topic || "Rapat Koordinasi Mingguan Proyek"}\n` +
                 `Peserta: ${payload.participants || "PM, Site Engineer, QC, Owner, Konsultan"}\n` +
                 `Poin Pembahasan Temp: ${JSON.stringify(payload.notes || [])}\n` +
                 `Keputusan Rapat: ${JSON.stringify(payload.decisions || [])}\n` +
                 `Action Items & Penanggung Jawab: ${JSON.stringify(payload.actionItems || [])}\n\n` +
                 `Format dengan rapi, berikan penomoran formal, dan jadwalkan tanggal tindak lanjut berikutnya.`;
        break;

      case "report_generator":
        prompt = `Buat Laporan Mingguan/Bulanan Otomatis yang merangkum kesehatan proyek ini:\n` +
                 `Proyek: ${JSON.stringify(payload.project || {})}\n` +
                 `Progres Kumulatif saat ini: ${payload.progress || 0}%\n` +
                 `Deviasi Progres: ${payload.deviation || 0}%\n` +
                 `Temuan QC & K3: ${JSON.stringify(payload.qcSafety || [])}\n` +
                 `Status Keuangan: ${JSON.stringify(payload.financialSummary || {})}\n\n` +
                 `Sajikan laporan eksekutif formal yang siap dibaca oleh Direktur dan Owner.`;
        break;

      default:
        prompt = `Berikan analisis umum berdasarkan data konstruksi berikut: ${JSON.stringify(payload)}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const aiText = response.text || "Tidak ada hasil analisis yang dikembalikan oleh AI.";
    res.json({
      success: true,
      text: aiText,
      isMocked: false
    });

  } catch (error) {
    handleServerAIError(res, error, "Gagal memproses permintaan analisis AI");
  }
});

// Helper for Mock Responses when Gemini API Key is missing (prevents crash and provides excellent user experience)
function getMockAnalysis(type: string, payload: any): string {
  const currentVal = payload.project?.namaProyek || payload.topic || "Proyek Foresyndo";
  
  if (type === "delay_analysis") {
    return `### 🚨 ANALISIS KETERLAMBATAN PROYEK: ${currentVal}
Tanggal Analisis: 6 Juni 2026
Analis: Asisten AI Foresyndo ConstrukPro (Simulasi)

#### 1. Status & Deviasi Progres saat ini:
* **Rencana Progres**: 45.3%
* **Realisasi Aktual**: 41.2%
* **Deviasi**: **-4.1% (Keterlambatan Tingkat Rendah-Sedang)**

#### 2. Root Cause (Penyebab Utama) Keterlambatan:
* **Arsitektur & MEP Matching (Sektor Kritis)**: Penundaan approval Shop Drawing untuk instalasi kabel baki MEP lantai 2 dan 3.
* **Faktor Material**: Pasokan beton ready-mix terhambat macet di jalur akses luar kota pada minggu ke-3 Mei.
* **Faktor Cuaca**: Curah hujan mendadak intensitas tinggi menghentikan pengecoran kolam utama selama 2 hari kerja.

#### 3. Rekomendasi Catch-up Plan (Percepatan):
1. **Lembur Terarah (Overtime)**: Tambah jam kerja (2 jam/hari) khusus untuk tim MEP dan fabrikasi arsitektur guna mengejar defisit 4% progres.
2. **Fast-tracking**: Jalankan pekerjaan pengecatan dinding luar lantai bawah paralel dengan instalasi kaca lantai atas.
3. **Penyediaan Buffer Material**: Pindahkan tumpukan stok semen dan besi profil ke gudang indoor sementara agar tidak terganggu cuaca basah.
4. **Approval Akselerasi**: Site Engineer harus mempercepat pengajuan RFI (Request For Information) kepada Konsultan Pengawas via modul Dokumen Foresyndo.`;
  }
  
  if (type === "cashflow_prediction") {
    return `### 📈 PREDIKSI ARUS KAS (CASH FLOW): ${currentVal}
Rentang Analisis: Juni - Agustus 2026
Sistem Keuangan: Terintegrasi Foresyndo (Simulasi)

#### 1. Proyeksi Arus Kas 3 Bulan Kedepan:
| Bulan | Proyeksi Penerimaan (Termin) | Proyeksi Pengeluaran (Operasional & Upah) | Kas Bersih (Net Cash) |
|---|---|---|---|
| **Juni 2026** | Rp 450.000.000 (Termin II) | Rp 280.000.000 | + Rp 170.000.000 |
| **Juli 2026** | Rp 0 (Fase Tunggu) | Rp 220.000.000 | - Rp 50.000.000 |
| **Agustus 2026**| Rp 600.000.000 (Termin III) | Rp 310.000.000 | + Rp 290.000.000 |

#### 2. Analisis Risiko Likuiditas:
* Terdapat **defisit operasional** pada bulan **Juli 2026** sebesar Rp 50.000.000 karena tidak ada termin cair di bulan tersebut, sedangkan pengeluaran material struktur tetap berjalan.
* **Rekomendasi**: Manfaatkan dana kas cadangan atau negosiasikan kelonggaran pembayaran subkontraktor ke bulan Agustus guna menghindari bottleneck operasional di lapangan.

#### 3. Realisasi vs Budget (Laba Rugi Proyek):
* **Nilai Kontrak total**: Rp 1.500.000.000
* **Estimasi Total RAB**: Rp 1.250.000.000
* **Estimasi Margin Keuntungan**: **Rp 250.000.000 (16.6%)**`;
  }

  if (type === "risk_assessment") {
    return `### ⚠️ PENILAIAN RISIKO PROYEK CONSTRUKPRO
Kategori Proyek: Sipil, MEP & Struktur
Analis Safety: AI Safety Officer (Simulasi)

#### 1. Matriks Penilaian Risiko Teratas:
| Deskripsi Risiko | Dampak | Probabilitas | Tingkat Risiko | Tindakan Mitigasi |
|---|---|---|---|---|
| **Kelebihan Beban Scaffolding Lantai 3** | Tinggi | Sedang | **Kritis** | Pasang rambu beban maks, inspeksi harian oleh Safety Officer sebelum izin kerja dimulai. |
| **Keterlambatan Bahan Utama Besi Ulir** | Sedang | Sedang | **Sedang** | Tandatangani PO dengan 2 supplier cadangan di luar supplier utama. |
| **Ketidaksesuaian Mutu Cor Beton** | Sangat Tinggi| Rendah | **Tinggi** | Pengambilan slamp test secara ketat di lokasi untuk setiap truk mixer beton ready-mix. |

#### 2. Rencana Program HSE (K3) Terpadu:
* Melakukan **Safety Induction** harian pukul 07.30 WIB untuk seluruh pekerja baru dan subkontraktor.
* Mengagendakan **Toolbox Meeting** mingguan setiap hari Sabtu membahas evaluasi temuan hazard lapangan.
* Memastikan Safety Score tetap di atas **95/100** dengan nol kecelakaan kerja (Zero Incident target).`;
  }

  if (type === "minutes_generator") {
    return `### 📝 NOTULEN RAPAT KOORDINASI PROYEK (MEETING MINUTES)
Nama Kegiatan: Rapat Progres Akhir Minggu ${currentVal}
Waktu: 6 Juni 2026, 09.00 - 11.00 WIB
Tempat: Ruang Direksi & Teams Link

#### 1. Ringkasan Topik Pembahasan:
* Evaluasi keterlambatan progres kurva S pada pengecoran plat lantai 2.
* Klarifikasi gambar shop drawing MEP untuk instalasi plumbing riser toilet barat.
* Pengajuan tagihan termin ke-2 kepada Owner oleh tim Keuangan.

#### 2. Keputusan Utama Rapat:
* Supplier utama semen instan wajib menambah pengiriman armada ganda mulai Senin pagi.
* Tim perencana struktural berjanji merevisi shop drawing kolom as-C3 paling lambat Selasa depan.
* PM menyetujui pengajuan pembelian alat ukur total station baru untuk site engineer.

#### 3. Action Items (Rencana Aksi):
* **Pekerjaan**: Revisi Shop Drawing MEP | **PIC**: Pak Doni (Site Engineer) | **Target**: 9 Juni 2026
* **Pekerjaan**: Distribusikan Material Besi kolom | **PIC**: Pak Joni (Subkontraktor) | **Target**: 10 Juni 2026
* **Pekerjaan**: Upload Invoice Termin II | **PIC**: Ibu Mira (Finance) | **Target**: 11 Juni 2026`;
  }

  return `### 📊 LAPORAN MONITORING EXECUTIVE AI: ${currentVal}
Tanggal Pembuatan: 6 Juni 2026

#### Ringkasan Eksekutif:
* **Proyek berjalan dengan status konstruksi aktif**. Secara keseluruhan progress proyek berada pada jalur aman dengan deviasi terkendali.
* Manajemen logistik gudang material dalam kondisi baik dengan stok semen, pasir cor, dan baja profil aman untuk 14 hari kedepan.
* K3 Safety mengklaim nilai keselamatan 98/100 tanpa insiden keselamatan berat. Rekomendasi kami adalah melanjutkan koordinasi ketat antar divisi sipil, MEP, dan arsitektur pengawas.`;
}

// Vite middleware configuration for development mode
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully running on http://localhost:${PORT}`);
  });
}

startServer();
