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