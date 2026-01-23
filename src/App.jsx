import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Plane, RefreshCw, User, Ticket, History, Plus, Scan, FileText, CheckCircle
} from 'lucide-react';
import { fetchFlights, fetchWeather, fetchFlightStatus, fetchBooking } from './services/api';
import { parseBoardingPass } from './utils/bcbp';
import { parsePDFBoardingPass } from './utils/pdfParser';
import FlightCard from './components/FlightCard';
import ScannerModal from './components/ScannerModal';
import BoardingPassQRModal from './components/BoardingPassQRModal';

export default function App() {
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);
    const [selectedQRFlight, setSelectedQRFlight] = useState(null);
    const [view, setView] = useState('upcoming');
    const [menuOpen, setMenuOpen] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showBookingInput, setShowBookingInput] = useState(false);
    const [bookingId, setBookingId] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchFlights();
                const flightsWithWeather = await Promise.all(data.map(async (flight) => {
                     const depWeather = await fetchWeather(flight.departure.city);
                     const arrWeather = await fetchWeather(flight.arrival.city);
                     return {
                        ...flight,
                        departure: { ...flight.departure, ...depWeather },
                        arrival: { ...flight.arrival, ...arrWeather }
                     };
                }));
                setFlights(flightsWithWeather);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleScanComplete = (data) => {
        const flight = parseBoardingPass(data);
        if (flight) {
            setFlights(prev => [flight, ...prev]);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            setShowScanner(false);
        } else {
            alert('Invalid boarding pass');
        }
    };

    const handlePDFUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const flight = await parsePDFBoardingPass(file);
            if (flight) {
                 setFlights(prev => [flight, ...prev]);
                 setShowSuccess(true);
                 setTimeout(() => setShowSuccess(false), 3000);
            } else {
                alert('Could not parse PDF');
            }
        }
    };

    const handleBookingFetch = async (e) => {
        e.preventDefault();
        if (!bookingId.trim()) return;

        setLoading(true);
        setShowBookingInput(false);
        setMenuOpen(false);
        try {
            const booking = await fetchBooking(bookingId);
            if (booking) {
                // Fetch weather for the new booking
                const depWeather = await fetchWeather(booking.departure.city);
                const arrWeather = await fetchWeather(booking.arrival.city);
                const fullBooking = {
                    ...booking,
                    departure: { ...booking.departure, ...depWeather },
                    arrival: { ...booking.arrival, ...arrWeather }
                };

                setFlights(prev => [fullBooking, ...prev]);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
                setBookingId('');
            } else {
                alert('Booking not found or invalid ID');
            }
        } catch (error) {
            console.error("Error fetching booking:", error);
            alert('Error fetching booking details');
        } finally {
            setLoading(false);
        }
    };

    const filteredFlights = useMemo(() => {
        const now = new Date();
        let result = flights.filter(f => {
            const dep = new Date(f.departure.time);
            return view === 'upcoming' ? dep >= now : dep < now;
        });
        result.sort((a, b) => view === 'past' ? new Date(b.departure.time) - new Date(a.departure.time) : new Date(a.departure.time) - new Date(b.departure.time));
        return result;
    }, [flights, view]);

    return (
        <div className="min-h-screen bg-[#F2F4F6] font-sans text-gray-900 pb-32 max-w-md mx-auto border-x border-gray-200 shadow-2xl relative overflow-hidden">
            <header className="bg-[#F2F4F6]/95 backdrop-blur-xl pt-14 px-8 pb-4 sticky top-0 z-30">
                <div className="flex justify-between items-center">
                    <div><h1 className="text-3xl font-black tracking-tight">My Trips</h1>
                        <div className="mt-2 flex items-center gap-1.5 bg-white border border-gray-200 px-2 py-0.5 rounded-full w-fit">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Live Updates</span>
                        </div>
                    </div>
                    <button className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"><User size={20} /></button>
                </div>
            </header>

            <main className="px-6 pt-6 min-h-[60vh]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center pt-32 space-y-6 animate-pulse">
                        <RefreshCw className="animate-spin text-gray-400" size={24} />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Syncing Flights...</p>
                    </div>
                ) : showSuccess ? (
                    <div className="flex flex-col items-center justify-center pt-32 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-xl mb-6 animate-bounce"><CheckCircle size={48} className="text-white" strokeWidth={3} /></div>
                        <h2 className="text-2xl font-black">Digital Pass Secured</h2>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {filteredFlights.length > 0 ? filteredFlights.map((flight, idx) => (
                            <FlightCard key={flight.id} flight={flight} isFeatured={idx === 0 && view === 'upcoming'} onQRClick={setSelectedQRFlight} />
                        )) : <div className="text-center pt-32 opacity-60"><Ticket size={48} className="mx-auto mb-4 text-gray-400" /><h3 className="text-xl font-bold">No trips found</h3></div>}
                    </div>
                )}
            </main>

            <nav className="fixed bottom-8 left-10 right-10 h-16 bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-white/50 z-30 flex justify-between items-center px-10">
                <button onClick={() => setView('upcoming')} className={`relative flex flex-col items-center transition-all duration-300 ${view === 'upcoming' ? 'text-gray-900 scale-110' : 'text-gray-400'}`}>
                    <Plane size={24} className={view === 'upcoming' ? '-rotate-45' : ''} />
                    {view === 'upcoming' && <div className="absolute -bottom-2 w-1 h-1 bg-gray-900 rounded-full"></div>}
                </button>
                <div className="relative -mt-10 group">
                    <button onClick={() => setMenuOpen(!menuOpen)} className={`w-16 h-16 bg-gray-900 rounded-[1.2rem] shadow-xl flex items-center justify-center text-white transition-all ring-4 ring-[#F2F4F6] ${menuOpen ? 'rotate-45' : ''}`}>
                        <Plus size={28} strokeWidth={2.5} />
                    </button>
                    {menuOpen && (
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col gap-3 z-50 w-max">
                            <button onClick={() => { setMenuOpen(false); setShowScanner(true); }} className="flex items-center gap-4 bg-white px-5 py-3.5 rounded-2xl shadow-xl border border-gray-100 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><Scan size={20} /></div>
                                <span className="text-sm font-bold text-gray-700">Scan QR Code</span>
                            </button>
                            <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-4 bg-white px-5 py-3.5 rounded-2xl shadow-xl border border-gray-100 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-rose-100 p-2 rounded-xl text-rose-600"><FileText size={20} /></div>
                                <span className="text-sm font-bold text-gray-700">Import PDF Ticket</span>
                            </button>
                         <button onClick={() => { setShowBookingInput(true); setMenuOpen(false); }} className="flex items-center gap-4 bg-white px-5 py-3.5 rounded-2xl shadow-xl border border-gray-100 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-purple-100 p-2 rounded-xl text-purple-600"><Ticket size={20} /></div>
                            <span className="text-sm font-bold text-gray-700">Add Booking ID</span>
                        </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handlePDFUpload}
                                accept="application/pdf"
                                className="hidden"
                            />
                        </div>
                    )}
                </div>
                <button onClick={() => setView('past')} className={`relative flex flex-col items-center transition-all duration-300 ${view === 'past' ? 'text-gray-900 scale-110' : 'text-gray-400'}`}>
                    <History size={24} />
                    {view === 'past' && <div className="absolute -bottom-2 w-1 h-1 bg-gray-900 rounded-full"></div>}
                </button>
            </nav>
            {showScanner && <ScannerModal onClose={() => setShowScanner(false)} onScanComplete={handleScanComplete} />}
            {selectedQRFlight && <BoardingPassQRModal flight={selectedQRFlight} onClose={() => setSelectedQRFlight(null)} />}

        {showBookingInput && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                    <h2 className="text-xl font-bold mb-4">Add Booking</h2>
                    <form onSubmit={handleBookingFetch} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Booking Reference / PNR</label>
                            <input
                                type="text"
                                value={bookingId}
                                onChange={(e) => setBookingId(e.target.value)}
                                placeholder="e.g. R4ND0M"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                                autoFocus
                            />
                            <p className="text-xs text-gray-400 mt-2">Enter your 6-character Amadeus PNR or Booking ID.</p>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button type="button" onClick={() => setShowBookingInput(false)} className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                            <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">Add Trip</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
            <style>{`
            @keyframes fly-arc {
              0% { offset-distance: 0%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { offset-distance: 100%; opacity: 0; }
            }
            .animate-fly-arc {
              animation: fly-arc 4s linear infinite;
              offset-rotate: auto 0deg;
            }
          `}</style>
        </div>
    );
}
