import React, { useState, useEffect } from 'react';
import { X, Zap, CheckCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const ScannerModal = ({ onClose, onScanComplete }) => {
    const [scanning, setScanning] = useState(true);
    const [scanResult, setScanResult] = useState(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText, decodedResult) {
            // Handle the scanned code as you like, for example:
            console.log(`Code matched = ${decodedText}`, decodedResult);
            setScanning(false);
            setScanResult(decodedText);
            scanner.clear();
            onScanComplete(decodedText);
        }

        function onScanFailure(error) {
            // handle scan failure, usually better to ignore and keep scanning.
            // for example:
            // console.warn(`Code scan error = ${error}`);
        }

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5-qrcode scanner. ", error);
            });
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in fade-in duration-500">
            <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start pt-12">
                <button onClick={onClose} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white/80 border border-white/10"><X size={20} /></button>
                <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>Live Cam</span>
                </div>
                <button className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white/80 border border-white/10"><Zap size={20} /></button>
            </div>
            <div className="flex-1 relative overflow-hidden bg-gray-900 flex items-center justify-center">
                {!scanResult ? (
                    <div id="reader" className="w-full max-w-sm"></div>
                ) : (
                    <div className="flex flex-col items-center justify-center animate-in zoom-in duration-300">
                        <CheckCircle size={64} className="text-emerald-400 mb-4" />
                        <p className="text-white font-bold">Scan Successful</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScannerModal;
