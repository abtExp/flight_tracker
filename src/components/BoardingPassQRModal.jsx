import React from 'react';
import { X, Plane } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatDate } from '../utils/helpers';

const BoardingPassQRModal = ({ flight, onClose }) => {
    const { time: depTime, date: depDate } = formatDate(flight.departure.time);

    // Construct BCBP-like string or JSON for the QR code
    const qrData = JSON.stringify({
        pnr: flight.pnr,
        flight: flight.flightNumber,
        date: flight.departure.time,
        seat: flight.seat
    });

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] overflow-hidden w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10"><X size={20} className="text-gray-600" /></button>
                <div className="pt-12 pb-10 px-8 flex flex-col items-center bg-white">
                    <div className="p-4 border-4 border-gray-900 rounded-3xl mb-4">
                        <QRCodeSVG value={qrData} size={180} level="M" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Scan at Gate</p>
                </div>
                <div className={`bg-gradient-to-br ${flight.brandGradient} p-8 text-white`}>
                    <div className="grid grid-cols-2 gap-4 border-b border-white/20 pb-4 mb-4">
                        <div><span className="text-[9px] opacity-70 uppercase tracking-widest block font-bold mb-1">Passenger</span><span className="font-bold text-sm truncate block">{flight.passenger}</span></div>
                        <div className="text-right"><span className="text-[9px] opacity-70 uppercase tracking-widest block font-bold mb-1">PNR</span><span className="font-mono font-black text-lg">{flight.pnr}</span></div>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm border border-white/10 shadow-sm">{flight.logo}</div>
                            <div className="flex flex-col"><span className="font-bold text-sm leading-none">{flight.airline}</span><span className="text-[10px] opacity-80 font-mono">{flight.flightNumber}</span></div>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-right"><div className="text-xl font-black leading-none">{flight.zone}</div><div className="text-[10px] opacity-80 uppercase tracking-wider font-bold">Zone</div></div>
                            <div className="text-right"><div className="text-xl font-black leading-none">{flight.seat}</div><div className="text-[10px] opacity-80 uppercase tracking-wider font-bold">Seat</div></div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/20 pt-4">
                        <div className="text-left"><div className="text-2xl font-black">{flight.departure.code}</div><div className="text-[10px] opacity-80 uppercase font-bold">{depTime}</div></div>
                        {/* Plane facing Top-Right (default orientation) */}
                        <div className="flex flex-col items-center opacity-60"><Plane size={16} className="rotate-0" /><span className="text-[9px] font-bold mt-1">{depDate}</span></div>
                        <div className="text-right"><div className="text-2xl font-black">{flight.arrival.code}</div><div className="text-[10px] opacity-80 uppercase font-bold">{formatDate(flight.arrival.time).time}</div></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BoardingPassQRModal;
