export const INITIAL_FLIGHTS = [
    {
        id: 'f1',
        pnr: 'H7K92M',
        airline: 'Delta Airlines',
        flightNumber: 'DL 245',
        departure: { code: 'JFK', city: 'New York', terminal: '4', gate: 'B22', time: new Date(Date.now() + 3000000).toISOString(), weather: 'rain', temp: '58°' },
        arrival: { code: 'LHR', city: 'London', terminal: '3', time: new Date(Date.now() + 32400000).toISOString(), weather: 'cloudy', temp: '52°' },
        seat: '12A',
        zone: 'SKY',
        class: 'Business',
        classType: 'premium',
        airplane: 'Boeing 767-400',
        status: 'Boarding',
        loyalty: 'SkyMiles: 99887766',
        passenger: 'John Doe',
        brandGradient: 'from-rose-700 to-rose-900',
        logo: '🔺'
    },
    {
        id: 'f2',
        pnr: 'UA8832',
        airline: 'United Airlines',
        flightNumber: 'UA 883',
        departure: { code: 'SFO', city: 'San Francisco', terminal: 'INT', gate: 'G4', time: new Date(Date.now() + 172800000).toISOString(), weather: 'sun', temp: '72°' },
        arrival: { code: 'NRT', city: 'Tokyo', terminal: '1', time: new Date(Date.now() + 198000000).toISOString(), weather: 'rain', temp: '65°' },
        seat: '45C',
        zone: '3',
        class: 'Economy',
        classType: 'economy',
        airplane: 'Boeing 787-9',
        status: 'Scheduled',
        loyalty: 'MileagePlus: 112233',
        passenger: 'John Doe',
        brandGradient: 'from-blue-600 to-blue-900',
        logo: '🌐'
    },
    {
        id: 'f3',
        pnr: 'EK202X',
        airline: 'Emirates',
        flightNumber: 'EK 202',
        departure: { code: 'JFK', city: 'New York', terminal: '4', gate: 'A6', time: new Date(Date.now() + 2592000000).toISOString(), weather: 'cloudy', temp: '45°' },
        arrival: { code: 'DXB', city: 'Dubai', terminal: '3', time: new Date(Date.now() + 2628000000).toISOString(), weather: 'sun', temp: '88°' },
        seat: '2K', zone: '1', class: 'First Class', classType: 'first', airplane: 'Airbus A380', status: 'Scheduled', loyalty: 'Skywards: Platinum', passenger: 'John Doe',
        brandGradient: 'from-emerald-800 to-emerald-950', logo: '🦅'
    }
];
