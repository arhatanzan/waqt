// INJECT ASTRONOMICAL PRECISION ANGLES
SunCalc.addTime(-19, "saherExact", "saherEnd"); 
SunCalc.addTime(-4.5, "maghribExact", "maghribEnd"); 

// STATE TRACKING
let audioUnlocked = false;
let lastAzaanTriggerTime = "";
let lastLiveDay = -1;

// API CACHES
let hijriCache = {};
let eclipseCache = {};

// ============================================
// DATA LAYER: DYNAMIC APIS
// ============================================

async function fetchHijriData(start, end) {
    let d = new Date(start);
    d.setDate(1); // Ensure we start at the 1st of the month to capture boundary days
    let endObj = new Date(end);
    
    while (d <= endObj || (d.getMonth() === endObj.getMonth() && d.getFullYear() === endObj.getFullYear())) {
        let year = d.getFullYear();
        let month = d.getMonth() + 1;
        let key = `${year}-${month}`;
        
        if (!hijriCache[key]) {
            try {
                const res = await fetch(`https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`);
                const data = await res.json();
                if (data.code === 200) {
                    hijriCache[key] = data.data;
                }
            } catch (err) {
                console.error("No Internet / Failed to fetch Hijri data from AlAdhan API", err);
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
            // Fetch Solar Eclipses from US Naval Observatory
            const solarRes = await fetch(`https://aa.usno.navy.mil/api/eclipses/solar/year?year=${y}`);
            if (solarRes.ok) {
                const solarData = await solarRes.json();
                if(solarData && solarData.properties && solarData.properties.data) {
                    eclipseCache[y].solar = solarData.properties.data;
                }
            }
            
            // Fetch Lunar Eclipses from US Naval Observatory
            const lunarRes = await fetch(`https://aa.usno.navy.mil/api/eclipses/lunar/year?year=${y}`);
            if (lunarRes.ok) {
                const lunarData = await lunarRes.json();
                if(lunarData && lunarData.properties && lunarData.properties.data) {
                    eclipseCache[y].lunar = lunarData.properties.data;
                }
            }
        } catch (e) {
            console.error(`No Internet / Failed to fetch eclipses for ${y} from USNO API`, e);
        }
    }
}

function getHijriFromCache(dateObj, lng) {
    let offsetDays = 0;
    if (lng > 55) offsetDays = -1;
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
                string: `${parseInt(h.day)} ${h.month.en}`,
                year: `${h.year} AH`,
                lookupKey: `${mNumStr}-${dNumStr}`,
                dayNum: parseInt(h.day),
                monthNum: parseInt(h.month.number)
            };
        }
    }
    // Strict internet dependency fallback
    return { string: "API Offline", year: "", lookupKey: "00-00", dayNum: 1, monthNum: 1 };
}

function getEclipseAlertForDate(dateObj) {
    let y = dateObj.getFullYear();
    let m = dateObj.getMonth() + 1;
    let d = dateObj.getDate();
    
    if (!eclipseCache[y]) return "";
    
    let allEclipses = [...eclipseCache[y].solar, ...eclipseCache[y].lunar];
    let match = allEclipses.find(e => e.year === y && e.month === m && e.day === d);
    
    if (match) {
        return `<div class="text-purple-700 bg-purple-100 border-purple-300 font-bold text-[10px] mt-1.5 uppercase rounded px-1.5 py-0.5 border leading-tight pb-1">
                    ${match.event}
                </div>`;
    }
    return "";
}

// ============================================
// AUDIO CONTROLS & VISUAL CUES
// ============================================

function unlockAudioContext() {
    if (!audioUnlocked) {
        const audio = document.getElementById("azaanAudio");
        if(audio) {
            audio.play().then(() => {
                audio.pause();
                audio.currentTime = 0;
                audioUnlocked = true;
            }).catch(err => console.warn("Audio unlock pending user interaction"));
        }
    }
}

