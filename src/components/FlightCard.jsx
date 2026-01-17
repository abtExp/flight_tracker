import React from 'react';
import {
    Plane, Calendar, Clock, MapPin, QrCode, User,
    Share2, Map, Crown, Award, Armchair
} from 'lucide-react';
import { formatDate, getWeatherIcon } from '../utils/helpers';

const FlightCard = ({ flight, isFeatured, onQRClick }) => {
    const { time: depTime, date: depDate } = formatDate(flight.departure.time);
    const { time: arrTime } = formatDate(flight.arrival.time);

    const getTimeStatus = () => {
        if (flight.status === 'Boarding') return 'Boarding Now';
        const diff = new Date(flight.departure.time) - new Date();
        if (diff < 0) return 'Departed';
        const hoursTotal = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        if (hoursTotal >= 24) {
            const days = Math.floor(hoursTotal / 24);
            const hours = hoursTotal % 24;
            return `Departs in ${days}d ${hours}h`;
        }
        return `Departs in ${hoursTotal}h ${mins}m`;
    };

    return (
        <div className={`relative w-full mb-16 transition-all duration-700 ease-in-out transform ${isFeatured ? 'scale-100 opacity-100' : 'scale-[0.98] opacity-100'}`}>
            <div className="rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] bg-white ring-1 ring-black/5 relative z-10">

                {/* TOP SECTION */}
                <div className={`relative px-5 sm:px-7 pt-6 sm:pt-7 pb-6 sm:pb-8 bg-gradient-to-br ${flight.brandGradient} text-white overflow-hidden`}>
                    <div className="absolute -right-10 -top-12 text-[150px] sm:text-[200px] opacity-[0.25] rotate-[15deg] select-none pointer-events-none mix-blend-overlay">{flight.logo}</div>

                    <div className="relative flex justify-between items-start mb-6">
                        <div className="flex flex-col gap-1.5 flex-1 mr-4">
                            <div className="flex items-center flex-wrap gap-2">
                                <span className="text-xl leading-none">{flight.logo}</span>
                                <span className="font-bold tracking-wide text-lg whitespace-nowrap">{flight.airline}</span>
                                <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border border-white/10">{flight.flightNumber}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${flight.status === 'Boarding' ? 'bg-green-400 animate-pulse' : 'bg-white/80'}`}></div>
                                    <span className="text-[10px] font-bold uppercase tracking-wide leading-none pt-0.5 whitespace-nowrap">{getTimeStatus()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2.5 shrink-0">
                            <div className="bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm whitespace-nowrap">
                                {flight.classType === 'first' && <Crown size={12} className="text-amber-300 fill-current" />}
                                {flight.classType === 'premium' && <Award size={12} className="text-purple-300" />}
                                {flight.classType === 'economy' && <Armchair size={12} className="text-blue-200" />}
                                <span className="text-[10px] font-bold uppercase tracking-widest">{flight.class}</span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-80 bg-black/10 px-2 py-0.5 rounded-md">
                                <Calendar size={10} />
                                <span className="text-[10px] font-bold">{depDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* ROUTE DISPLAY */}
                    <div className="relative flex justify-between items-center z-10 h-28 sm:h-32 px-1">
                        <div className="text-left relative z-20 min-w-fit">
                            <div className="flex items-center gap-1.5 mb-1 opacity-90">{getWeatherIcon(flight.departure.weather)}<span className="text-[11px] font-bold">{flight.departure.temp}</span></div>
                            <div className="text-5xl sm:text-6xl font-black tracking-tighter mb-1 drop-shadow-md leading-none">{flight.departure.code}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-2">{flight.departure.city}</div>
                            <div className="flex items-center gap-1.5 text-white/90 bg-black/10 px-2 py-1 rounded-lg w-fit"><Clock size={12} /><div className="text-xs font-bold uppercase tracking-widest">{depTime}</div></div>
                        </div>

                        {/* FLIGHT PATH ANIMATION */}
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-12 sm:px-16 w-full h-full pointer-events-none">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160">
                                <defs>
                                    <path id="flight-path" d="M 110,80 Q 250,-20 390,80" fill="none" />
                                </defs>

                                {/* Path Line */}
                                <use href="#flight-path" stroke="white" strokeWidth="10" strokeDasharray="20 20" className="opacity-40" />

                                {/* Plane Group */}
                                <g>
                                    <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                                        <mpath href="#flight-path" />
                                    </animateMotion>

                                    <g transform="rotate(45)">
                                        <circle r="24" fill="white" className="drop-shadow-lg" />
                                        <g transform="translate(-12, -12)">
                                            <Plane size={24} className="text-black fill-current" strokeWidth={0} />
                                        </g>
                                    </g>
                                </g>
                            </svg>
                        </div>

                        <div className="text-right relative z-20 min-w-fit">
                            <div className="flex items-center justify-end gap-1.5 mb-1 opacity-90"><span className="text-[11px] font-bold">{flight.arrival.temp}</span>{getWeatherIcon(flight.arrival.weather)}</div>
                            <div className="text-5xl sm:text-6xl font-black tracking-tighter mb-1 drop-shadow-md text-white/95 leading-none">{flight.arrival.code}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-2">{flight.arrival.city}</div>
                            <div className="flex items-center justify-end gap-1.5 text-white/90 bg-black/10 px-2 py-1 rounded-lg w-fit ml-auto"><Clock size={12} /><div className="text-xs font-bold uppercase tracking-widest">{arrTime}</div></div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM SECTION */}
                <div className="relative bg-white px-5 sm:px-7 pb-6 pt-6">
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-7">
                        <div className="flex flex-col justify-center items-center p-2 sm:p-3 rounded-2xl bg-gray-50 border border-gray-100 h-20 sm:h-24">
                            <span className="text-[9px] sm:text-[10px] uppercase text-gray-400 font-extrabold tracking-widest mb-1.5">Gate</span>
                            <span className="text-2xl sm:text-3xl font-black text-gray-900 leading-none">{flight.departure.gate}</span>
                            <span className="text-[8px] sm:text-[9px] font-bold text-gray-500 mt-1 sm:mt-2 uppercase bg-white px-1.5 sm:px-2 py-0.5 rounded border border-gray-200 shadow-sm">Term {flight.departure.terminal}</span>
                        </div>
                        <div className="flex flex-col justify-center items-center p-2 sm:p-3 rounded-2xl bg-gray-50 border border-gray-100 h-20 sm:h-24">
                            <span className="text-[9px] sm:text-[10px] uppercase text-gray-400 font-extrabold tracking-widest mb-1.5">Seat</span>
                            <span className="text-2xl sm:text-3xl font-black text-gray-900 leading-none">{flight.seat}</span>
                        </div>
                        <div className="flex flex-col justify-center items-center p-2 sm:p-3 rounded-2xl bg-gray-50 border border-gray-100 h-20 sm:h-24">
                            <span className="text-[9px] sm:text-[10px] uppercase text-gray-400 font-extrabold tracking-widest mb-1.5">Zone</span>
                            <span className="text-2xl sm:text-3xl font-black text-gray-900 leading-none">{flight.zone}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-end border-t border-gray-100 pt-5">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 mb-0.5"><User size={12} className="text-gray-400" /><span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Passenger</span></div>
                            <span className="text-sm font-bold text-gray-900 leading-none">{flight.passenger}</span>
                            {flight.loyalty && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mt-2 w-fit">{flight.loyalty}</span>}
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="p-2.5 bg-gray-50 rounded-full text-gray-400 hover:text-blue-600 transition-colors"><Map size={18} /></button>
                            <button className="p-2.5 bg-gray-50 rounded-full text-gray-400 hover:text-blue-600 transition-colors"><Share2 size={18} /></button>
                            <button onClick={() => onQRClick(flight)} className="flex flex-col items-end group/qr cursor-pointer hover:opacity-80 pl-2">
                                <QrCode className="text-gray-900 mb-1" size={36} />
                                <span className="text-[9px] font-mono text-gray-400 tracking-widest">PNR: {flight.pnr}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlightCard;
