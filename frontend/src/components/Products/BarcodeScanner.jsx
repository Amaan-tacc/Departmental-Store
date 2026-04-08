// src/components/Products/BarcodeScanner.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useProducts } from '../../context/ProductContext';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, AlertCircle, CheckCircle, Search, FlipHorizontal } from 'lucide-react';

const BarcodeScanner = ({ onClose, onScan }) => {
  const { searchByBarcode } = useProducts();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [isMirrored, setIsMirrored] = useState(true); // Default to mirrored for natural look
  const scannerRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize Cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available for scanning
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
          );
          const initialCamera = backCamera ? backCamera.id : devices[0].id;
          setSelectedCamera(initialCamera);
          startScanner(initialCamera);
        } else {
          setError('No cameras found on this device.');
        }
      })
      .catch((err) => {
        console.error('Camera access error:', err);
        setError('Camera access denied. Please check permissions.');
      });

    return () => {
      // Clean up scanner on unmount
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop()
          .then(() => {
            console.log('Scanner stopped on unmount');
            setCameraActive(false);
          })
          .catch(err => console.error('Failed to stop scanner on unmount', err));
      }
    };
  }, []);

  const startScanner = async (cameraId) => {
    try {
      if (scannerRef.current) {
          await stopScanner();
      }

      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const formatsToSupport = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.AZTEC,
        Html5QrcodeSupportedFormats.CODABAR,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
        Html5QrcodeSupportedFormats.MAXICODE,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.PDF_417,
        Html5QrcodeSupportedFormats.RSS_14,
        Html5QrcodeSupportedFormats.RSS_EXPANDED,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION
      ];

      const config = {
        fps: 30, // Increased FPS for faster detection
        qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const boxSize = Math.floor(minEdge * 0.6);
            return {
                width: Math.max(260, boxSize),
                height: Math.max(160, Math.floor(boxSize * 0.6))
            };
        },
        aspectRatio: 1.777778, 
        disableFlip: false,
        formatsToSupport: formatsToSupport
      };

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          // Success: Stop scanner immediately to turn off webcam
          stopScanner();
          handleBarcodeSearch(decodedText);
          if (window.navigator.vibrate) window.navigator.vibrate(100);
        },
        (errorMessage) => {
          // Ignore
        }
      );
      setCameraActive(true);
      setError('');
    } catch (err) {
      console.error('Start scanner error:', err);
      setError('Failed to start camera. It might be used by another app.');
      setCameraActive(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
       try {
         await scannerRef.current.stop();
         setCameraActive(false);
       } catch (err) {
         console.error('Stop scanner error:', err);
       }
    }
  };

  const handleCameraChange = (e) => {
    const newId = e.target.value;
    setSelectedCamera(newId);
    startScanner(newId);
  };

  const toggleMirror = () => {
    setIsMirrored(!isMirrored);
  };

  const handleBarcodeSearch = async (barcode) => {
    if (loading) return;
    setLoading(true);
    setError('');
    setScanResult(null);

    try {
      const result = await searchByBarcode(barcode);
      
      if (result.success) {
        setScanResult(result.data.product);
        setBarcodeInput(barcode);
      } else {
        setError(result.error || 'Product not found with this barcode');
        // If not found, maybe restart scanner? 
        // For now, keep it stopped so user can see the error
      }
    } catch (err) {
      setError('Failed to search product');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      handleBarcodeSearch(barcodeInput.trim());
    }
  };

  const handleUseProduct = () => {
    if (scanResult) {
      onScan(scanResult.barcode);
    }
  };

  const handleScanAnother = () => {
    setScanResult(null);
    setBarcodeInput('');
    setError('');
    startScanner(selectedCamera); // Restart camera when user wants to scan again
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative mx-auto border-0 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2.5rem] bg-white overflow-hidden font-sans">
        
        {/* Header */}
        <div className="bg-slate-950 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Camera className="text-white w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase">Smart Scan</h3>
              <p className="text-slate-500 text-xs font-bold -mt-0.5 tracking-wide">
                {cameraActive ? 'WEBCAM ACTIVE' : 'SCANNER STANDBY'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          {/* Viewfinder Section */}
          <div className="relative w-full aspect-[4/3] bg-black rounded-[2rem] overflow-hidden mb-8 shadow-inner ring-1 ring-slate-200">
            <div 
                id="reader" 
                className={`w-full h-full ${isMirrored ? 'mirrored' : ''}`}
            ></div>
            
            {!cameraActive && !scanResult && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-950">
                <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold tracking-widest uppercase opacity-50">Syncing Lens...</p>
              </div>
            )}

            {scanResult && !cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm transition-all duration-500">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl animate-in zoom-in duration-300">
                        <CheckCircle className="text-white w-10 h-10" />
                    </div>
                </div>
            )}

            {/* Scanning Overlay */}
            {cameraActive && !scanResult && (
               <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-4/5 h-1/2 border-2 border-indigo-500/30 rounded-3xl relative overflow-hidden bg-indigo-500/5">
                      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 via-transparent to-indigo-500/20 opacity-30"></div>
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.8)] animate-scan-beam"></div>
                  </div>
                  
                  {/* Corner Accents */}
                  <div className="absolute top-10 left-10 w-8 h-8 border-t-4 border-l-4 border-white/40 rounded-tl-xl" />
                  <div className="absolute top-10 right-10 w-8 h-8 border-t-4 border-r-4 border-white/40 rounded-tr-xl" />
                  <div className="absolute bottom-10 left-10 w-8 h-8 border-b-4 border-l-4 border-white/40 rounded-bl-xl" />
                  <div className="absolute bottom-10 right-10 w-8 h-8 border-b-4 border-r-4 border-white/40 rounded-br-xl" />
               </div>
            )}

            {/* Mirror Toggle */}
            {cameraActive && (
              <button 
                onClick={toggleMirror}
                className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-lg text-white/70 hover:text-white transition-colors"
                title="Mirror Camera"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Controls Area */}
          <div className="space-y-6">
            {cameras.length > 1 && cameraActive && (
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Camera</span>
                  <select
                    value={selectedCamera}
                    onChange={handleCameraChange}
                    className="text-xs font-bold text-slate-900 bg-slate-100 border-0 rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-600/20 cursor-pointer appearance-none shadow-sm"
                  >
                    {cameras.map(cam => (
                      <option key={cam.id} value={cam.id}>{cam.label || `LENS-${cameras.indexOf(cam) + 1}`}</option>
                    ))}
                  </select>
                </div>
              )}

            {error && (
              <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-xl flex items-start gap-4 animate-in fade-in zoom-in duration-300">
                <AlertCircle className="w-6 h-6 text-rose-500 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight">Lookup Error</h4>
                  <p className="text-xs text-rose-700 font-bold leading-relaxed">{error}</p>
                  <button 
                    onClick={() => startScanner(selectedCamera)}
                    className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 underline"
                  >
                    Retry Camera
                  </button>
                </div>
              </div>
            )}

            {scanResult ? (
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                    <CheckCircle className="text-white w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white leading-tight uppercase tracking-tight">Verified</h4>
                    <p className="text-emerald-500 text-xs font-black tracking-widest">{scanResult.barcode}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8 border-y border-white/5 py-6">
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Product</p>
                    <p className="text-base font-bold text-white truncate">{scanResult.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Unit Price</p>
                    <p className="text-base font-bold text-emerald-400">${scanResult.price}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Stock Level</p>
                    <p className={`text-base font-bold ${scanResult.quantity < 10 ? 'text-amber-500' : 'text-white'}`}>
                      {scanResult.quantity} Units
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Brand</p>
                    <p className="text-base font-bold text-white truncate">{scanResult.brand || 'GENERIC'}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleUseProduct}
                    className="flex-[2] py-4 px-6 bg-indigo-600 text-white text-sm font-black rounded-2xl hover:bg-indigo-500 active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-widest"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={handleScanAnother}
                    className="flex-1 py-4 px-6 bg-white/5 text-slate-300 text-sm font-black rounded-2xl hover:bg-white/10 active:scale-[0.98] transition-all border border-white/10 uppercase tracking-widest"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="block w-full pl-12 pr-32 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-slate-950 text-sm font-black placeholder:text-slate-400 placeholder:font-bold focus:outline-none focus:ring-0 focus:border-indigo-500 transition-all font-mono"
                  placeholder="SN-CODE-VALUE"
                  disabled={loading}
                />
                <div className="absolute inset-y-2 right-2 flex items-center">
                    <button
                        type="submit"
                        disabled={loading || !barcodeInput.trim()}
                        className="h-full px-6 bg-slate-900 text-white text-[10px] font-black rounded-xl hover:bg-black disabled:opacity-50 transition-all flex items-center gap-2 uppercase tracking-widest shadow-lg shadow-black/10"
                    >
                        {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Enter'}
                    </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* CSS for Premium Scanner */}
        <style>
          {`
            @keyframes scan-beam {
              0% { top: 0%; opacity: 0; }
              20% { opacity: 1; }
              80% { opacity: 1; }
              100% { top: 100%; opacity: 0; }
            }
            .animate-scan-beam {
              animation: scan-beam 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
            #reader video {
                object-fit: cover !important;
                border-radius: 2rem !important;
            }
            .mirrored video {
                transform: scaleX(-1) !important;
            }
            #reader {
                background: transparent !important;
                border: none !important;
            }
            #reader__status_span {
                display: none !important;
            }
            #reader__scan_region {
                background: transparent !important;
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default BarcodeScanner;