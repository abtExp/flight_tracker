import * as pdfjsLib from 'pdfjs-dist';

// Set worker source to the version installed
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

        // Basic Regex Extraction (Best Effort)
        // This is highly dependent on airline PDF formats

        // PNR: 5-8 alphanumeric characters, usually uppercase
        const pnrMatch = fullText.match(/PNR:?\s*([A-Z0-9]{5,8})/i) ||
            fullText.match(/Booking Ref:?\s*([A-Z0-9]{5,8})/i) ||
            fullText.match(/Reference:?\s*([A-Z0-9]{5,8})/i) ||
            fullText.match(/([A-Z0-9]{6})/); // Fallback

        // Flight Number: 2-3 letters followed by 1-4 digits
        const flightMatch = fullText.match(/([A-Z]{2}|[A-Z0-9]{2})\s?(\d{3,4})/);

        const seatMatch = fullText.match(/Seat:?\s*([0-9]{1,2}[A-Z])/i);

        // Date Extraction (DD MMM or DD/MM/YYYY)
        const dateMatch = fullText.match(/(\d{1,2})\s?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s?(\d{2,4})?/i) ||
            fullText.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/) ||
            fullText.match(/(\d{4})-(\d{2})-(\d{2})/);

        let flightDate = new Date();
        if (dateMatch) {
            try {
                flightDate = new Date(dateMatch[0]);
                if (isNaN(flightDate.getTime())) flightDate = new Date();
            } catch (e) { }
        }

        // Extract passenger name (often first line or near "Passenger")
        const passengerMatch = fullText.match(/Passenger:?\s*([A-Z\s]+)/i) || fullText.match(/Name:?\s*([A-Z\s]+)/i);

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
                code: 'UNK',
                city: 'Unknown',
                terminal: 'TBD',
                gate: 'TBD',
                time: flightDate.toISOString(),
                weather: 'sun',
                temp: '--'
            },
            arrival: {
                code: 'UNK',
                city: 'Unknown',
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
