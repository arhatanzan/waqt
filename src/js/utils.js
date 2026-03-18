// ============================================
// FORMATTING & UTILITIES (js/utils.js)
// ============================================

function formatTime(dateObj, is24Hour) {
    if (isNaN(dateObj)) return "-";
    let hours = dateObj.getHours();
    let minutes = dateObj.getMinutes();
    minutes = minutes < 10 ? "0" + minutes : minutes;
    
    if (is24Hour) {
        let h = hours < 10 ? "0" + hours : hours;
        return `<span class="font-bold text-slate-900">${h}:${minutes}</span>`;
    } else {
        let ampm = hours >= 12 ? "PM" : "AM";
        let h = hours % 12;
        h = h ? h : 12;
        return `<span class="font-bold text-slate-900">${h}:${minutes}</span> <span class="text-[10px] text-slate-500 font-bold">${ampm}</span>`;
    }
}
  
function getEventColorClass(eventName) {
    const lowerEvent = eventName.toLowerCase();
    const deathKeywords = ['martyrdom', 'demise', 'death', 'burial', 'ashura', 'chehlum', 'arbaeen', 'sham-e-ghariban', 'struck', 'gham', 'soyem', 'usurpation', 'attack', 'cut off', 'scarcity', 'captives', 'prison', 'demolition'];
    if (deathKeywords.some(keyword => lowerEvent.includes(keyword))) return 'text-black font-bold';
    const happyKeywords = ['birth', 'eid', 'marriage', 'conquest', "mab'ath", "mi'raj", 'nawroz', 'triumph', 'revelation', 'brotherhood', 'hijrat'];
    if (happyKeywords.some(keyword => lowerEvent.includes(keyword))) return 'text-red-600 font-bold';
    return 'text-green-700 font-semibold';
}
  
function formatDate(dateObj) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return {
      dayName: days[dateObj.getDay()],
      dateString: `${dateObj.getDate()} ${months[dateObj.getMonth()]}`,
      gregYear: `${dateObj.getFullYear()} CE`,
      lookupKey: String(dateObj.getMonth() + 1).padStart(2, '0') + "-" + String(dateObj.getDate()).padStart(2, '0')
    };
}
  
function formatHtmlDate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getTareeqInfo(hijriDayNum, hijriMonthNum) {
    if (typeof monthSpecificNahas !== 'undefined' && monthSpecificNahas[hijriMonthNum] && monthSpecificNahas[hijriMonthNum].includes(hijriDayNum)) {
        return `<div class="text-red-700 font-extrabold text-[11px] uppercase tracking-wide">Nahas Akbar</div>
                <div class="mt-1 text-[10px] text-slate-600 bg-slate-50 border border-slate-200 p-1 rounded font-medium leading-tight inline-block">Strictly Avoid Initiation</div>`;
    }

    const details = (typeof tareeqDetails !== 'undefined' && tareeqDetails[hijriDayNum]) ? tareeqDetails[hijriDayNum] : { status: "Neutral", desc: "Normal day" };
    let colorClass = "text-emerald-600";
    if (details.status.includes("Nahas")) colorClass = "text-red-600";
    else if (details.status === "Mixed") colorClass = "text-amber-600";

    return `<div class="${colorClass} font-bold text-[11px] uppercase tracking-wide">${details.status}</div>
            <div class="mt-1 text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-1 py-0.5 rounded font-medium leading-tight inline-block">${details.desc}</div>`;
}