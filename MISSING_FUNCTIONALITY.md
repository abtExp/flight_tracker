# Missing Functionality for Real-World Usage

## 1. Universal PNR Retrieval
*   **Current State**: The app supports fetching booking details via Amadeus Booking API.
*   **Limitation**: This only works for bookings made through the Amadeus GDS or accessible via Amadeus API.
*   **Requirement**: In the real world, users have PNRs from various GDSs (Sabre, Travelport, Amadeus, Navitaire, etc.). Fetching details for *any* PNR requires access to all major GDSs or a specialized aggregation service (like TripIt, Traxo, etc.).
*   **Solution**: Integrate with a GDS aggregator or email parsing service to import bookings from confirmation emails.

## 2. Real-Time Data & Push Notifications
*   **Current State**: The app fetches flight status on demand.
*   **Limitation**: Users must manually refresh to see updates. There are no alerts for gate changes, delays, or boarding calls.
*   **Requirement**: A backend service to poll for flight status changes and send push notifications to the user's device.
*   **Solution**: Implement a backend (Node.js/Python) with a task queue to monitor flights and use Firebase Cloud Messaging (FCM) or OneSignal for push notifications.

## 3. Data Persistence & User Accounts
*   **Current State**: The app likely stores data in local state or relies on API calls each time.
*   **Limitation**: If the user clears the cache or changes devices, their flights are lost.
*   **Requirement**: A user account system (Auth0, Firebase Auth) and a database (PostgreSQL, MongoDB) to store user trips and preferences.

## 4. Wallet Integration
*   **Current State**: The app displays a digital boarding pass within the UI.
*   **Limitation**: Users prefer adding boarding passes to Apple Wallet or Google Wallet for easy access on the lock screen.
*   **Solution**: Implement `.pkpass` (Apple) and Google Wallet pass generation on the backend.

## 5. Offline Support
*   **Current State**: The app is a web/hybrid app.
*   **Limitation**: Critical information (boarding pass QR code, seat number) might be unavailable without internet.
*   **Solution**: Implement robust local storage (SQLite or IndexedDB) and PWA offline capabilities to ensure the boarding pass is accessible offline.

## 6. Comprehensive Airport Data
*   **Current State**: Airport cities and names are sometimes mocked or partial.
*   **Requirement**: Full database of airports, terminals, and gate maps.

## 7. Security & Compliance
*   **Requirement**: Handling PNRs and passenger names requires compliance with privacy regulations (GDPR, CCPA).
*   **Critical Security Gap**: The current prototype exposes the **Amadeus API Client Secret** in the frontend code (`src/services/api.js` via `VITE_AMADEUS_CLIENT_SECRET`).
    *   **Risk**: This allows any user to extract the credentials and abuse the API quota.
    *   **CORS Issue**: Direct calls from the browser to Amadeus API may be blocked by Cross-Origin Resource Sharing (CORS) policies.
    *   **Solution**: In a real-world application, **NEVER** expose secrets in the frontend. You must implement a backend server (Node.js, Go, etc.) or a serverless function (AWS Lambda, Vercel Functions) to handle authentication and proxy requests to the Amadeus API. The frontend should only communicate with your backend.
