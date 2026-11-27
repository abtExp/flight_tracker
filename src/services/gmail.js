import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

// Initialize the plugin
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID.apps.googleusercontent.com';

GoogleAuth.initialize({
    clientId: CLIENT_ID,
    scopes: ['readonly.gmail'],
    grantOfflineAccess: true,
});

export const signInWithGoogle = async () => {
    try {
        const user = await GoogleAuth.signIn();
        return user;
    } catch (error) {
        console.error("Google Sign-In Error:", error);
        // For prototype without keys, we might want to return a mock user or throw
        throw error;
    }
};

export const fetchFlightEmails = async (accessToken) => {
    try {
        // Search for emails with "boarding pass" or "flight" in the last 30 days
        const query = 'subject:(boarding pass OR flight ticket) after:2024/01/01';
        const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=5`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch emails');

        const data = await response.json();
        if (!data.messages) return [];

        const emails = await Promise.all(data.messages.map(async (msg) => {
            const detailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const detail = await detailResponse.json();
            return parseEmailBody(detail);
        }));

        return emails.filter(e => e !== null);

    } catch (error) {
        console.error("Gmail API Error:", error);
        return [];
    }
};

const parseEmailBody = (emailData) => {
    // Simplified parsing: Extract text from snippet or body
    // In a real app, you'd recursively traverse the payload parts to find text/html
    const snippet = emailData.snippet;

    // We can reuse the PDF regex logic here if we export it, 
    // or just look for basic patterns for now.
    // For this prototype, let's just return the raw text to be processed by the main app logic
    return {
        id: emailData.id,
        text: snippet + " " + (emailData.payload?.body?.data ? atob(emailData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/')) : '')
    };
};
