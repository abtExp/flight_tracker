import { decode } from 'bcbp';

export const parseBoardingPass = (data) => {
    try {
        // Attempt to parse using bcbp library
        const parsed = decode(data);

        if (!parsed || !parsed.data || !parsed.data.legs || parsed.data.legs.length === 0) {
            return null;
        }

        // Transform to our app's flight format
        // Note: BCBP data varies, this is a best-effort mapping
        const leg = parsed.data.legs[0]; // Assume first leg for now

        return {
            id: `scan-${Date.now()}`,
            pnr: leg.operatingCarrierPNR || 'SCAN',
            airline: leg.operatingCarrierDesignator || 'Unknown',
            flightNumber: `${leg.operatingCarrierDesignator}${leg.flightNumber}`,
            departure: {
                code: leg.departureAirport,
                city: leg.departureAirport, // City lookup would be needed for full name
                terminal: 'TBD',
                gate: 'TBD',
                time: new Date().toISOString(), // Date often not full year in BCBP, defaulting to now
                weather: 'sun',
                temp: '--'
            },
            arrival: {
                code: leg.arrivalAirport,
                city: leg.arrivalAirport,
                terminal: 'TBD',
                time: new Date(Date.now() + 3600000).toISOString(), // Mock duration
                weather: 'sun',
                temp: '--'
            },
            seat: leg.seatNumber || 'ANY',
            zone: '1',
            class: leg.compartmentCode === 'F' ? 'First' : leg.compartmentCode === 'C' ? 'Business' : 'Economy',
            classType: leg.compartmentCode === 'F' ? 'first' : leg.compartmentCode === 'C' ? 'premium' : 'economy',
            airplane: 'Unknown',
            status: 'Scheduled',
            loyalty: leg.frequentFlyerNumber ? `FF: ${leg.frequentFlyerNumber}` : null,
            passenger: parsed.data.passengerName,
            brandGradient: 'from-gray-700 to-gray-900',
            logo: '🎫'
        };
    } catch (error) {
        console.error("BCBP Parse Error:", error);
        return null;
    }
};

