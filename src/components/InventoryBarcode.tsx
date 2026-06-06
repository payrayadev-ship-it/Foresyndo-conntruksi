import React, { useState, useEffect, useRef } from "react";
import { useProject } from "../context/ProjectContext";
import QRCode from "qrcode";
import { 
  QrCode, ScanLine, ArrowUpRight, ArrowDownLeft, Sliders, AlertTriangle, 
  Printer, Download, Eye, CheckCircle, RefreshCw, Layers, Plus, Minimize2,
  Trash2, ClipboardList, Package, Info, CheckSquare, Sparkles, HelpCircle, FileText
} from "lucide-react";

export const InventoryBarcode: React.FC = () => {
  const { inventory, mutations, addMaterialMutation } = useProject();
  
  // Selection and form states
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [txType, setTxType] = useState<"masuk" | "keluar">("masuk");
  const [quantity, setQuantity] = useState<number>(10);
  const [notes, setNotes] = useState<string>("");
  
  // QR codes generated data URL cache
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});
  const [activeQRCodeData, setActiveQRCodeData] = useState<{ id: string; name: string; url: string; payload: string } | null>(null);
  
  // Scanner and simulation logs
  const [scannerStatus, setScannerStatus] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanHistory, setScanHistory] = useState<Array<{ time: string; material: string; type: string; qty: number }>>([]);

  // Generate QR Code data URLs for each inventory item
  useEffect(() => {
    const generateAllQRCodes = async () => {
      const urls: Record<string, string> = {};
      for (const item of inventory) {
        // Structured protocol payload representing the item
        const qrPayload = JSON.stringify({
          app: "ForesyndoConstrukPro",
          id: item.id,
          name: item.materialName,
          unit: item.unit,
          min: item.minStock
        });
        
        try {
          const url = await QRCode.toDataURL(qrPayload, {
            width: 300,
            margin: 1,
            color: {
              dark: "#0f172a", // Elegant Slate-900 border color
              light: "#ffffff"
            }
          });
          urls[item.id] = url;
        } catch (err) {
          console.error("Gagal men-generate QR Code untuk " + item.materialName, err);
        }
      }
      setQrCodeUrls(urls);

      // Auto select the first item to showcase the QR generator on load
      if (inventory.length > 0 && !selectedMaterialId) {
        const first = inventory[0];
        setSelectedMaterialId(first.id);
        const payload = JSON.stringify({
          app: "ForesyndoConstrukPro",
          id: first.id,
          name: first.materialName,
          unit: first.unit,
          min: first.minStock
        });
        QRCode.toDataURL(payload, { width: 300, margin: 1 }).then(url => {
          setActiveQRCodeData({ id: first.id, name: first.materialName, url, payload });
        });
      }
    };

    if (inventory.length > 0) {
      generateAllQRCodes();
    }
  }, [inventory]);

  // Handle selected material changes for active QR Code viewer
  const handleMaterialSelect = async (id: string) => {
    setSelectedMaterialId(id);
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    const payload = JSON.stringify({
      app: "ForesyndoConstrukPro",
      id: item.id,
      name: item.materialName,
      unit: item.unit,
      min: item.minStock
    });

    try {
      const url = await QRCode.toDataURL(payload, {
        width: 350,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff"
        }
      });
      setActiveQRCodeData({ id: item.id, name: item.materialName, url, payload });
    } catch (e) {
      console.error(e);
    }
  };

  // Sound effect synthesizer for positive scanner confirmation beep
  const playBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Pitch (High crisp tone)
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // Volume
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 120);
    } catch (e) {
      console.warn("Audio Context beep playback blocked or unsupported:", e);
    }
  };

  // Simulated material QR Code scanner
  const triggerInstantScan = (id: string) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    setIsScanning(true);
    setScannerStatus(`Mensejajarkan laser... Memindai label QR Code dari ${item.materialName}`);
    
    setTimeout(() => {
      playBeep();
      setSelectedMaterialId(item.id);
      setIsScanning(false);
      setScannerStatus(`[SUKSES] QR Code terdeteksi! Mengisi muatan form otomatis.`);
      
      // Auto pre-fill the form fields
      setQuantity(10);
      setNotes(`Mutasi cepat via pemindaian Barcode/QR Label [${item.id}]`);
      
      // Log local simulation history
      setScanHistory(prev => [
        {
          time: new Date().toLocaleTimeString(),
          material: item.materialName,
          type: txType,
          qty: 10
        },
        ...prev.slice(0, 4)
      ]);

      // Highlight status for 3 seconds
      setTimeout(() => setScannerStatus(""), 3500);
    }, 900);
  };

  // Submit handler for stock mutations
  const handleMutationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventory.find(i => i.id === selectedMaterialId);
    if (!item) return;

    const selectedMaterialName = item.materialName;
    const generatedQRStr = `QR-FOS-${item.id.toUpperCase()}-${Math.floor(Math.random() * 8000 + 1000)}`;

    addMaterialMutation({
      materialName: selectedMaterialName,
      type: txType === "masuk" ? "masuk" : "keluar",
      qty: quantity,
      date: new Date().toISOString().split("T")[0],
      qrCode: generatedQRStr,
      notes: notes || `Sesi mutasi gudang digital QR`
    });

    setQuantity(10);
    setNotes("");
    
    setScannerStatus(`Sukses mencatat mutasi: ${selectedMaterialName} (${txType.toUpperCase()}) sebanyak ${quantity} ${item.unit}.`);
    playBeep();
    setTimeout(() => setScannerStatus(""), 3500);
  };

  // Self printing handler
  const handlePrintLabel = () => {
    const origTitle = document.title;
    document.title = `QR_LABEL_${activeQRCodeData?.name.replace(/\s+/g, "_")}`;
    window.print();
    document.title = origTitle;
  };

  return (
    <div id="logistic-qr-module" className="space-y-6">
      
      {/* Top Welcome Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-505/20 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest font-mono">
              ⚡ LOGISTIK & GUDANG DIGITAL
            </span>
            <h2 className="text-xl font-extrabold text-slate-850 dark:text-white flex items-center gap-2 mt-2">
              <QrCode className="w-5 h-5 text-amber-500" />
              Sistem Generator & Pemindai QR Code Material
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Setiap material secara otomatis memiliki QR Code unik. Cetak stiker label untuk ditempel di palet/peti material, lalu scan untuk mutasi stok masuk/keluar instan tanpa pengetikan manual.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">Scanner Engine v2.1 (Online)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* PANEL 1: INVENTORY STOCKS INDEX (COL-SPAN 4) */}
        <div className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-black text-slate-405 dark:text-slate-405 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Sliders className="w-4 h-4 text-slate-500" />
              Sediaan Stok Terdaftar
            </h3>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-505 dark:text-slate-400 px-2 py-0.5 rounded font-mono font-bold">
              {inventory.length} Jenis
            </span>
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {inventory.length === 0 ? (
              <div className="text-center py-12 text-slate-450 dark:text-slate-600 space-y-2">
                <Package className="w-12 h-12 mx-auto stroke-1" />
                <p className="text-xs">Belum ada material yang terdaftar dalam proyek ini.</p>
              </div>
            ) : (
              inventory.map((item) => {
                const isUnderMinStock = item.currentStock < item.minStock;
                const isSelected = selectedMaterialId === item.id;
                
                return (
                  <div 
                    key={item.id} 
                    onClick={() => handleMaterialSelect(item.id)}
                    className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer text-left relative overflow-hidden group ${
                      isSelected 
                        ? "bg-slate-50 dark:bg-slate-850/60 border-amber-500/80 ring-1 ring-amber-500/50" 
                        : isUnderMinStock
                        ? "bg-rose-50/30 dark:bg-rose-950/15 border-rose-200/80 hover:border-rose-350"
                        : "bg-slate-50/50 dark:bg-[#121824]/40 border-slate-150 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {/* Selected Left Colored Border */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1 ${isSelected ? "bg-amber-500" : isUnderMinStock ? "bg-rose-500" : "bg-transparent"}`} />

                    <div className="flex justify-between items-start pl-1">
                      <div className="space-y-1">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-white block group-hover:text-amber-500 transition-colors">
                          {item.materialName}
                        </span>
                        <div className="flex flex-wrap items-center gap-1 text-[9.5px] text-slate-400 font-mono">
                          <span>Min: <b className="text-slate-600 dark:text-slate-300 font-bold">{item.minStock}</b> {item.unit}</span>
                          <span>•</span>
                          <span className="uppercase font-bold tracking-tighter text-indigo-500 font-mono">ID: {item.id}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-xs font-black font-mono block ${isUnderMinStock ? "text-rose-600 dark:text-rose-400 animate-pulse" : "text-slate-800 dark:text-slate-100"}`}>
                          {item.currentStock} {item.unit}
                        </span>
                        {isUnderMinStock && (
                          <span className="text-[8px] bg-rose-500 dark:bg-rose-600 text-white font-mono font-bold tracking-wider px-1 rounded uppercase inline-block mt-0.5">
                            LOW STOCK
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer interactive option to fast-trigger Simulated hardware scan */}
                    <div className="mt-3.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between text-[10px] pl-1 font-mono">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerInstantScan(item.id);
                        }}
                        className="text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                        title="Simulasikan Scan Label Tempel"
                      >
                        <ScanLine className="w-3.5 h-3.5 text-amber-500" />
                        Pindai Barcode (Scan)
                      </button>

                      {/* Display mini thumbnail of actual generated QR */}
                      {qrCodeUrls[item.id] ? (
                        <div className="w-8 h-8 p-0.5 bg-white border border-slate-150 rounded shadow-sm flex items-center justify-center opacity-85 hover:opacity-100 transition-opacity">
                          <img src={qrCodeUrls[item.id]} alt="QR Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL 2: REAL QR CODE GENERATOR & LABEL DESIGN (COL-SPAN 4) */}
        <div className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black text-slate-405 dark:text-slate-405 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <QrCode className="w-4 h-4 text-amber-500 animate-pulse" />
                Desain Label QR Pintar
              </h3>
              <span className="text-[9.5px] uppercase font-mono font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded">
                Generated
              </span>
            </div>

            {activeQRCodeData ? (
              <div className="space-y-4">
                
                {/* Visual rendering of customizable Warehouse label */}
                <div 
                  id="printable-qr-label"
                  className="bg-slate-50 dark:bg-[#121824]/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden select-text shadow-inner"
                >
                  {/* Decorative background grid pattern */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-25 pointer-events-none" />
                  
                  {/* Tag label design */}
                  <div className="relative z-10 w-full space-y-4">
                    {/* Header bar of printed label */}
                    <div className="border-b-2 border-dashed border-slate-300 dark:border-slate-700 pb-2.5 flex items-center justify-between font-mono text-[9.5px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300 tracking-wider">FORESYND GUDANG LOGISTIK</span>
                      <span className="text-slate-400">LABEL 1.0</span>
                    </div>

                    {/* Actual dynamic high-definition generated QR Code */}
                    <div className="p-3.5 bg-white rounded-2xl shadow-md inline-block border border-slate-200/85">
                      <img 
                        src={activeQRCodeData.url} 
                        alt="Scannable QR Label" 
                        className="w-40 h-40 object-contain mx-auto" 
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="space-y-1.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-3 rounded-xl shadow-sm text-left font-mono">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold">MATERIAL:</span>
                        <span className="text-slate-800 dark:text-white font-extrabold truncate max-w-[150px]">{activeQRCodeData.name}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold font-mono">UNIQUE ID:</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold text-[9.5px] select-all">{activeQRCodeData.id}</span>
                      </div>
                      <div className="border-t border-dashed border-slate-200 dark:border-slate-800 my-1.5" />
                      <div className="text-[8.5px] text-center text-slate-450 leading-relaxed font-mono">
                        "Pindai barcode ini di lapangan Proyek untuk merekam mutasi barang secara digital."
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info summary about payload validation */}
                <div className="p-3 bg-blue-50 dark:bg-slate-800/60 border border-blue-150 dark:border-slate-850 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-blue-700 dark:text-blue-400">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Metadata Payload Valid :</span>
                  </div>
                  <p className="text-[9.5px] font-mono text-slate-500 dark:text-slate-450 whitespace-pre-wrap break-all bg-white dark:bg-slate-950 p-2 rounded border border-blue-100 dark:border-slate-900 leading-snug">
                    {activeQRCodeData.payload}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 space-y-2">
                <QrCode className="w-14 h-14 mx-auto stroke-1 text-slate-300 animate-pulse" />
                <p className="text-xs">Pilih material untuk menampilkan pratinjau stiker.</p>
              </div>
            )}
          </div>

          {activeQRCodeData && (
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handlePrintLabel}
                className="py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-250 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Stiker
              </button>
              
              <a
                href={activeQRCodeData.url}
                download={`QR_Label_${activeQRCodeData.name.replace(/\s+/g, "_")}.png`}
                className="py-2.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md text-center"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh PNG
              </a>
            </div>
          )}
        </div>

        {/* PANEL 3: INTERACTIVE TERMINAL & MUTATION FORM (COL-SPAN 4) */}
        <div className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-black text-slate-405 dark:text-slate-405 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <ScanLine className="w-4 h-4 text-slate-500" />
              Terminal Scan & Mutasi Cepat
            </h3>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-505 dark:text-slate-400 px-2 py-0.5 rounded font-mono font-bold">
              Simulator
            </span>
          </div>

          {/* Simulated Scanner Viewscreen wrapper */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center h-[230px] relative overflow-hidden">
            
            {/* Simulated green laser line */}
            {isScanning && (
              <div className="absolute top-0 w-full h-[2px] bg-emerald-500 shadow-[0_0_12px_#10b981] animate-bounce z-15" />
            )}

            {/* Simulated camera grid overlay */}
            <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_45%,rgba(11,15,25,0.73)_100%] pointer-events-none" />

            {/* Quick scanning notification status banners */}
            {scannerStatus ? (
              <div className="absolute top-2 inset-x-2 bg-emerald-950/90 text-[10px] font-semibold text-emerald-400 py-1.5 px-3 rounded-lg border border-emerald-500/20 z-10 flex items-center shadow-lg">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-ping" />
                {scannerStatus}
              </div>
            ) : (
              <div className="absolute top-2 inset-x-2 bg-slate-900/60 text-[10px] text-slate-505 py-1 px-3 rounded text-left flex items-center font-mono">
                Laser Scanner ready... 
              </div>
            )}

            {/* Graphic reticle aiming box */}
            <div className="relative w-36 h-36 border-2 border-dashed border-amber-500/50 flex flex-col items-center justify-center rounded-xl transition duration-150">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-500" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-500" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-500" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500" />

              {isScanning ? (
                <div className="text-center font-mono space-y-1 text-emerald-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto opacity-80" />
                  <span className="text-[9px] uppercase tracking-widest font-black">Scanning...</span>
                </div>
              ) : activeQRCodeData ? (
                <div className="text-center space-y-2">
                  <QrCode className="w-12 h-12 text-slate-500 mx-auto" />
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded truncate max-w-[110px] inline-block font-bold">
                    {activeQRCodeData.name}
                  </span>
                </div>
              ) : (
                <div className="text-center space-y-1.5 text-slate-600">
                  <ScanLine className="w-12 h-12 mx-auto stroke-1" />
                  <span className="text-[9px] font-mono leading-none block">No target</span>
                </div>
              )}
            </div>
          </div>

          {/* Form fields pre-filled from QR code scan */}
          <form onSubmit={handleMutationSubmit} className="space-y-3.5 pt-1">
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Tipe Transaksi</label>
                <div className="flex bg-slate-50 dark:bg-slate-800 rounded-xl p-1 border border-slate-205 dark:border-slate-750">
                  <button 
                    type="button"
                    onClick={() => setTxType("masuk")}
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                      txType === "masuk" 
                        ? "bg-amber-500 text-white shadow-sm" 
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                    }`}
                  >
                    <ArrowDownLeft className="w-3 h-3 text-emerald-500" />
                    Masuk
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTxType("keluar")}
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                      txType === "keluar" 
                        ? "bg-amber-500 text-white shadow-sm" 
                        : "text-slate-500 hover:text-slate-705 dark:hover:text-slate-350"
                    }`}
                  >
                    <ArrowUpRight className="w-3 h-3 text-rose-500" />
                    Keluar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Kuantitas Terpindai</label>
                <input 
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 rounded-xl p-2 border border-slate-202 dark:border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400">Catatan Mutasi</label>
              <textarea 
                placeholder="cth: Masuk dari Supplier via QR, Retur Lapangan, atau Mutasi Log..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 rounded-xl p-2 border border-slate-200 dark:border-slate-700/85 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-normal"
                rows={2}
              />
            </div>

            <button 
              type="submit"
              disabled={!selectedMaterialId}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckSquare className="w-4 h-4" />
              Simpan Mutasi Gudang
            </button>
          </form>

          {/* Quick logs of simulated activity */}
          {scanHistory.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
              <div className="flex justify-between items-center text-[9.5px] font-bold text-slate-400 font-mono uppercase">
                <span>Aktivitas Terminal Terkini</span>
                <span className="text-emerald-500 text-[9px] font-bold animate-pulse">Running</span>
              </div>
              
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {scanHistory.map((h, i) => (
                  <div key={i} className="flex justify-between items-center text-[9.5px] p-2 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-150/70 dark:border-slate-800 font-mono">
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${h.type === "masuk" ? "bg-emerald-500" : "bg-rose-500"}`} />
                      <span className="text-slate-450">{h.time}</span>
                      <span className="text-slate-700 dark:text-slate-350 font-bold truncate max-w-[80px]">{h.material}</span>
                    </div>
                    <span className={`font-bold ${h.type === "masuk" ? "text-emerald-600" : "text-rose-600"}`}>
                      {h.type === "masuk" ? "+" : "-"}{h.qty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
