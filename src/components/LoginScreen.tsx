import React, { useState } from "react";
import { useProject } from "../context/ProjectContext";
import { UserRole } from "../types";
import { 
  Building2, Lock, User, LogIn, Sparkles, ShieldCheck, 
  Eye, EyeOff, AlertCircle, HardHat, ShieldAlert, CheckCircle2, RefreshCw
} from "lucide-react";

export const LoginScreen: React.FC = () => {
  const { 
    signInWithGoogle, 
    signInWithBypass, 
    portalSettings, 
    loadingAuth 
  } = useProject();

  // Local state for credentials login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default fallback credentials if Firestore config has not synced yet
  const targetUsername = portalSettings?.adminUsername || "admin";
  const targetPassword = portalSettings?.adminPassword || "Password123";

  const handleCredentialsLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    // Simulated short timeout to feel authentic
    setTimeout(() => {
      if (username.trim().toLowerCase() === targetUsername.toLowerCase() && password === targetPassword) {
        setSuccessMsg("Kredensial valid! Mempersiapkan modul...");
        // Directly sign in using bypass method with correct Admin/selected role info
        signInWithBypass(selectedRole, `Administrator (${selectedRole})`);
      } else {
        setErrorMsg("Username atau Password administrator salah. Pastikan kembali kredensial Anda.");
        setIsSubmitting(false);
      }
    }, 750);
  };

  return (
    <div id="constructpro-login-screen" className="min-h-screen w-screen flex flex-col md:flex-row bg-[#0b0f19] text-slate-100 font-sans relative overflow-hidden">
      
      {/* Decorative brand background effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* LEFT PANEL: Elegant construction brand presentation */}
      <div className="md:w-[45%] bg-[#0e1424] border-r border-slate-800/80 p-8 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden select-none">
        
        {/* Subtle geometric overlay lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

        {/* Company Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white border border-blue-500 shadow-lg shadow-blue-500/20">
            {portalSettings?.logoUrl ? (
              <img src={portalSettings.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
            ) : (
              <Building2 className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-wider leading-none uppercase">
              {portalSettings?.companyName || "PT Foresyndo Group"}
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1 font-mono">ConstrukPro Systems</p>
          </div>
        </div>

        {/* Middle promo message */}
        <div className="relative z-10 my-auto py-10 md:py-0 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-[10px] font-bold text-blue-400 uppercase tracking-wider font-mono">
            <HardHat className="w-3.5 h-3.5" /> Site Operations & Project Management
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
              Portal Manajemen Proyek Kontraktor Terintegrasi
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Kendalikan kemajuan fisik (S-Curve & Gantt), kontrol anggaran belanja (RAB), kelola pemesanan logistik (PO), inventaris, ketenagakerjaan SDM, hingga tinjauan cerdas AI dengan akurasi tinggi.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-6">
            <div>
              <span className="block text-lg font-black text-blue-500">100%</span>
              <span className="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider font-mono">Data Terenkripsi</span>
            </div>
            <div>
              <span className="block text-lg font-black text-indigo-400">Offline-Ready</span>
              <span className="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider font-mono">Sinkronisasi Firestore</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-[10px] text-slate-500 font-mono space-y-1">
          <p>© {new Date().getFullYear()} {portalSettings?.companyName || "PT Foresyndo Group"}. All rights reserved.</p>
          {portalSettings?.companyAddress && (
            <p className="truncate max-w-sm">{portalSettings.companyAddress}</p>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Authentic standard login forms */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 relative z-10">
        <div className="w-full max-w-md space-y-8 bg-[#0f172a] border border-slate-800 p-8 rounded-2xl shadow-xl">
          
          <div className="text-center space-y-1.5">
            <h3 className="text-xl font-extrabold text-white">Selamat Datang di Portal</h3>
            <p className="text-xs text-slate-400">Pilih metode login yang sesuai untuk masuk ke dasbor proyek Anda</p>
          </div>

          {/* Form Actions Message statuses */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/20 border border-rose-900/60 text-rose-400 rounded-xl text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-950/60 text-emerald-400 rounded-xl text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN TABS OR FORM BLOCK */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-350">Username Administrator <span className="text-rose-500">*</span></label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none text-white transition placeholder-slate-600"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-350">Password <span className="text-rose-500">*</span></label>
                <span className="text-[10px] text-slate-500 font-mono">Min. 6 karakter</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none text-white transition placeholder-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Simulated target Role designation */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-350">Masuk Sebagai Peran (Role)</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none text-white transition"
              >
                <option value={UserRole.ADMIN}>Administrator Utama (Admin)</option>
                <option value={UserRole.DIREKTUR}>Direktur Jenderal (Direktur)</option>
                <option value={UserRole.PROJECT_MANAGER}>Project Manager (PM)</option>
                <option value={UserRole.FINANCE}>Manajer Keuangan (Finance)</option>
                <option value={UserRole.SITE_ENGINEER}>Site Engineer Lapangan</option>
                <option value={UserRole.QC_ENGINEER}>QC Quality Inspector</option>
                <option value={UserRole.SAFETY_OFFICER}>Petugas K3 (Safety Officer)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loadingAuth}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/10 transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memvalidasi Data...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Dengan Kredensial</span>
                </>
              )}
            </button>
          </form>

          {/* Divider line for Google Authentication */}
          <div className="relative py-2 flex items-center justify-center overflow-hidden">
            <span className="absolute inset-x-0 h-[1px] bg-slate-800" />
            <span className="relative z-10 px-4 bg-[#0f172a] text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Atau</span>
          </div>

          {/* GOOGLE SIGN-IN BUTTON */}
          <button
            onClick={signInWithGoogle}
            disabled={loadingAuth}
            className="w-full py-2.5 border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-3 transition cursor-pointer hover:bg-slate-850"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Masuk Menggunakan Akun Google</span>
          </button>

          {/* Quick Info Box about setting up the admin credential */}
          <div className="p-3 bg-blue-950/20 rounded-xl border border-blue-900/40 text-[10.5px] text-blue-400 font-medium leading-normal">
            💡 <b>Demo Kredensial Administrator:</b>
            <div className="flex items-center justify-between mt-1 pt-1 border-t border-blue-900/50 font-mono">
              <span className="opacity-80">Username: <b className="text-white font-mono select-all">{targetUsername}</b></span>
              <span className="opacity-80">Password: <b className="text-white font-mono select-all">{targetPassword}</b></span>
            </div>
            <p className="mt-1.5 text-[9.5px] text-slate-500 leading-normal">
              Informasi profil ini disinkronkan langsung dengan Firestore. Anda dapat mengubah preferensi sandi & nama perusahaan kapan saja melalui tab <b>Pengaturan Portal</b>.
            </p>
          </div>

          {/* DEVELOPER SANDBOX QUICK ACCESS SECTION */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">Sandbox Quick Demo Bypass</span>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => signInWithBypass(UserRole.DIREKTUR, "Foresyndo Direktur VIP")}
                className="p-2.5 text-slate-350 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition cursor-pointer flex flex-col justify-start"
              >
                <span className="font-bold text-[11px] text-blue-400">Direktur</span>
                <span className="text-[9px] text-slate-500 mt-0.5 leading-none">Anggaran & S-Kurva</span>
              </button>

              <button
                type="button"
                onClick={() => signInWithBypass(UserRole.PROJECT_MANAGER, "Budi Hartono (PM)")}
                className="p-2.5 text-slate-350 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition cursor-pointer flex flex-col justify-start"
              >
                <span className="font-bold text-[11px] text-indigo-400">Project Manager</span>
                <span className="text-[9px] text-slate-500 mt-0.5 leading-none">RAB & Jadwal Gantt</span>
              </button>

              <button
                type="button"
                onClick={() => signInWithBypass(UserRole.FINANCE, "Siti Rahma (Finance)")}
                className="p-2.5 text-slate-350 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition cursor-pointer flex flex-col justify-start"
              >
                <span className="font-bold text-[11px] text-emerald-400">Finance</span>
                <span className="text-[9px] text-slate-500 mt-0.5 leading-none">Mutasi & PO Kas</span>
              </button>

              <button
                type="button"
                onClick={() => signInWithBypass(UserRole.SITE_ENGINEER, "Anton Sanjaya (Engineer)")}
                className="p-2.5 text-slate-350 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition cursor-pointer flex flex-col justify-start"
              >
                <span className="font-bold text-[11px] text-amber-500">Site Engineer</span>
                <span className="text-[9px] text-slate-500 mt-0.5 leading-none">Ajukan RFI & Dokumen</span>
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
