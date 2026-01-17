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
        const pnrMatch = fullText.match(/PNR:?\s*([A-Z0-9]{6})/i) || fullText.match(/Booking Ref:?\s*([A-Z0-9]{6})/i);
        const flightMatch = fullText.match(/([A-Z]{2})\s?(\d{3,4})/);
        const seatMatch = fullText.match(/Seat:?\s*([0-9]{1,2}[A-Z])/i);

        // Extract passenger name (often first line or near "Passenger")
        // Very naive implementation
        const passengerMatch = fullText.match(/Passenger:?\s*([A-Z\s]+)/i);

        if (!flightMatch) return null;

        return {
            id: `pdf-${Date.now()}`,
            pnr: pnrMatch ? pnrMatch[1] : 'PDF-IMP',
            airline: 'Imported', // Could infer from flight code
            flightNumber: `${flightMatch[1]} ${flightMatch[2]}`,
            departure: {
                code: 'UNK', // Hard to extract reliably without structured parsing
                city: 'Unknown',
                terminal: 'TBD',
                gate: 'TBD',
                time: new Date().toISOString(),
                weather: 'sun',
                temp: '--'
            },
            arrival: {
                code: 'UNK',
                city: 'Unknown',
                terminal: 'TBD',
                time: new Date(Date.now() + 7200000).toISOString(),
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
