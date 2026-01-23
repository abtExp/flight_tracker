import { INITIAL_FLIGHTS } from '../data/mockData';

const AVIATIONSTACK_API_KEY = import.meta.env.VITE_AVIATIONSTACK_API_KEY;
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const AMADEUS_CLIENT_ID = import.meta.env.VITE_AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = import.meta.env.VITE_AMADEUS_CLIENT_SECRET;

const AVIATIONSTACK_BASE_URL = 'http://api.aviationstack.com/v1';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';

let amadeusToken = null;
let amadeusTokenExpiry = null;

const getAmadeusToken = async () => {
    if (amadeusToken && amadeusTokenExpiry && new Date() < amadeusTokenExpiry) {
        return amadeusToken;
    }

    if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET || AMADEUS_CLIENT_ID.includes('your_')) {
        console.warn('Amadeus API credentials missing or invalid.');
        return null;
    }

    try {
        const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=client_credentials&client_id=${AMADEUS_CLIENT_ID}&client_secret=${AMADEUS_CLIENT_SECRET}`
        });

        if (!response.ok) {
            throw new Error(`Amadeus Auth Error: ${response.statusText}`);
        }

        const data = await response.json();
        amadeusToken = data.access_token;
        // Expires in is in seconds. Subtract a buffer (e.g., 60s)
        amadeusTokenExpiry = new Date(new Date().getTime() + (data.expires_in - 60) * 1000);
        return amadeusToken;
    } catch (error) {
        console.error('Failed to authenticate with Amadeus:', error);
        return null;
    }
};

const fetchAmadeusFlightStatus = async (airlineCode, flightNum, dateStr) => {
    const token = await getAmadeusToken();
    if (!token) return null;

    try {
        // Amadeus On-Demand Flight Status
        // dateStr should be YYYY-MM-DD
        const url = `${AMADEUS_BASE_URL}/v2/schedule/flights?carrierCode=${airlineCode}&flightNumber=${flightNum}&scheduledDepartureDate=${dateStr}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error('Amadeus Flight Status Error:', response.status, response.statusText);
            return null;
        }

        const data = await response.json();
        if (!data.data || data.data.length === 0) return null;

        // Amadeus returns a list of flight points. We need to map it.
        return transformAmadeusFlightData(data.data[0]);

    } catch (error) {
        console.error('Error fetching Amadeus flight status:', error);
        return null;
    }
};

const fetchAmadeusBooking = async (bookingId) => {
    const token = await getAmadeusToken();
    if (!token) return null;

    try {
        const url = `${AMADEUS_BASE_URL}/v1/booking/flight-orders/${bookingId}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
             console.error('Amadeus Booking Error:', response.status, response.statusText);
             return null;
        }

        const data = await response.json();
        if (!data.data) return null;

        return transformAmadeusBookingData(data.data);

    } catch (error) {
        console.error('Error fetching Amadeus booking:', error);
        return null;
    }
};

const transformAmadeusFlightData = (flight) => {
    // Mapping Amadeus data to internal format
    const leg = flight.legs ? flight.legs[0] : {};
    const departureDate = new Date(leg.scheduledDepartureTime);
    const arrivalDate = new Date(leg.scheduledArrivalTime);

    return {
        id: (flight.type || 'flight') + (flight.flightNumber || Math.random()),
        pnr: 'AMADEUS',
        airline: flight.flightDesignator.carrierCode,
        flightNumber: `${flight.flightDesignator.carrierCode} ${flight.flightDesignator.flightNumber}`,
        departure: {
            code: leg.boardPointIataCode,
            city: leg.boardPointIataCode,
            terminal: leg.boardPointTerminal || 'TBD',
            gate: leg.boardPointGate || 'TBD',
            time: departureDate.toISOString(),
            weather: 'sun',
            temp: '--'
        },
        arrival: {
            code: leg.offPointIataCode,
            city: leg.offPointIataCode,
            terminal: leg.offPointTerminal || 'TBD',
            time: arrivalDate.toISOString(),
            weather: 'sun',
            temp: '--'
        },
        seat: 'N/A',
        zone: 'N/A',
        class: 'Economy',
        classType: 'economy',
        airplane: leg.aircraftEquipment ? leg.aircraftEquipment.aircraftType : 'Unknown',
        status: 'Scheduled',
        loyalty: 'N/A',
        passenger: 'User',
        brandGradient: 'from-blue-600 to-blue-900',
        logo: '✈️'
    };
};

const transformAmadeusBookingData = (booking) => {
    // Transform booking to flight object (picking the first flight segment)
    if (!booking.flightOffers || booking.flightOffers.length === 0) return null;

    const flightOffer = booking.flightOffers[0];
    const itinerary = flightOffer.itineraries[0];
    const segment = itinerary.segments[0];

    const departureDate = new Date(segment.departure.at);
    const arrivalDate = new Date(segment.arrival.at);

    return {
        id: booking.id,
        pnr: booking.id,
        airline: segment.carrierCode,
        flightNumber: `${segment.carrierCode} ${segment.number}`,
        departure: {
            code: segment.departure.iataCode,
            city: segment.departure.iataCode,
            terminal: segment.departure.terminal || 'TBD',
            gate: 'TBD',
            time: departureDate.toISOString(),
            weather: 'sun',
            temp: '--'
        },
        arrival: {
            code: segment.arrival.iataCode,
            city: segment.arrival.iataCode,
            terminal: segment.arrival.terminal || 'TBD',
            time: arrivalDate.toISOString(),
            weather: 'sun',
            temp: '--'
        },
        seat: 'TBD',
        zone: 'TBD',
        class: flightOffer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'Economy',
        classType: 'economy',
        airplane: segment.aircraft?.code || 'Unknown',
        status: 'Confirmed',
        loyalty: 'N/A',
        passenger: booking.travelers && booking.travelers.length > 0 ? `${booking.travelers[0].name.firstName} ${booking.travelers[0].name.lastName}` : 'User',
        brandGradient: 'from-green-600 to-green-900',
        logo: '🎟️'
    };
};

export const fetchFlights = async () => {
    if (!AVIATIONSTACK_API_KEY || AVIATIONSTACK_API_KEY.includes('your_')) {
        console.warn('AviationStack API key missing or invalid. Using mock data.');
        return INITIAL_FLIGHTS;
    }

    try {
        // Fetching active flights for a specific airline (e.g., Air India - AIC) as an example
        // In a real app, you might want to fetch based on user's bookings or a wider search
        // Limit to 10 for demo purposes
        const response = await fetch(`${AVIATIONSTACK_BASE_URL}/flights?access_key=${AVIATIONSTACK_API_KEY}&flight_status=active&limit=5`);

        if (!response.ok) {
            throw new Error(`Flight API Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            console.warn('No flights found from API. Using mock data.');
            return INITIAL_FLIGHTS;
        }

        return data.data.map(transformFlightData);
    } catch (error) {
        console.error('Failed to fetch flights:', error);
        return INITIAL_FLIGHTS;
    }
};

