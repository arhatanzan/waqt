// ============================================
// DATA LAYER: DYNAMIC APIS (js/api.js)
// ============================================

let hijriCache = {};

// ============================================
// HIJRI DATA (Direct Fetch - Supports CORS natively)
// ============================================
async function fetchHijriData(start, end) {
    let d = new Date(start);
    d.setDate(1); 
    let endObj = new Date(end);
    
    while (d <= endObj || (d.getMonth() === endObj.getMonth() && d.getFullYear() === endObj.getFullYear())) {
        let year = d.getFullYear();
        let month = d.getMonth() + 1;
        let key = `${year}-${month}`;
        
        if (!hijriCache[key]) {
            try {
                // AlAdhan API allows browsers directly, so it stays lightning fast
                const res = await fetch(`https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`);
                const data = await res.json();
                if (data.code === 200) hijriCache[key] = data.data;
            } catch (err) {
                console.error("Failed to fetch Hijri data");
            }
        }
        d.setMonth(d.getMonth() + 1);
    }
}

// ============================================
// DATA RETRIEVAL HELPERS
// ============================================
function getHijriFromCache(dateObj, lng) {
    let offsetDays = (lng > 55) ? -1 : 0;
    let adjustedDate = new Date(dateObj);
    adjustedDate.setDate(adjustedDate.getDate() + offsetDays);

    let y = adjustedDate.getFullYear();
    let m = adjustedDate.getMonth() + 1;
    let d = adjustedDate.getDate();
    let key = `${y}-${m}`;
    
    if (hijriCache[key]) {
        let match = hijriCache[key].find(item => parseInt(item.gregorian.day) === d);
        if (match) {
            let h = match.hijri;
            let mNumStr = String(h.month.number).padStart(2, '0');
            let dNumStr = String(h.day).padStart(2, '0');
            
            return {
                string: `${parseInt(h.day)} ${h.month.en}`, year: `${h.year} AH`,
                lookupKey: `${mNumStr}-${dNumStr}`, dayNum: parseInt(h.day), monthNum: parseInt(h.month.number)
            };
        }
    }
    return { string: "API Offline", year: "", lookupKey: "00-00", dayNum: 1, monthNum: 1 };
}

// ============================================
// GEOLOCATION API WRAPPER (TIER 1)
// ============================================
/**
 * Search for cities using Open-Meteo Geocoding API
 * @param {string} query - City search query
 * @param {number} limit - Maximum results (default: 5)
 * @returns {Promise<Array>} Array of city results
 */
async function searchGeolocation(query, limit = 5) {
    try {
        if (!query || query.length < 2) return [];
        
        const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
        url.searchParams.append('name', query);
        url.searchParams.append('count', limit);
        url.searchParams.append('language', 'en');
        url.searchParams.append('format', 'json');
        
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Geolocation search failed:', error);
        return [];
    }
}

// ============================================
// ASYNC ERROR HANDLER (TIER 2)
// ============================================
/**
 * Wraps async operations with error handling and status updates
 * @param {Function} asyncFn - Async function to execute
 * @param {Object} callbacks - Object with onStart, onSuccess, onError callbacks
 * @returns {Promise<any>} Result from async function
 */
async function executeWithErrorHandling(asyncFn, callbacks = {}) {
    const { onStart, onSuccess, onError } = callbacks;
    
    try {
        if (onStart) onStart();
        const result = await asyncFn();
        if (onSuccess) onSuccess(result);
        return result;
    } catch (error) {
        console.error('Async operation failed:', error);
        if (onError) onError(error);
        throw error;
    }
}

// ============================================
// PRAYER TIME CALCULATION (TIER 2)
// ============================================
/**
 * Calculate prayer times for a given date and location
 * @param {Date} date - Date to calculate times for
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} Prayer times object
 */
function calculatePrayerTimes(date, lat, lng) {
    try {
        if (typeof SunCalc === 'undefined') {
            throw new Error('SunCalc library not loaded');
        }
        
        const times = SunCalc.getTimes(date, lat, lng);
        
        return {
            saher: new Date(times.saherExact.getTime() - CONFIG.TIME.saher_buffer_minutes * 60000),
            subah: times.nightEnd,
            tulu: new Date(times.sunrise.getTime() + CONFIG.TIME.tulu_buffer_minutes * 60000),
            zohar: new Date(times.solarNoon.getTime() - CONFIG.TIME.zohar_buffer_minutes * 60000),
            maghrib: new Date(times.maghribEnd.getTime() - CONFIG.TIME.maghrib_buffer_minutes * 60000)
        };
    } catch (error) {
        console.error('Prayer time calculation failed:', error);
        throw error;
    }
}

/**
 * Format prayer times as key-value pairs for display
 * @param {Object} times - Prayer times object from calculatePrayerTimes
 * @param {boolean} is24Hour - Format times in 24-hour or 12-hour
 * @returns {Array} Array of [label, formattedTime] pairs
 */
function formatPrayerTimesForDisplay(times, is24Hour = false) {
    return [
        ['Tark-e-Saher', formatTime(times.saher, is24Hour)],
        ['Namaz-e-Subah', formatTime(times.subah, is24Hour)],
        ['Tulu-e-Aftab', formatTime(times.tulu, is24Hour)],
        ['Zohar', formatTime(times.zohar, is24Hour)],
        ['Maghrib', formatTime(times.maghrib, is24Hour)]
    ];
}

/**
 * Create data attributes for time cells (for format updates)
 * @param {Object} times - Prayer times object
 * @returns {Object} Object with time key-value pairs
 */
function createTimeDataAttributes(times) {
    return {
        saher: `${times.saher.getHours()}:${String(times.saher.getMinutes()).padStart(2, '0')}`,
        subah: `${times.subah.getHours()}:${String(times.subah.getMinutes()).padStart(2, '0')}`,
        tulu: `${times.tulu.getHours()}:${String(times.tulu.getMinutes()).padStart(2, '0')}`,
        zohar: `${times.zohar.getHours()}:${String(times.zohar.getMinutes()).padStart(2, '0')}`,
        maghrib: `${times.maghrib.getHours()}:${String(times.maghrib.getMinutes()).padStart(2, '0')}`
    };
}