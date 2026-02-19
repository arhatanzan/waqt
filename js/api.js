// ============================================
// DATA LAYER: DYNAMIC APIS (js/api.js)
// ============================================

let hijriCache = {};
let eclipseCache = {};

// Switched to the reliable JSON wrapper endpoint to guarantee CORS bypass
const CORS_PROXY = "https://api.allorigins.win/get?url=";

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
                const res = await fetch(`https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`);
                const data = await res.json();
                if (data.code === 200) hijriCache[key] = data.data;
            } catch (err) {
                // Fails silently if offline
            }
        }
        d.setMonth(d.getMonth() + 1);
    }
}

async function fetchEclipseData(start, end) {
    let startY = start.getFullYear();
    let endY = end.getFullYear();
    
    for (let y = startY; y <= endY; y++) {
        if (eclipseCache[y]) continue;
        eclipseCache[y] = { solar: [], lunar: [] };
        
        try {
            // Proxied USNO Solar Eclipses
            const solarUrl = encodeURIComponent(`https://aa.usno.navy.mil/api/eclipses/solar/year?year=${y}`);
            const solarRes = await fetch(CORS_PROXY + solarUrl);
            if (solarRes.ok) {
                const proxyData = await solarRes.json();
                if (proxyData.contents) {
                    const solarData = JSON.parse(proxyData.contents);
                    if(solarData.properties && solarData.properties.data) eclipseCache[y].solar = solarData.properties.data;
                }
            }
            
            // Proxied USNO Lunar Eclipses
            const lunarUrl = encodeURIComponent(`https://aa.usno.navy.mil/api/eclipses/lunar/year?year=${y}`);
            const lunarRes = await fetch(CORS_PROXY + lunarUrl);
            if (lunarRes.ok) {
                const proxyData = await lunarRes.json();
                if (proxyData.contents) {
                    const lunarData = JSON.parse(proxyData.contents);
                    if(lunarData.properties && lunarData.properties.data) eclipseCache[y].lunar = lunarData.properties.data;
                }
            }
        } catch (e) {
            // Fails silently if offline
        }
    }
}

async function fetchLocalEclipseVisibility(y, m, d, lat, lng, type) {
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${y}-${mm}-${dd}`;
    
    try {
        const localUrl = encodeURIComponent(`https://aa.usno.navy.mil/api/eclipses/${type}/date?date=${dateStr}&coords=${lat},${lng}&height=0`);
        const res = await fetch(CORS_PROXY + localUrl);
        
        if (!res.ok) return false; 
        
        const proxyData = await res.json();
        if (!proxyData.contents) return false;
        
        const data = JSON.parse(proxyData.contents);
        if (data.error) return false;
        
        if (data.properties && data.properties.local_data) {
            let textData = JSON.stringify(data.properties.local_data).toLowerCase();
            if (textData.includes("not visible") || textData.includes("does not occur") || textData.includes("below horizon")) {
                return false;
            }
        }
        return true;
    } catch(e) {
        return null; 
    }
}

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

function getEclipseAlertForDate(dateObj, cityName) {
    let y = dateObj.getFullYear(), m = dateObj.getMonth() + 1, d = dateObj.getDate();
    if (!eclipseCache[y]) return "";
    
    let match = eclipseCache[y].solar.find(e => e.year === y && e.month === m && e.day === d) || 
                eclipseCache[y].lunar.find(e => e.year === y && e.month === m && e.day === d);
    
    if (match) {
        let visText = "", colorClass = "text-slate-500 bg-slate-100 border-slate-300";
        if (match.visibleAtLocal === true) {
            visText = `<br><span class="text-[8px] font-normal tracking-wide lowercase capitalize">Visible in ${cityName}</span>`;
            colorClass = "text-purple-700 bg-purple-100 border-purple-300"; 
        } else if (match.visibleAtLocal === false) {
            visText = `<br><span class="text-[8px] font-normal tracking-wide lowercase capitalize">Not Visible in ${cityName}</span>`;
        } else {
            visText = `<br><span class="text-[8px] font-normal tracking-wide lowercase capitalize">Global Event</span>`;
        }
        return `<div class="${colorClass} font-bold text-[10px] mt-1.5 uppercase rounded px-1.5 py-0.5 border leading-tight pb-1">${match.event}${visText}</div>`;
    }
    return "";
}