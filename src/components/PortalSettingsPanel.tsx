import React, { useState, useEffect } from "react";
import { useProject } from "../context/ProjectContext";
import { storage } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { PortalSettings } from "../types";
import { 
  Building2, Mail, Phone, MapPin, Lock, User, UploadCloud, 
  CheckCircle, AlertCircle, RefreshCw, Eye, EyeOff, ClipboardCheck
} from "lucide-react";

export const PortalSettingsPanel: React.FC = () => {
  const { portalSettings, updatePortalSettings } = useProject();
  
  // Local state form fields
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  // Form status states
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "auth">("profile");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Load context settings into local form fields on mount/update
  useEffect(() => {
    if (portalSettings) {
      setCompanyName(portalSettings.companyName || "");
      setCompanyAddress(portalSettings.companyAddress || "");
      setCompanyEmail(portalSettings.companyEmail || "");
      setCompanyPhone(portalSettings.companyPhone || "");
      setLogoUrl(portalSettings.logoUrl || "");
      setAdminUsername(portalSettings.adminUsername || "");
      setAdminPassword(portalSettings.adminPassword || "");
    }
  }, [portalSettings]);

  // Handler for uploading files
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadProgress(0);

    // Prepare firebase storage structure
    try {
      const fileName = `logos/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const logoRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(logoRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Storage upload error:", error);
          // Auto fallback to Base64 dataURL if Storage upload fails (useful in offline or unprovisioned storages)
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setLogoUrl(event.target.result as string);
              setUploadProgress(null);
              setSaveStatus({
                type: "success",
                message: "Logo diunggah secara lokal (Disimpan ke database)."
              });
            }
          };
          reader.readAsDataURL(file);
        },
        async () => {
          // Upload successful, get downloadable link
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setLogoUrl(downloadUrl);
            setUploadProgress(null);
            setSaveStatus({
              type: "success",
              message: "Logo berhasil diunggah ke Firebase Storage!"
            });
          } catch (err) {
            console.error("Error retrieving download URL:", err);
            setUploadError("Gagal mengambil link logo setelah diunggah.");
            setUploadProgress(null);
          }
        }
      );
    } catch (err) {
      console.error("Setup error for Firebase Storage upload:", err);
      // Fallback
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
          setUploadProgress(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit all forms
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (companyEmail && !emailRegex.test(companyEmail)) {
      setSaveStatus({
        type: "error",
        message: "Format email perusahaan tidak valid."
      });
      setIsSaving(false);
      return;
    }

    const payload: PortalSettings = {
      companyName,
      companyAddress,
      companyEmail,
      companyPhone,
      logoUrl,
      adminUsername,
      adminPassword
    };

    try {
      await updatePortalSettings(payload);
      setSaveStatus({
        type: "success",
        message: "Data pengaturan portal berhasil diperbarui dan disinkronkan ke Firestore!"
      });
    } catch (err) {
      console.error("Error saving portal settings form:", err);
      setSaveStatus({
        type: "error",
        message: "Gagal menyimpan perubahan ke Firestore. Coba lagi nanti."
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="portal-settings-module" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Overview Head Banner */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center border border-blue-100 dark:border-slate-700 overflow-hidden relative shadow-inner">
            {logoUrl ? (
              <img src={logoUrl} alt="Company Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{companyName || "Pengaturan Portal"}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">Kelola Identitas, Berkas Branding, & Kredensial Administrator</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("profile")}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition ${
              activeSubTab === "profile"
                ? "bg-blue-600 text-white shadow"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Profil Perusahaan
          </button>
          <button
            onClick={() => setActiveSubTab("auth")}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition ${
              activeSubTab === "auth"
                ? "bg-blue-600 text-white shadow"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Kredensial Admin
          </button>
        </div>
      </div>

      {/* Main Form container */}
      <form onSubmit={handleSaveSettings} className="p-6 md:p-8 space-y-6">
        
        {saveStatus && (
          <div className={`p-4 rounded-xl flex items-start gap-3 border ${
            saveStatus.type === "success" 
              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900" 
              : "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-900"
          }`}>
            {saveStatus.type === "success" ? (
              <CheckCircle className="w-5 h-5 mt-0.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 mt-0.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold leading-none capitalize">{saveStatus.type === "success" ? "Sukses" : "Kesalahan"}</p>
              <p className="text-xs mt-1 leading-relaxed opacity-90">{saveStatus.message}</p>
            </div>
          </div>
        )}

        {/* TAB 1: PROFILE SETUP */}
        {activeSubTab === "profile" && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide border-b border-slate-100 dark:border-slate-805 pb-2 font-mono">
              Informasi Umum Profil Perusahaan
            </h3>
            
            {/* Logo upload field */}
            <div className="bg-slate-50 dark:bg-slate-850/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/70 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              <div className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl w-32 h-32 mx-auto relative group overflow-hidden">
                {logoUrl ? (
                  <>
                    <img src={logoUrl} alt="Preview Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    <button 
                      type="button" 
                      onClick={() => setLogoUrl("")}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-150 flex items-center justify-center text-white text-[10px] font-bold cursor-pointer"
                    >
                      Hapus & Ganti
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                    <span className="text-[9px] font-bold text-slate-500 mt-2 block">Format: PNG/JPG</span>
                  </div>
                )}
              </div>

              <div className="md:col-span-3 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Unggah Logo Portofolio</label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-2">
                    <UploadCloud className="w-3.5 h-3.5" />
                    Pilih File Logo
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoUpload} 
                      className="hidden" 
                    />
                  </label>
                  {uploadProgress !== null && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengunggah ({uploadProgress}%)</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Pilih file gambar berukuran maksimal 2MB. Logo ini akan digunakan sebagai header pada laporan dan penawaran proyek portal.
                </p>
                {uploadError && (
                  <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {uploadError}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama Perusahaan */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Nama Perusahaan <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Contoh: PT Foresyndo Group"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 dark:border-slate-800 dark:bg-[#121824] rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none dark:text-white transition"
                  />
                </div>
              </div>

              {/* Email Perusahaan */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Email Korespondensi <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="Contoh: info@foresyndo.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 dark:border-slate-800 dark:bg-[#121824] rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none dark:text-white transition"
                  />
                </div>
              </div>

              {/* No Telephone */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Nomor Telepon / HP <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="Contoh: +62 21-8888-888 atau 0812XXXXXXXX"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 dark:border-slate-800 dark:bg-[#121824] rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none dark:text-white transition"
                  />
                </div>
              </div>

              {/* Alamat Perusahaan */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Alamat Lengkap Perusahaan <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute top-3 left-3 text-slate-400 pointer-events-none">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <textarea
                    required
                    rows={3}
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="Jl. Raya Jenderal Sudirman Kav. 21-22, Kuningan Barat, Jakarta Selatan, 12920"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 dark:border-slate-800 dark:bg-[#121824] rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none dark:text-white transition resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CREDENTIAL SETUP */}
        {activeSubTab === "auth" && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide border-b border-slate-100 dark:border-slate-850 pb-2 font-mono">
              Keamanan & Kredensial Administrator Portal
            </h3>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-900 dark:text-amber-300 leading-normal flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500" />
              <div>
                <p className="text-xs font-bold">Pemberitahuan Proteksi Sistem</p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  Kredensial berikut digunakan sebagai validasi lokal sekunder dan login proteksi tambahan pada modul sensitif portal KonstrukPro ini. Gantilah password secara periodik untuk keamanan data sistem konstruksi Anda.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Username Admin Portal</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 dark:border-slate-800 dark:bg-[#121824] rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none dark:text-white transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Password Admin Portal</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 dark:border-slate-800 dark:bg-[#121824] rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none dark:text-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Gunakan kombinasi huruf, angka, dan simbol.</p>
              </div>
            </div>
          </div>
        )}

        {/* Form control actions */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={() => {
              if (portalSettings) {
                setCompanyName(portalSettings.companyName || "");
                setCompanyAddress(portalSettings.companyAddress || "");
                setCompanyEmail(portalSettings.companyEmail || "");
                setCompanyPhone(portalSettings.companyPhone || "");
                setLogoUrl(portalSettings.logoUrl || "");
                setAdminUsername(portalSettings.adminUsername || "");
                setAdminPassword(portalSettings.adminPassword || "");
              }
              setSaveStatus(null);
            }}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition border border-slate-200 dark:border-slate-750"
          >
            Batal Perubahan
          </button>
          
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer shadow transition flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <ClipboardCheck className="w-4 h-4" />
                Simpan Dan Singkronkan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