function playAzaan() {
    const audio = document.getElementById("azaanAudio");
    if(audio) {
        audio.play().then(() => {
            document.getElementById("pdf-header").style.boxShadow = "0 0 25px rgba(16, 185, 129, 0.6)";
            document.getElementById("pdf-header").style.transition = "box-shadow 0.5s ease-in-out";
            document.getElementById("audioProgressBar").style.boxShadow = "0 0 10px rgba(16, 185, 129, 0.8)";
        }).catch(e => {
            console.warn("Audio blocked! User must interact first.");
            alert("Please click 'Generate' or play the audio manually once to enable Auto-Azaan.");
        });
    }
}

function pauseAzaan() {
    const audio = document.getElementById("azaanAudio");
    if(audio) audio.pause();
    removeVisualCue();
}

function stopAzaan() {
    const audio = document.getElementById("azaanAudio");
    if(audio) {
        audio.pause();
        audio.currentTime = 0; 
    }
    lastAzaanTriggerTime = ""; 
    removeVisualCue();
}

function removeVisualCue() {
    if(document.getElementById("pdf-header")) document.getElementById("pdf-header").style.boxShadow = "none";
    if(document.getElementById("audioProgressBar")) document.getElementById("audioProgressBar").style.boxShadow = "none";
}

function formatAudioTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

document.addEventListener("DOMContentLoaded", () => {
    const azaanAudio = document.getElementById("azaanAudio");
    const progressBar = document.getElementById("audioProgressBar");
    const timeDisplay = document.getElementById("audioTimeDisplay");

    if(azaanAudio && progressBar && timeDisplay) {
        azaanAudio.addEventListener("timeupdate", () => {
            const currentTime = azaanAudio.currentTime;
            const duration = azaanAudio.duration || 0;
            if (duration > 0) {
                const progressPercent = (currentTime / duration) * 100;
                progressBar.style.width = `${progressPercent}%`;
                timeDisplay.innerText = `${formatAudioTime(currentTime)} / ${formatAudioTime(duration)}`;
            }
        });

        azaanAudio.addEventListener("loadedmetadata", () => {
            timeDisplay.innerText = `00:00 / ${formatAudioTime(azaanAudio.duration)}`;
        });

        azaanAudio.addEventListener("ended", () => {
            progressBar.style.width = "0%";
            timeDisplay.innerText = `00:00 / ${formatAudioTime(azaanAudio.duration)}`;
            removeVisualCue();
        });
    }
});

// ============================================
// LIVE CLOCK & DATES LOGIC
// ============================================

function updateLiveClock() {
    const now = new Date();
    
    const sec = now.getSeconds();
    const min = now.getMinutes();
    const hr = now.getHours();
    
    if(document.getElementById('secHand')) {
        document.getElementById('secHand').style.transform = `rotate(${sec * 6}deg)`;
        document.getElementById('minHand').style.transform = `rotate(${min * 6 + sec * 0.1}deg)`;
        document.getElementById('hourHand').style.transform = `rotate(${(hr % 12) * 30 + min * 0.5}deg)`;

        const formatRadios = document.getElementsByName('timeFormat');
        let is24Hour = false;
        for(let r of formatRadios) { if(r.checked && r.value === "24") is24Hour = true; }
        
        let h = hr, m = min < 10 ? "0"+min : min, s = sec < 10 ? "0"+sec : sec;
        let ampm = "";
        if (!is24Hour) {
            ampm = h >= 12 ? "PM" : "AM";
            h = h % 12; h = h ? h : 12;
        } else {
            h = h < 10 ? "0"+h : h;
        }
        
        document.getElementById('digitalTime').innerHTML = `${h}:${m}:${s} <span class="text-sm text-emerald-200 ml-1">${ampm}</span>`;
        
        // Prevent constant re-computation of dates, check only once per day
        if (now.getDate() !== lastLiveDay) {
            lastLiveDay = now.getDate();
            updateLiveDates();
        }

        // AUTO AZAAN LOGIC
        const lat = parseFloat(document.getElementById("selectedLat").value) || 0;
        const lng = parseFloat(document.getElementById("selectedLng").value) || 0;
        const times = SunCalc.getTimes(now, lat, lng);
        const subah = times.nightEnd;
        const zohar = new Date(times.solarNoon.getTime() - 1 * 60000);
        const maghrib = new Date(times.maghribEnd.getTime() - 5 * 60000);

        const currentHM = `${now.getHours()}:${now.getMinutes()}`;
        const subahHM = `${subah.getHours()}:${subah.getMinutes()}`;
        const zoharHM = `${zohar.getHours()}:${zohar.getMinutes()}`;
        const maghribHM = `${maghrib.getHours()}:${maghrib.getMinutes()}`;

        if ((currentHM === subahHM || currentHM === zoharHM || currentHM === maghribHM) && lastAzaanTriggerTime !== currentHM) {
            playAzaan();
            lastAzaanTriggerTime = currentHM; 
        }
    }
}
setInterval(updateLiveClock, 1000);

