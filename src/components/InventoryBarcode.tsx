import React, { useState } from "react";
import { useProject } from "../context/ProjectContext";
import { QrCode, ScanLine, ArrowUpRight, ArrowDownLeft, Sliders, AlertTriangle, Hammer, HelpCircle } from "lucide-react";

export const InventoryBarcode: React.FC = () => {
  const { inventory, mutations, addMaterialMutation } = useProject();
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [txType, setTxType] = useState<"masuk" | "keluar">("masuk");
  const [quantity, setQuantity] = useState<number>(10);
  const [notes, setNotes] = useState<string>("");
  
  const [activeQRCode, setActiveQRCode] = useState<string>("");
  const [scannerStatus, setScannerStatus] = useState<string>("");

  const handleMutationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    
    // Generate simulated QR Code string
    const simulatedQR = `QR-FOS-${selectedMaterial.replace(/\s+/g, "-").toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
    
    addMaterialMutation({
      materialName: selectedMaterial,
      type: txType === "masuk" ? "masuk" : "keluar",
      qty: quantity,
      date: new Date().toISOString().split("T")[0],
      qrCode: simulatedQR,
      notes: notes || `Mutasi ${txType || "masuk"} umum`
    });

    setQuantity(10);
    setNotes("");
    setScannerStatus(`Berhasil mencatat mutasi: ${selectedMaterial} sebanyak ${quantity} unit!`);
    setTimeout(() => setScannerStatus(""), 4000);
  };

  // Simulated Barcode Scanner trigger
  const runSimulatedScan = (materialName: string) => {
    setScannerStatus(`Memindai Barcode/QR Code untuk ${materialName}...`);
    setTimeout(() => {
      setSelectedMaterial(materialName);
      const randQR = `FOS-QR-${materialName.substr(0,4).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
      setActiveQRCode(randQR);
      setScannerStatus(`[PINDAI BERHASIL] Kode: ${randQR} terdeteksi sebagai ${materialName}.`);
    }, 1200);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Material & Logistik Gudang</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">Memonitoring sediaan logistik konstruksi, alert minimum stock, mutasi masuk / keluar, dan asisten QR Code</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Inventory list & Alerts */}
        <div className="lg:col-span-1 border-r border-slate-100 dark:border-slate-800 pr-0 lg:pr-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center">
            <Sliders className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Sediaan Stok Saat Ini
          </h3>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {inventory.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs">Belum ada komoditas gudang terpasang.</p>
            ) : (
              inventory.map((item) => {
                const isUnderMinStock = item.currentStock < item.minStock;
                return (
                  <div 
                    key={item.id} 
                    className={`p-3 rounded-lg border transition ${
                      isUnderMinStock 
                        ? "bg-rose-50/50 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900" 
                        : "bg-slate-50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{item.materialName}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Min: {item.minStock} {item.unit} | Aktif</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-extrabold font-mono block ${isUnderMinStock ? "text-rose-600" : "text-slate-800 dark:text-white"}`}>
                          {item.currentStock} {item.unit}
                        </span>
                        {isUnderMinStock && (
                          <span className="text-[8px] bg-rose-500 text-white font-bold uppercase rounded px-1.5 py-[1.5px] tracking-wide inline-block mt-1">
                            LOW STOK!
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Simulator Action Trigger button */}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 pt-2 text-[10px]">
                      <button 
                        onClick={() => runSimulatedScan(item.materialName)}
                        className="text-amber-500 hover:text-amber-600 flex items-center font-bold cursor-pointer"
                      >
                        <ScanLine className="w-3 mr-1" />
                        Pindai QR
                      </button>
                      <span className="text-slate-400 font-mono text-[9px]">{item.lastUpdated}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Goods mutation form */}
        <div className="lg:col-span-1 border-r border-slate-100 dark:border-slate-800 pr-0 lg:pr-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider mb-4 flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Catat Mutasi Material
          </h3>

          <form onSubmit={handleMutationSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Pilih Barang</label>
              <select 
                value={selectedMaterial} 
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 rounded p-2 border border-slate-200 dark:border-slate-700 focus:outline-none"
                required
              >
                <option value="">-- Silahkan Pilih --</option>
                {inventory.map(i => (
                  <option key={i.id} value={i.materialName}>{i.materialName}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Tipe Transaksi</label>
                <div className="flex bg-slate-50 dark:bg-slate-800 rounded p-1 border border-slate-200 dark:border-slate-700">
                  <button 
                    type="button"
                    onClick={() => setTxType("masuk")}
                    className={`flex-1 text-[10px] font-bold py-1 rounded transition cursor-pointer ${txType === "masuk" ? "bg-amber-500 text-white" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Masuk
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTxType("keluar")}
                    className={`flex-1 text-[10px] font-bold py-1 rounded transition cursor-pointer ${txType === "keluar" ? "bg-amber-500 text-white" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Keluar
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Kuantitas</label>
                <input 
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 rounded p-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Catatan Mutasi</label>
              <textarea 
                placeholder="misal: Diterima dari PT Holcim Abadi"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 rounded p-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                rows={2}
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded shadow transition cursor-pointer"
            >
              Simpan Mutasi
            </button>
          </form>
        </div>

        {/* Simulated Scanner camera / qr detail */}
        <div className="lg:col-span-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider mb-4 flex items-center">
            <ScanLine className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Scanner & QR Code Simulator
          </h3>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center h-[280px] relative overflow-hidden">
            {scannerStatus ? (
              <div className="absolute top-2 inset-x-2 bg-slate-800 text-[10px] font-semibold text-amber-500 py-1.5 px-3 rounded text-left border border-amber-500/20 z-10 flex items-center">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2 animate-ping" />
                {scannerStatus}
              </div>
            ) : (
              <div className="absolute top-2 inset-x-2 bg-slate-800/50 text-[10px] text-slate-400 py-1 px-3 rounded text-left flex items-center">
                Scanner camera active in background...
              </div>
            )}

            {/* Scanner aiming reticle or Qrcode representation */}
            {activeQRCode ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="p-4 bg-white rounded-lg border-2 border-amber-500 flex items-center justify-center">
                  <div className="bg-slate-950 p-2 text-white font-mono text-[9px] select-all flex flex-col items-center">
                    <QrCode className="w-16 h-16 mb-1 text-slate-950 bg-white p-1 rounded" />
                    <span className="font-bold text-slate-400">{activeQRCode}</span>
                  </div>
                </div>
                <span className="text-slate-300 font-bold text-[10px] bg-slate-800 px-3 py-1 rounded">
                  Komoditas: {selectedMaterial}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                <ScanLine className="w-14 h-14 text-slate-600 animate-pulse" />
                <p className="text-xs text-slate-400 max-w-xs leading-normal">
                  Pilih salah satu item material di panel kiri lalu klik <strong>Pindai QR</strong> untuk mensimulasikan pembacaan barcode cepat.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
