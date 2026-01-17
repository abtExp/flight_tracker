import { INITIAL_FLIGHTS } from '../data/mockData';

const AVIATIONSTACK_API_KEY = import.meta.env.VITE_AVIATIONSTACK_API_KEY;
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

const AVIATIONSTACK_BASE_URL = 'http://api.aviationstack.com/v1';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

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