async function updateLiveDates() {
    const now = new Date();
    const lng = parseFloat(document.getElementById("selectedLng").value) || 0;
    const gregInfo = formatDate(now);
    
    if(document.getElementById('liveGregDate')) {
        document.getElementById('liveGregDate').innerText = `${gregInfo.dayName}, ${gregInfo.dateString} ${gregInfo.gregYear}`;
    }

    // Await API response for the current month so the live clock doesn't show an error
    await fetchHijriData(now, now);
    const hijriInfo = getHijriFromCache(now, lng);
    
    if(hijriInfo && document.getElementById('liveHijriDate')) {
        document.getElementById('liveHijriDate').innerText = `${hijriInfo.string} ${hijriInfo.year}`;
    }
}

// ============================================
// UI & SEARCH
// ============================================

const searchInput = document.getElementById("citySearch");
const searchResults = document.getElementById("searchResults");
let searchTimeout;

if(searchInput) {
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      const query = this.value.trim();
      if (query.length < 2) { searchResults.style.display = "none"; return; }

      searchTimeout = setTimeout(() => {
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=en&format=json`)
          .then((res) => res.json())
          .then((data) => {
            searchResults.innerHTML = "";
            if (data.results && data.results.length > 0) {
              data.results.forEach((city) => {
                const div = document.createElement("div");
                div.className = "p-3 hover:bg-emerald-50 cursor-pointer border-b border-slate-100 text-sm";
                div.innerHTML = `<strong>${city.name}</strong>, ${city.admin1 ? city.admin1 + ", " : ""}${city.country}`;
                
                div.onclick = () => {
                  searchInput.value = city.name;
                  document.getElementById("selectedLat").value = city.latitude;
                  document.getElementById("selectedLng").value = city.longitude;
                  document.getElementById("pendingCityName").value = city.name;
                  searchResults.style.display = "none";
                  updateLiveClock();
                };
                searchResults.appendChild(div);
              });
              searchResults.style.display = "block";
            } else { searchResults.style.display = "none"; }
          });
      }, 300);
    });

    document.addEventListener("click", (e) => {
      if (e.target !== searchInput && e.target !== searchResults) searchResults.style.display = "none"; 
    });
}

function openModal() { document.getElementById('explanationModal').style.display = 'flex'; }
function closeModal() { document.getElementById('explanationModal').style.display = 'none'; }

function toggleView() {
    const viewFormat = document.querySelector('input[name="viewFormat"]:checked').value;
    if (viewFormat === 'calendar') {
        document.getElementById('table-container').classList.add('hidden');
        document.getElementById('calendar-container').classList.remove('hidden');
    } else {
        document.getElementById('table-container').classList.remove('hidden');
        document.getElementById('calendar-container').classList.add('hidden');
    }
}

function formatHtmlDate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

window.onload = async function () {
  const today = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(today.getDate() + 29);
  
  if(document.getElementById("startDate")) {
      document.getElementById("startDate").value = formatHtmlDate(today);
      document.getElementById("endDate").value = formatHtmlDate(thirtyDaysLater);
      document.getElementById("citySearch").value = "Lucknow";
      
      await updateLiveDates(); 
      updateLiveClock();
      await generateTimetable(); 
  }
};

// ============================================
// FORMATTING & PARSING LOGIC
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

function getAstrologyInfo(date, lat, lng, cityName) {
    const d = (date.getTime() - Date.UTC(2000, 0, 1, 12, 0, 0)) / 86400000;
    let L = (218.316 + 13.176396 * d) % 360; 
    if (L < 0) L += 360;
    
    const zodiacs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    const zIndex = Math.floor(L / 30);
    const zodiac = zodiacs[zIndex];
    
    let specialStatus = "";
    if (zIndex === 7) specialStatus = `<div class="text-red-600 font-bold text-[10px] mt-1.5 uppercase tracking-wide">Qamar Dar Aqrab</div>`;
    else if (zIndex === 1) specialStatus = `<div class="text-emerald-600 font-bold text-[10px] mt-1.5 uppercase tracking-wide">Sharaf-e-Qamar</div>`;

    const phaseInfo = SunCalc.getMoonIllumination(date);
    let phaseName = "Waning Moon";
    if (phaseInfo.phase < 0.05) phaseName = "New Moon";
    else if (phaseInfo.phase > 0.95) phaseName = "Full Moon";
    else if (phaseInfo.phase < 0.5) phaseName = "Waxing Moon";

    // Dynamic Eclipse Lookup replaces the hardcoded list
    let eclipseAlert = getEclipseAlertForDate(date);

    return `<div class="text-[11px] font-bold text-slate-800">Moon in ${zodiac}</div>
            <div class="text-[10px] text-slate-500 font-medium">${phaseName}</div>
            ${specialStatus}${eclipseAlert}`;
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

// ============================================
// MAIN GENERATION LOGIC
// ============================================

async function generateTimetable() {
  unlockAudioContext(); 
  
  const genBtn = document.getElementById("generateBtn");
  if(genBtn) {
      genBtn.innerText = "Fetching APIs...";
      genBtn.disabled = true;
      genBtn.classList.add("opacity-50", "cursor-wait");
  }
  
  const lat = parseFloat(document.getElementById("selectedLat").value);
  const lng = parseFloat(document.getElementById("selectedLng").value);
  const cityName = document.getElementById("pendingCityName").value;
  
  let start = new Date(document.getElementById("startDate").value);
  let end = new Date(document.getElementById("endDate").value);
  
  const showSaher = document.getElementById("showSaher").checked;
  const showEvents = document.getElementById("showEvents").checked;
  const showTareeq = document.getElementById("showTareeq").checked;
  const showAstrology = document.getElementById("showAstrology").checked;
  const is24Hour = document.querySelector('input[name="timeFormat"]:checked').value === "24";

  // Pre-fetch all necessary calendar and astronomical data from APIs
  await fetchHijriData(start, end);
  await fetchEclipseData(start, end);

  document.getElementById("location-display").innerText = `Timings for ${cityName}`;
  const startGregInfo = formatDate(start);
  const startHijriInfo = getHijriFromCache(start, lng);
  document.getElementById("header-years").innerText = `${startGregInfo.gregYear}  //  ${startHijriInfo.year}`;

  const tableHeader = document.getElementById("tableHeader");
  const tableBody = document.getElementById("tableBody");
  const calendarGrid = document.getElementById("calendarGrid");
  
  tableHeader.innerHTML = ""; tableBody.innerHTML = ""; calendarGrid.innerHTML = "";

  const uniformTimeCol = "p-3 font-bold border-r border-slate-300 whitespace-normal break-words min-w-[80px]";

  let headersHTML = `<th class="p-3 font-bold border-r border-slate-300 w-24">Date</th>
                     <th class="p-3 font-bold border-r border-slate-300 w-16">Day</th>`;
  
  if (showEvents) headersHTML += `<th class="p-3 font-bold border-r border-slate-300 min-w-[140px]">Events</th>`;
  if (showTareeq) headersHTML += `<th class="p-3 font-bold border-r border-slate-300 w-28">Tareeq</th>`;
  if (showAstrology) headersHTML += `<th class="p-3 font-bold border-r border-slate-300 w-28">Astrology</th>`;

  if (showSaher) headersHTML += `<th class="${uniformTimeCol} text-emerald-800 bg-emerald-50/50">Tark-e-Saher<br><span class="text-[9px] font-normal text-slate-500 uppercase tracking-wide">10m Buffer</span></th>`;
  
  headersHTML += `
          <th class="${uniformTimeCol}">Namaz-e-Subah<br><span class="text-[9px] font-normal text-slate-500 uppercase tracking-wide">-18° Angle</span></th>
          <th class="${uniformTimeCol} text-amber-800 bg-amber-50/50">Tulu-e-Aftab<br><span class="text-[9px] font-normal text-slate-500 uppercase tracking-wide">+1m Buffer</span></th>
          <th class="${uniformTimeCol}">Zohar<br><span class="text-[9px] font-normal text-slate-500 uppercase tracking-wide">-1m Buffer</span></th>
          <th class="${uniformTimeCol} text-indigo-800 bg-indigo-50/50 border-r-0">Maghrib<br><span class="text-[9px] font-normal text-slate-500 uppercase tracking-wide">-5m Buffer</span></th>
      `;
  tableHeader.innerHTML = headersHTML;

  let currentDate = new Date(start);
  let rowCount = 0;
  
  const startDayIndex = currentDate.getDay();
  for(let i=0; i<startDayIndex; i++) {
      calendarGrid.insertAdjacentHTML("beforeend", `<div class="bg-slate-50 rounded-lg border border-slate-200 min-h-[120px]"></div>`);
  }

  while (currentDate <= end) {
    const times = SunCalc.getTimes(currentDate, lat, lng);
    
    const saher = new Date(times.saherExact.getTime() - 10 * 60000);
    const subah = times.nightEnd;
    const tulu = new Date(times.sunrise.getTime() + 1 * 60000);
    const zohar = new Date(times.solarNoon.getTime() - 1 * 60000);
    const maghrib = new Date(times.maghribEnd.getTime() - 5 * 60000);

    const dateInfo = formatDate(currentDate);
    const hijriInfo = getHijriFromCache(currentDate, lng);
    const rowClass = rowCount % 2 === 0 ? "bg-white" : "bg-slate-50";

    let eventsHTML = '';
    if (showEvents) {
        const safeHistorical = (typeof historicalEvents !== 'undefined' && historicalEvents[hijriInfo.lookupKey]) ? historicalEvents[hijriInfo.lookupKey] : [];
        safeHistorical.forEach(ev => eventsHTML += `<div class="text-[10px] mt-1.5 leading-tight ${getEventColorClass(ev)}">${ev}</div>`);
        
        const safeSolar = (typeof solarEvents !== 'undefined' && solarEvents[dateInfo.lookupKey]) ? solarEvents[dateInfo.lookupKey] : [];
        safeSolar.forEach(ev => eventsHTML += `<div class="text-[10px] mt-1.5 leading-tight ${getEventColorClass(ev)}">${ev}</div>`);
        
        if (eventsHTML === '') eventsHTML = `<span class="text-[10px] text-slate-400">-</span>`;
    }

    let rowHTML = `
              <tr class="${rowClass} avoid-page-break">
                  <td class="p-2 border-r border-slate-200 text-center align-top pt-3">
                    <div class="font-bold text-slate-800 text-sm">${dateInfo.dateString}</div>
                    <div class="mt-1 flex justify-center"><span class="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-200 whitespace-nowrap">${hijriInfo.string}</span></div>
                  </td>
                  <td class="p-2 text-slate-600 text-xs border-r border-slate-200 font-bold tracking-wider text-center align-middle">${dateInfo.dayName}</td>
          `;

    if (showEvents) rowHTML += `<td class="p-2 border-r border-slate-200 text-left align-top pt-3">${eventsHTML}</td>`;
    if (showTareeq) rowHTML += `<td class="p-2 border-r border-slate-200 text-center align-top pt-3">${getTareeqInfo(hijriInfo.dayNum, hijriInfo.monthNum)}</td>`;
    if (showAstrology) rowHTML += `<td class="p-2 border-r border-slate-200 text-center align-top pt-3">${getAstrologyInfo(currentDate, lat, lng, cityName)}</td>`;

    if (showSaher) rowHTML += `<td class="p-2 bg-emerald-50/30 align-middle">${formatTime(saher, is24Hour)}</td>`;

    rowHTML += `
                  <td class="p-2 align-middle">${formatTime(subah, is24Hour)}</td>
                  <td class="p-2 bg-amber-50/30 align-middle">${formatTime(tulu, is24Hour)}</td>
                  <td class="p-2 align-middle">${formatTime(zohar, is24Hour)}</td>
                  <td class="p-2 bg-indigo-50/30 align-middle border-r-0">${formatTime(maghrib, is24Hour)}</td>
              </tr>
          `;
    tableBody.insertAdjacentHTML("beforeend", rowHTML);

    let calExtraInfoHTML = ``;
    if (showEvents || showTareeq || showAstrology) {
        calExtraInfoHTML += `<div class="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1.5">`;
        if (showEvents && eventsHTML !== `<span class="text-[10px] text-slate-400">-</span>`) {
            calExtraInfoHTML += `<div><span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Events</span>${eventsHTML}</div>`;
        }
        if (showTareeq) {
            calExtraInfoHTML += `<div><span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Tareeq</span>${getTareeqInfo(hijriInfo.dayNum, hijriInfo.monthNum)}</div>`;
        }
        if (showAstrology) {
            calExtraInfoHTML += `<div><span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Astro</span>${getAstrologyInfo(currentDate, lat, lng, cityName)}</div>`;
        }
        calExtraInfoHTML += `</div>`;
    }

    let calHTML = `
        <div class="bg-white rounded-lg border border-slate-200 p-2 shadow-sm flex flex-col justify-start hover:shadow-md transition-shadow avoid-page-break">
            <div class="flex justify-between items-start border-b border-slate-100 pb-1 mb-2">
                <span class="text-sm font-bold text-slate-800">${dateInfo.dateString.split(" ")[0]}</span>
                <span class="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">${hijriInfo.string}</span>
            </div>
            <div class="space-y-1">
                ${showSaher ? `<div class="flex justify-between text-[10px] bg-emerald-50 px-1 rounded"><span class="text-slate-500">Saher</span><span>${formatTime(saher, is24Hour)}</span></div>` : ''}
                <div class="flex justify-between text-[10px] px-1"><span class="text-slate-500">Subah</span><span>${formatTime(subah, is24Hour)}</span></div>
                <div class="flex justify-between text-[10px] bg-amber-50 px-1 rounded"><span class="text-slate-500">Tulu</span><span>${formatTime(tulu, is24Hour)}</span></div>
                <div class="flex justify-between text-[10px] px-1"><span class="text-slate-500">Zohar</span><span>${formatTime(zohar, is24Hour)}</span></div>
                <div class="flex justify-between text-[10px] bg-indigo-50 px-1 rounded"><span class="text-slate-500">Maghrib</span><span>${formatTime(maghrib, is24Hour)}</span></div>
            </div>
            ${calExtraInfoHTML}
        </div>
    `;
    calendarGrid.insertAdjacentHTML("beforeend", calHTML);

    currentDate.setDate(currentDate.getDate() + 1);
    rowCount++;
  }
  
  if(genBtn) {
      genBtn.innerText = "Generate";
      genBtn.disabled = false;
      genBtn.classList.remove("opacity-50", "cursor-wait");
  }
}

function exportPDF() {
  document.getElementById("controls-section").style.display = "none";
  const element = document.getElementById("app-container");
  
  const opt = { 
    margin: [0.3, 0.3, 0.3, 0.3], 
    filename: "Waqt-e-Namaz-Comprehensive.pdf", 
    image: { type: "jpeg", quality: 0.98 }, 
    html2canvas: { scale: 2 }, 
    jsPDF: { unit: "in", format: "a3", orientation: "landscape" },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };
  
  html2pdf().set(opt).from(element).save().then(() => { 
    document.getElementById("controls-section").style.display = "block"; 
  });
}