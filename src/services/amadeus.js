import { getAirlineAssets } from '../utils/airlineAssets';

const AMADEUS_CLIENT_ID = import.meta.env.VITE_AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = import.meta.env.VITE_AMADEUS_CLIENT_SECRET;

let accessToken = null;
let tokenExpiry = 0;

const getAmadeusToken = async () => {
    if (accessToken && Date.now() < tokenExpiry) {
        return accessToken;
    }

    if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
        console.warn("Amadeus API keys missing.");
        return null;
    }

    try {
        const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=client_credentials&client_id=${AMADEUS_CLIENT_ID}&client_secret=${AMADEUS_CLIENT_SECRET}`
        });

        if (!response.ok) throw new Error('Failed to get Amadeus token');

        const data = await response.json();
        accessToken = data.access_token;
        tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Expire 1 min early
        return accessToken;
    } catch (error) {
        console.error("Amadeus Auth Error:", error);
        return null;
    }
};

export const fetchAmadeusFlightStatus = async (airlineCode, flightNumber, dateStr) => {
    const token = await getAmadeusToken();
    if (!token) return null;

    try {
        // Format date to YYYY-MM-DD
        const date = new Date(dateStr).toISOString().split('T')[0];

        // Amadeus Flight Status API
        const url = `https://test.api.amadeus.com/v2/schedule/flights?carrierCode=${airlineCode}&flightNumber=${flightNumber}&scheduledDepartureDate=${date}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            console.warn(`Amadeus API Error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        if (!data.data || data.data.length === 0) return null;

        // Find the most relevant flight segment (usually the first one for direct flights)
        const flightData = data.data[0];
        const segment = flightData.flightPoints;
        const departure = segment.find(p => p.departure);
        const arrival = segment.find(p => p.arrival);

        if (!departure || !arrival) return null;

        // Get branding assets
        const assets = getAirlineAssets(null, airlineCode);

        return {
            status: 'Scheduled', // Amadeus Schedule API returns scheduled flights. Real-time status requires a different paid endpoint usually, but we can infer.
            departure: {
                code: departure.iataCode,
                terminal: departure.terminal?.code || 'TBD',
                gate: departure.gate?.mainGateNumber || 'TBD',
                time: departure.departure.timings[0].value, // Scheduled time
            },
            arrival: {
                code: arrival.iataCode,
                terminal: arrival.terminal?.code || 'TBD',
                time: arrival.arrival.timings[0].value,
            },
            airplane: flightData.legs?.[0]?.aircraftEquipment?.aircraftType || 'Unknown',
            airline: airlineCode, // We can map code to name if needed
            ...assets
        };

    } catch (error) {
        console.error("Amadeus Fetch Error:", error);
        return null;
    }
};
