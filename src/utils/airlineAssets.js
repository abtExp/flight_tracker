export const getAirlineAssets = (airlineName, flightNumber) => {
    // Normalize input
    const name = airlineName?.toLowerCase() || '';
    const code = flightNumber?.split(' ')[0]?.toUpperCase() || '';

    // Default Assets
    let assets = {
        logo: '✈️',
        gradient: 'from-slate-600 to-slate-900',
        textColor: 'text-white'
    };

    // Air India (AI)
    if (name.includes('air india') || code === 'AI' || code === 'AIC') {
        assets = {
            logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/46/Air_India_Logo_%282023%29.svg/1200px-Air_India_Logo_%282023%29.svg.png',
            gradient: 'from-red-600 to-orange-600',
            textColor: 'text-white'
        };
    }
    // Indigo (6E)
    else if (name.includes('indigo') || code === '6E' || code === 'IGO') {
        assets = {
            logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b0/IndiGo_Airline_logo.svg/1200px-IndiGo_Airline_logo.svg.png',
            gradient: 'from-blue-600 to-indigo-600',
            textColor: 'text-white'
        };
    }
    // Vistara (UK)
    else if (name.includes('vistara') || code === 'UK' || code === 'VTI') {
        assets = {
            logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/23/Vistara_Logo.svg/1200px-Vistara_Logo.svg.png',
            gradient: 'from-purple-900 to-purple-600',
            textColor: 'text-white'
        };
    }
    // SpiceJet (SG)
    else if (name.includes('spicejet') || code === 'SG' || code === 'SEJ') {
        assets = {
            logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/SpiceJet_logo.svg/1200px-SpiceJet_logo.svg.png',
            gradient: 'from-orange-600 to-red-600',
            textColor: 'text-white'
        };
    }
    // Akasa Air (QP)
    else if (name.includes('akasa') || code === 'QP' || code === 'AKJ') {
        assets = {
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Akasa_Air_logo.svg/1200px-Akasa_Air_logo.svg.png',
            gradient: 'from-orange-500 to-purple-600',
            textColor: 'text-white'
        };
    }
    // Emirates (EK)
    else if (name.includes('emirates') || code === 'EK') {
        assets = {
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Emirates_logo.svg/1200px-Emirates_logo.svg.png',
            gradient: 'from-red-700 to-red-900',
            textColor: 'text-white'
        };
    }
    // Qatar Airways (QR)
    else if (name.includes('qatar') || code === 'QR') {
        assets = {
            logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9b/Qatar_Airways_Logo.svg/1200px-Qatar_Airways_Logo.svg.png',
            gradient: 'from-fuchsia-900 to-purple-900',
            textColor: 'text-white'
        };
    }
    // Etihad (EY)
    else if (name.includes('etihad') || code === 'EY') {
        assets = {
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Etihad_Airways_Logo.svg/1200px-Etihad_Airways_Logo.svg.png',
            gradient: 'from-amber-600 to-yellow-700',
            textColor: 'text-white'
        };
    }

    // Lufthansa (LH)
    else if (name.includes('lufthansa') || code === 'LH' || code === 'DLH') {
        assets = {
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Lufthansa_Logo_2018.svg/1200px-Lufthansa_Logo_2018.svg.png',
            gradient: 'from-yellow-500 to-blue-900',
            textColor: 'text-white'
        };
    }
    // British Airways (BA)
    else if (name.includes('british') || code === 'BA' || code === 'BAW') {
        assets = {
            logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9c/British_Airways_Logo.svg/1200px-British_Airways_Logo.svg.png',
            gradient: 'from-blue-800 to-red-700',
            textColor: 'text-white'
        };
    }
    // Delta (DL)
    else if (name.includes('delta') || code === 'DL' || code === 'DAL') {
        assets = {
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Delta_Air_Lines_logo_%282015%29.svg/1200px-Delta_Air_Lines_logo_%282015%29.svg.png',
            gradient: 'from-red-700 to-blue-900',
            textColor: 'text-white'
        };
    }
    // United (UA)
    else if (name.includes('united') || code === 'UA' || code === 'UAL') {
        assets = {
            logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/United_Airlines_Logo.svg/1200px-United_Airlines_Logo.svg.png',
            gradient: 'from-blue-600 to-blue-400',
            textColor: 'text-white'
        };
    }
    // American Airlines (AA)
    else if (name.includes('american') || code === 'AA' || code === 'AAL') {
        assets = {
            logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/23/American_Airlines_logo_2013.svg/1200px-American_Airlines_logo_2013.svg.png',
            gradient: 'from-blue-700 to-red-600',
            textColor: 'text-white'
        };
    }
    // Default Fallback with Hash-based Gradient
    else {
        const colors = [
            'from-blue-600 to-cyan-600',
            'from-emerald-600 to-teal-600',
            'from-violet-600 to-purple-600',
            'from-rose-600 to-pink-600',
            'from-amber-600 to-orange-600'
        ];
        const hash = (name + code).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        assets.gradient = colors[hash % colors.length];
    }

    return assets;
};
