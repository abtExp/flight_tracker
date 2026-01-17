import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, CheckCircle, ScanLine } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

const ScannerModal = ({ onClose, onScanComplete }) => {
    const [scanResult, setScanResult] = useState(null);
    const scannerRef = useRef(null);

    useEffect(() => {
        // Initialize scanner with the element ID "reader"
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: window.innerWidth / window.innerHeight
        };

        // Start scanning immediately with back camera
        scanner.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanFailure
        ).catch(err => {
            console.error("Error starting scanner", err);
        });

        function onScanSuccess(decodedText, decodedResult) {
            console.log(`Code matched = ${decodedText}`, decodedResult);
            setScanResult(decodedText);

            if (navigator.vibrate) navigator.vibrate(200);

            // Stop scanning
            scanner.stop().then(() => {
                scanner.clear();
            }).catch(err => console.error("Failed to stop scanner", err));

            setTimeout(() => {
                onScanComplete(decodedText);
            }, 800);
        }

        function onScanFailure(error) {
            // console.warn(`Code scan error = ${error}`);
        }

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current.clear();
                }).catch(err => console.error("Failed to cleanup scanner", err));
            }
        };
    }, [onScanComplete]);

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in fade-in duration-500">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start pt-12 bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={onClose} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-white/20 transition-colors"><X size={20} /></button>
                <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>Live Scanner</span>
                </div>
                <button className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-white/20 transition-colors"><Zap size={20} /></button>
            </div>

            {/* Scanner Area */}
            <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
                <div id="reader" className="w-full h-full absolute inset-0 [&>video]:!object-cover [&>video]:!w-full [&>video]:!h-full"></div>

                {!scanResult ? (
                    /* Overlay UI */
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                        {/* Blurred Backgrounds */}
                        <div className="absolute inset-0 bg-black/50 mask-image-scrim"></div>

                        {/* Cutout Area */}
                        <div className="relative w-72 h-72 rounded-3xl overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                            <div className="absolute inset-0 border-[3px] border-transparent border-t-blue-500 border-r-blue-500 rounded-tr-3xl"></div>
                            <div className="absolute inset-0 border-[3px] border-transparent border-b-blue-500 border-l-blue-500 rounded-bl-3xl"></div>
                            <div className="absolute inset-0 border-[3px] border-transparent border-t-blue-500 border-l-blue-500 rounded-tl-3xl"></div>
                            <div className="absolute inset-0 border-[3px] border-transparent border-b-blue-500 border-r-blue-500 rounded-br-3xl"></div>

                            <ScanLine className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400/50 w-full h-full p-12 animate-ping opacity-20" />
                        </div>

                        <p className="mt-12 text-white/80 font-medium text-sm bg-black/40 px-6 py-3 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                            Align QR code within frame
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center animate-in zoom-in duration-300 z-30 relative">
                        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.6)] mb-6">
                            <CheckCircle size={48} className="text-white" strokeWidth={3} />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-2 drop-shadow-lg">Scan Complete</h3>
                        <p className="text-white/80 font-medium text-lg drop-shadow-md">Processing flight details...</p>
                    </div>
                )}
            </div>

            <style>{`
                #reader { border: none !important; }
                #reader video { object-fit: cover; width: 100% !important; height: 100% !important; }
            `}</style>
        </div>
    );
};

export default ScannerModal;
