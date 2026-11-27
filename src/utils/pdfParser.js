import * as pdfjsLib from 'pdfjs-dist';

// Set worker source to the local file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export const parsePDFBoardingPass = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + ' ';
        }

        console.log("PDF Extracted Text Length:", fullText.length);
        console.log("PDF Text Preview:", fullText.substring(0, 500));

        if (fullText.length < 50) {
            console.warn("PDF Text is too short. Scanned PDF or Image-only?");
            alert("PDF appears to be empty or image-based. Try a text-based PDF.");
            return null;
        }

        // Enhanced Regex Extraction

        // PNR: 6 chars, alphanumeric, usually uppercase. Avoid common false positives.
        // Look for "PNR", "Booking Ref", "Reference" followed by the code.
        const pnrMatch = fullText.match(/(?:PNR|Booking Ref|Reference|Reservation Code)[:\s]*([A-Z0-9]{6})/i);

        // Flight Number: IATA code (2 chars) + 3-4 digits. 
        // Focus on common Indian airlines: AI, 6E, UK, SG, QP + others
        const flightMatch = fullText.match(/([A-Z0-9]{2}|[A-Z]{2})\s?[-]?\s?(\d{3,4})/);

        // Seat: 1-2 digits + A-K
        const seatMatch = fullText.match(/(?:Seat|Seat No)[:\s]*([0-9]{1,2}[A-K])/i);

        // Date: DD MMM YY or DD/MM/YYYY
        // Try to find a date near "Date" keyword first
        const dateMatch = fullText.match(/(?:Date|Departure)[:\s]*(\d{1,2})\s?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s?(\d{2,4})?/i) ||
            fullText.match(/(\d{1,2})\s?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s?(\d{2,4})/i) ||
            fullText.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);

        let flightDate = new Date();
        if (dateMatch) {
            try {
                // Handle different date formats
                if (dateMatch[2] && isNaN(dateMatch[2])) {
                    // Month name format
                    const year = dateMatch[3] ? (dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3]) : new Date().getFullYear();
                    flightDate = new Date(`${dateMatch[1]} ${dateMatch[2]} ${year}`);
                } else {
                    // Numeric format (assume DD/MM/YYYY for India/EU)
                    flightDate = new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`);
                }

                if (isNaN(flightDate.getTime())) flightDate = new Date();
            } catch (e) { console.warn("Date parse error", e); }
        }

        // Airports: Look for 3-letter uppercase codes (IATA)
        // This is tricky without a DB, but we can look for patterns like "DEL - BOM" or "DEL to BOM"
        const routeMatch = fullText.match(/([A-Z]{3})\s?(?:-|to|✈)\s?([A-Z]{3})/);

        // Passenger Name: Look for "Mr/Ms/Mrs" or "Passenger"
        const passengerMatch = fullText.match(/(?:Mr|Ms|Mrs|Dr)\.?\s+([A-Z\s]+)/i) ||
            fullText.match(/Passenger[:\s]*([A-Z\s]+)/i);

        if (!flightMatch) {
            console.warn("PDF Parse: No flight number found.");
            return null;
        }

        return {
            id: `pdf-${Date.now()}`,
            pnr: pnrMatch ? pnrMatch[1] : 'PDF-IMP',
            airline: 'Imported',
            flightNumber: `${flightMatch[1]} ${flightMatch[2]}`,
            departure: {
                code: routeMatch ? routeMatch[1] : 'UNK',
                city: routeMatch ? 'Departure' : 'Unknown', // Ideally map code to city
                terminal: 'TBD',
                gate: 'TBD',
                time: flightDate.toISOString(),
                weather: 'sun',
                temp: '--'
            },
            arrival: {
                code: routeMatch ? routeMatch[2] : 'UNK',
                city: routeMatch ? 'Arrival' : 'Unknown',
                terminal: 'TBD',
                time: new Date(flightDate.getTime() + 7200000).toISOString(),
                weather: 'sun',
                temp: '--'
            },
            seat: seatMatch ? seatMatch[1] : 'ANY',
            zone: '1',
            class: 'Economy',
            classType: 'economy',
            airplane: 'Unknown',
            status: 'Scheduled',
            loyalty: null,
            passenger: passengerMatch ? passengerMatch[1].trim() : 'Guest',
            brandGradient: 'from-indigo-600 to-indigo-900',
            logo: '📄'
        };

    } catch (error) {
        console.error("PDF Parse Error:", error);
        return null;
    }
};