export const fetchBooking = async (bookingId) => {
    // Logic to fetch booking. If Amadeus ID, use Amadeus.
    // Since we only integrated Amadeus for booking retrieval by ID:
    return await fetchAmadeusBooking(bookingId);
};

export const fetchFlightStatus = async (airlineCode, flightNum, dateStr) => {
    // Try Amadeus first if keys are available
    if (AMADEUS_CLIENT_ID && AMADEUS_CLIENT_SECRET && !AMADEUS_CLIENT_ID.includes('your_')) {
        const amadeusData = await fetchAmadeusFlightStatus(airlineCode, flightNum, dateStr);
        if (amadeusData) return amadeusData;
    }

    if (!AVIATIONSTACK_API_KEY || AVIATIONSTACK_API_KEY.includes('your_')) {
        return null;
    }

    try {
        // AviationStack format: flight_iata (e.g. AA100)
        const flightIata = `${airlineCode}${flightNum}`;
        const url = `${AVIATIONSTACK_BASE_URL}/flights?access_key=${AVIATIONSTACK_API_KEY}&flight_iata=${flightIata}&limit=1`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('API Error');

        const data = await response.json();
        if (!data.data || data.data.length === 0) return null;

        const apiFlight = data.data[0];
        return transformFlightData(apiFlight);

    } catch (error) {
        console.error("Error fetching specific flight status:", error);
        return null;
    }
};

export const fetchWeather = async (city) => {
    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY.includes('your_')) {
        // Return mock weather if no key
        return { weather: 'sun', temp: '72°' };
    }

    try {
        const response = await fetch(`${OPENWEATHER_BASE_URL}/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=imperial`);

        if (!response.ok) {
            // Fallback for city not found or other errors
            return { weather: 'sun', temp: 'N/A' };
        }

        const data = await response.json();

        // Map OpenWeatherMap icon codes to our internal types
        const weatherId = data.weather[0].id;
        let weatherType = 'sun';
        if (weatherId >= 200 && weatherId < 600) weatherType = 'rain';
        else if (weatherId >= 801) weatherType = 'cloudy';

        return {
            weather: weatherType,
            temp: `${Math.round(data.main.temp)}°`
        };
    } catch (error) {
        console.error('Failed to fetch weather:', error);
        return { weather: 'sun', temp: 'N/A' };
    }
};

// Transform AviationStack data to our app's internal format
const transformFlightData = (apiFlight) => {
    // Generate random mock data for fields not provided by free tier or simple endpoint
    // AviationStack free tier has limited real-time data
    const departureDate = new Date(apiFlight.departure.scheduled);
    const arrivalDate = new Date(apiFlight.arrival.scheduled);

    return {
        id: apiFlight.flight.iata || `fl-${Math.random()}`,
        pnr: Math.random().toString(36).substring(2, 8).toUpperCase(), // Mock PNR
        airline: apiFlight.airline.name,
        flightNumber: `${apiFlight.airline.iata} ${apiFlight.flight.number}`,
        departure: {
            code: apiFlight.departure.iata,
            city: apiFlight.departure.airport || 'Unknown', // City name might need a separate lookup
            terminal: apiFlight.departure.terminal || 'TBD',
            gate: apiFlight.departure.gate || 'TBD',
            time: departureDate.toISOString(),
            weather: 'sun', // Placeholder, will be updated
            temp: '--'      // Placeholder
        },
        arrival: {
            code: apiFlight.arrival.iata,
            city: apiFlight.arrival.airport || 'Unknown',
            terminal: apiFlight.arrival.terminal || 'TBD',
            time: arrivalDate.toISOString(),
            weather: 'sun', // Placeholder
            temp: '--'      // Placeholder
        },
        seat: `${Math.floor(Math.random() * 30) + 1}${['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)]}`, // Mock Seat
        zone: Math.floor(Math.random() * 4) + 1, // Mock Zone
        class: 'Economy', // Mock Class
        classType: 'economy',
        airplane: apiFlight.aircraft?.iata || 'Boeing 737',
        status: apiFlight.flight_status === 'active' ? 'Boarding' : 'Scheduled',
        loyalty: 'Frequent Flyer',
        passenger: 'User',
        brandGradient: 'from-blue-600 to-blue-900', // Default gradient
        logo: '✈️'
    };
};
