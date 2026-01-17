import React from 'react';
import { Sun, CloudRain, Cloud } from 'lucide-react';

export const formatDate = (isoString) => {
    const date = new Date(isoString);
    return {
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    };
};

export const getWeatherIcon = (type) => {
    switch (type) {
        case 'sun': return <Sun size={12} className="text-yellow-300" />;
        case 'rain': return <CloudRain size={12} className="text-blue-300" />;
        case 'cloudy': return <Cloud size={12} className="text-gray-300" />;
        default: return <Sun size={12} className="text-yellow-300" />;
    }
};
