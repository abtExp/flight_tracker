import { Preferences } from '@capacitor/preferences';

const FLIGHTS_KEY = 'saved_flights';

export const saveFlightsToStorage = async (flights) => {
    try {
        await Preferences.set({
            key: FLIGHTS_KEY,
            value: JSON.stringify(flights),
        });
    } catch (error) {
        console.error('Error saving flights:', error);
    }
};

export const loadFlightsFromStorage = async () => {
    try {
        const { value } = await Preferences.get({ key: FLIGHTS_KEY });
        return value ? JSON.parse(value) : [];
    } catch (error) {
        console.error('Error loading flights:', error);
        return [];
    }
};

export const clearFlightsStorage = async () => {
    try {
        await Preferences.remove({ key: FLIGHTS_KEY });
    } catch (error) {
        console.error('Error clearing flights:', error);
    }
};
