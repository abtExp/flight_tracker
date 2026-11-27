import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Plane, RefreshCw, User, Ticket, History, Plus, Scan, FileText, CheckCircle, X
} from 'lucide-react';
import { fetchFlights, fetchWeather, fetchFlightStatus } from './services/api';
import { saveFlightsToStorage, loadFlightsFromStorage } from './services/storage';
import { signInWithGoogle, fetchFlightEmails } from './services/gmail';
import { parseBoardingPass } from './utils/bcbp';
import { parsePDFBoardingPass } from './utils/pdfParser';
import FlightCard from './components/FlightCard';
import ScannerModal from './components/ScannerModal';
import BoardingPassQRModal from './components/BoardingPassQRModal';
import { Preferences } from '@capacitor/preferences';
import { fetchAmadeusFlightStatus } from './services/amadeus';
import { getAirlineAssets } from './utils/airlineAssets';

export default function App() {
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);
    const [selectedQRFlight, setSelectedQRFlight] = useState(null);
    const [view, setView] = useState('upcoming');
    const [menuOpen, setMenuOpen] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [user, setUser] = useState(null); // Google User State
    const [showProfile, setShowProfile] = useState(false);
    const fileInputRef = useRef(null);

    // Load Data & Settings on Startup
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Load Dark Mode Preference
                const { value: storedTheme } = await Preferences.get({ key: 'theme' });
                if (storedTheme === 'dark') {
                    setDarkMode(true);
                    document.documentElement.classList.add('dark');
                }

                // Load User Session
                const { value: storedUser } = await Preferences.get({ key: 'user_session' });
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    handleGmailAutoScan(parsedUser);
                }

                // 1. Try loading from local storage
                const storedFlights = await loadFlightsFromStorage();

                if (storedFlights.length > 0) {
                    setFlights(storedFlights);
                } else {
                    // 2. Fallback to mock data if storage is empty (first run)
                    const flightData = await fetchFlights();
                    const flightsWithWeather = await Promise.all(flightData.map(async (flight) => {
                        const depWeather = await fetchWeather(flight.departure.city);
                        const arrWeather = await fetchWeather(flight.arrival.city);
                        return {
                            ...flight,
                            departure: { ...flight.departure, ...depWeather },
                            arrival: { ...flight.arrival, ...arrWeather }
                        };
                    }));
                    setFlights(flightsWithWeather);
                }
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
                setDataLoaded(true);
            }
        };

        loadData();
    }, []);

    const handleGmailAutoScan = async (currentUser) => {
        if (!currentUser?.authentication?.accessToken) return;
        try {
            console.log("Auto-scanning Gmail...");
            const emails = await fetchFlightEmails(currentUser.authentication.accessToken);
            if (emails.length > 0) {
                // In a real app, parse and add unique flights
                // For prototype, just notify
                // alert(`Auto-scan found ${emails.length} new flight emails!`);
            }
        } catch (e) {
            console.error("Auto-scan failed", e);
        }
    };

    const handleLogin = async () => {
        try {
            const googleUser = await signInWithGoogle();
            setUser(googleUser);
            await Preferences.set({ key: 'user_session', value: JSON.stringify(googleUser) });
            setShowProfile(false);
            handleGmailAutoScan(googleUser);
        } catch (error) {
            alert("Login Failed: " + error.message);
        }
    };

    const handleLogout = async () => {
        setUser(null);
        await Preferences.remove({ key: 'user_session' });
        setShowProfile(false);
    };

    // Save Data on Change
    useEffect(() => {
        if (dataLoaded) {
            saveFlightsToStorage(flights);
        }
    }, [flights, dataLoaded]);

    const toggleDarkMode = async () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            await Preferences.set({ key: 'theme', value: 'dark' });
        } else {
            document.documentElement.classList.remove('dark');
            await Preferences.set({ key: 'theme', value: 'light' });
        }
    };

    const processFlightData = async (parsedFlight) => {
        setLoading(true);
        try {
            // 1. Parse Flight Info
            const flightNumMatch = parsedFlight.flightNumber.match(/([A-Z0-9]{2,3})\s?(\d{1,4})/);
            const airlineCode = flightNumMatch ? flightNumMatch[1] : parsedFlight.flightNumber.substring(0, 2);
            const flightNum = flightNumMatch ? flightNumMatch[2] : parsedFlight.flightNumber.substring(2);

            // 2. Fetch Real Flight Status (Amadeus)
            const realData = await fetchAmadeusFlightStatus(airlineCode, flightNum, parsedFlight.departure.time);

            let finalFlight = { ...parsedFlight };

            if (realData) {
                finalFlight = {
                    ...finalFlight,
                    ...realData, // Overwrite with real data
                    id: parsedFlight.id,
                    pnr: parsedFlight.pnr
                };
            } else {
                // Fallback: Apply branding manually if API failed
                const assets = getAirlineAssets(finalFlight.airline, airlineCode);
                finalFlight = { ...finalFlight, ...assets };
            }

            // 3. Fetch Weather
            if (finalFlight.arrival.city && finalFlight.arrival.city !== 'Unknown') {
                const weatherData = await fetchWeather(finalFlight.arrival.city);
                finalFlight.arrival.weather = weatherData.weather;
                finalFlight.arrival.temp = weatherData.temp;
            }

            // 4. Determine History Status
            const arrivalTime = new Date(finalFlight.arrival.time);
            const now = new Date();
            const isPast = arrivalTime < now;

            if (isPast) {
                finalFlight.isHistory = true;
                finalFlight.status = 'Landed';
            }

            setFlights(prev => {
                const filtered = prev.filter(f =>
                    !(f.flightNumber === finalFlight.flightNumber &&
                        f.departure.time.split('T')[0] === finalFlight.departure.time.split('T')[0])
                );
                return [finalFlight, ...filtered];
            });

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);

        } catch (error) {
            console.error("Processing Error:", error);
            alert("Error processing flight details.");
        } finally {
            setLoading(false);
        }
    };

    const handleScanComplete = async (scannedData) => {
        setShowScanner(false);
        const parsedFlight = parseBoardingPass(scannedData);
        if (parsedFlight) {
            await processFlightData(parsedFlight);
        } else {
            alert("Could not parse boarding pass. Please try again.");
        }
    };

    const handleGmailImport = async () => {
        setMenuOpen(false);
        setLoading(true);
        try {
            const user = await signInWithGoogle();
            if (user && user.authentication && user.authentication.accessToken) {
                const emails = await fetchFlightEmails(user.authentication.accessToken);
                if (emails.length > 0) {
                    alert(`Found ${emails.length} potential flight emails. Processing...`);
                } else {
                    alert("No flight emails found.");
                }
            } else {
                alert("Gmail Sign-In requires configuration. (Mocking success for demo)");
            }
        } catch (error) {
            console.error("Gmail Import Error:", error);
            alert("Failed to sign in with Google. Please check configuration.");
        } finally {
            setLoading(false);
        }
    };

    const handlePDFUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setMenuOpen(false);
        setLoading(true);

        const parsedFlight = await parsePDFBoardingPass(file);

        if (parsedFlight) {
            await processFlightData(parsedFlight);
        } else {
            alert("Could not extract flight details from PDF.");
            setLoading(false);
        }
    };

    const displayedFlights = useMemo(() => {
        const now = new Date();
        if (view === 'upcoming') {
            return flights
                .filter(f => !f.isHistory && new Date(f.departure.time) > now)
                .sort((a, b) => new Date(a.departure.time) - new Date(b.departure.time));
        } else {
            return flights
                .filter(f => f.isHistory || new Date(f.departure.time) <= now)
                .sort((a, b) => new Date(b.departure.time) - new Date(a.departure.time));
        }
    }, [flights, view]);

    return (
        <div className={`min-h-screen font-sans text-gray-900 dark:text-gray-100 pb-32 max-w-md mx-auto border-x border-gray-200 dark:border-gray-800 shadow-2xl relative overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-[#0F172A]' : 'bg-[#F2F4F6]'}`}>
            <header className={`pt-14 px-8 pb-4 sticky top-0 z-30 backdrop-blur-xl transition-colors duration-300 ${darkMode ? 'bg-[#0F172A]/90' : 'bg-[#F2F4F6]/95'}`}>
                <div className="flex justify-between items-center">
                    <div><h1 className="text-3xl font-black tracking-tight dark:text-white">My Trips</h1>
                        <div className="mt-2 flex items-center gap-1.5 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-full w-fit">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Live Updates</span>
                        </div>
                    </div>

                    <button onClick={() => setShowProfile(true)} className="w-12 h-12 bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors relative">
                        {user ? (
                            <img src={user.imageUrl} alt="User" className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                            <User size={24} />
                        )}
                        {user && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-[3px] border-white dark:border-[#0F172A] rounded-full"></div>}
                    </button>
                </div>
            </header>

            {/* Settings / Profile Modal */}
            {showProfile && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-[#1E293B] w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold dark:text-white">Settings</h2>
                            <button onClick={() => setShowProfile(false)} className="p-2 bg-gray-100 dark:bg-[#0F172A] rounded-full text-gray-600 dark:text-gray-400"><X size={18} /></button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0F172A]/50 rounded-2xl mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-[#1E293B] rounded-xl shadow-sm">
                                    {darkMode ? <Plane className="rotate-180 text-gray-400" size={20} /> : <User className="text-gray-400" size={20} />}
                                </div>
                                <span className="font-bold text-gray-700 dark:text-gray-200">Dark Mode</span>
                            </div>
                            <button
                                onClick={toggleDarkMode}
                                className={`w-12 h-7 rounded-full transition-colors duration-300 relative ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform duration-300 ${darkMode ? 'left-6' : 'left-1'}`}></div>
                            </button>
                        </div>

                        {user ? (
                            <div className="flex flex-col items-center gap-4 border-t border-gray-100 dark:border-gray-700 pt-6">
                                <img src={user.imageUrl} alt={user.name} className="w-20 h-20 rounded-full border-4 border-gray-100 dark:border-gray-700" />
                                <div className="text-center">
                                    <h3 className="font-bold text-lg dark:text-white">{user.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                </div>
                                <button onClick={handleLogout} className="w-full py-3 mt-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl">Sign Out</button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 border-t border-gray-100 dark:border-gray-700 pt-6">
                                <div className="text-center mb-2">
                                    <h3 className="font-bold text-lg dark:text-white">Sync with Gmail</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to automatically import flights.</p>
                                </div>
                                <button onClick={handleLogin} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                                    <span className="font-bold text-xl">G</span>
                                    <span>Sign in with Google</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <main className="px-6 pt-2 min-h-[60vh]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center pt-32 space-y-6 animate-pulse">
                        <RefreshCw className="animate-spin text-gray-400" size={24} />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Syncing Flights...</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {displayedFlights.length > 0 ? displayedFlights.map((flight, idx) => (
                            <FlightCard key={flight.id} flight={flight} isFeatured={idx === 0 && view === 'upcoming'} onQRClick={setSelectedQRFlight} />
                        )) : <div className="text-center pt-32 opacity-60"><Ticket size={48} className="mx-auto mb-4 text-gray-400" /><h3 className="text-xl font-bold">No {view} trips found</h3></div>}
                    </div>
                )}
            </main>

            <nav className="fixed bottom-8 left-10 right-10 h-16 bg-white/80 dark:bg-[#1E293B]/90 backdrop-blur-2xl rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-black/50 border border-white/50 dark:border-white/5 z-30 flex justify-between items-center px-10 transition-colors duration-300">
                <button onClick={() => setView('upcoming')} className={`relative flex flex-col items-center transition-all duration-300 ${view === 'upcoming' ? 'text-gray-900 dark:text-white scale-110' : 'text-gray-400 dark:text-gray-500'}`}>
                    <Plane size={24} className={view === 'upcoming' ? '-rotate-45' : ''} />
                    {view === 'upcoming' && <div className="absolute -bottom-2 w-1 h-1 bg-gray-900 dark:bg-white rounded-full"></div>}
                </button>
                <div className="relative -mt-10 group">
                    <button onClick={() => setMenuOpen(!menuOpen)} className={`w-16 h-16 bg-gray-900 dark:bg-white rounded-[1.2rem] shadow-xl flex items-center justify-center text-white dark:text-[#0F172A] transition-all ring-4 ring-[#F2F4F6] dark:ring-[#0F172A] ${menuOpen ? 'rotate-45' : ''}`}>
                        <Plus size={28} strokeWidth={2.5} />
                    </button>
                    {menuOpen && (
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col gap-3 z-50 w-max">
                            <button onClick={() => { setMenuOpen(false); setShowScanner(true); }} className="flex items-center gap-4 bg-white dark:bg-[#1E293B] px-5 py-3.5 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl text-blue-600 dark:text-blue-400"><Scan size={20} /></div>
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Scan QR Code</span>
                            </button>
                            <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-4 bg-white dark:bg-[#1E293B] px-5 py-3.5 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-xl text-rose-600 dark:text-rose-400"><FileText size={20} /></div>
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Import PDF Ticket</span>
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
                <button onClick={() => setView('past')} className={`relative flex flex-col items-center transition-all duration-300 ${view === 'past' ? 'text-gray-900 dark:text-white scale-110' : 'text-gray-400 dark:text-gray-500'}`}>
                    <History size={24} />
                    {view === 'past' && <div className="absolute -bottom-2 w-1 h-1 bg-gray-900 dark:bg-white rounded-full"></div>}
                </button>
            </nav>
            {showScanner && <ScannerModal onClose={() => setShowScanner(false)} onScanComplete={handleScanComplete} />}
            {selectedQRFlight && <BoardingPassQRModal flight={selectedQRFlight} onClose={() => setSelectedQRFlight(null)} />}
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
