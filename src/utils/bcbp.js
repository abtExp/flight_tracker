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

        // Attempt to parse Julian Date from BCBP (Day of Year) if available
        // Format: 3 digits (001-366)
        let flightDate = new Date();
        if (leg.dateOfFlight) {
            const currentYear = new Date().getFullYear();
            const dayOfYear = parseInt(leg.dateOfFlight, 10);
            if (!isNaN(dayOfYear)) {
                const date = new Date(currentYear, 0); // Jan 1st
                date.setDate(dayOfYear);
                flightDate = date;
            }
        }

        return {
            id: `scan-${Date.now()}`,
            pnr: leg.operatingCarrierPNR?.trim() || 'SCAN',
            airline: leg.operatingCarrierDesignator?.trim() || 'Unknown',
            flightNumber: `${leg.operatingCarrierDesignator?.trim()}${leg.flightNumber?.trim()}`,
            departure: {
                code: leg.departureAirport?.trim(),
                city: leg.departureAirport?.trim(), // City lookup would be needed for full name
                terminal: 'TBD',
                gate: 'TBD',
                time: flightDate.toISOString(),
                weather: 'sun',
                temp: '--'
            },
            arrival: {
                code: leg.arrivalAirport?.trim(),
                city: leg.arrivalAirport?.trim(),
                terminal: 'TBD',
                time: new Date(flightDate.getTime() + 7200000).toISOString(), // Mock 2h duration
                weather: 'sun',
                temp: '--'
            },
            seat: leg.seatNumber?.trim() || 'ANY',
            zone: '1',
            class: leg.compartmentCode === 'F' ? 'First' : leg.compartmentCode === 'C' ? 'Business' : 'Economy',
            classType: leg.compartmentCode === 'F' ? 'first' : leg.compartmentCode === 'C' ? 'premium' : 'economy',
            airplane: 'Unknown',
            status: 'Scheduled',
            loyalty: leg.frequentFlyerNumber ? `FF: ${leg.frequentFlyerNumber.trim()}` : null,
            passenger: parsed.data.passengerName?.trim() || 'Passenger',
            brandGradient: 'from-gray-700 to-gray-900',
            logo: '🎫'
        };
    } catch (error) {
        console.error("BCBP Parse Error:", error);
        return null;
    }
};

