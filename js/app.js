// ============================================
// MAIN APPLICATION CONTROLLER (js/app.js)
// ============================================

// INJECT ASTRONOMICAL PRECISION ANGLES
SunCalc.addTime(-19, "saherExact", "saherEnd"); 
SunCalc.addTime(-4.5, "maghribExact", "maghribEnd"); 

// --- UI & SEARCH CONTROLS ---
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

// --- CORE GENERATION ENGINE ---
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

  await fetchHijriData(start, end);
  await fetchEclipseData(start, end);

  for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
      if (!eclipseCache[y]) continue;
      
      for (let eclipse of eclipseCache[y].solar) {
          let edate = new Date(eclipse.year, eclipse.month - 1, eclipse.day);
          if (edate >= start && edate <= end && eclipse.visibleAtLocal === undefined) {
              eclipse.visibleAtLocal = await fetchLocalEclipseVisibility(eclipse.year, eclipse.month, eclipse.day, lat, lng, 'solar');
          }
      }
      for (let eclipse of eclipseCache[y].lunar) {
          let edate = new Date(eclipse.year, eclipse.month - 1, eclipse.day);
          if (edate >= start && edate <= end && eclipse.visibleAtLocal === undefined) {
              eclipse.visibleAtLocal = await fetchLocalEclipseVisibility(eclipse.year, eclipse.month, eclipse.day, lat, lng, 'lunar');
          }
      }
  }

  document.getElementById("location-display").innerText = `Timings for ${cityName}`;
  const startGregInfo = formatDate(start);
  const startHijriInfo = getHijriFromCache(start, lng);
  document.getElementById("header-years").innerText = `${startGregInfo.gregYear}  //  ${startHijriInfo.year}`;

  const tableHeader = document.getElementById("tableHeader");
  const tableBody = document.getElementById("tableBody");
  const calendarGrid = document.getElementById("calendarGrid");
  
  tableHeader.innerHTML = ""; tableBody.innerHTML = ""; calendarGrid.innerHTML = "";

  const uniformTimeCol = "p-3 font-bold border-r border-slate-300 whitespace-normal break-words min-w-[80px]";
  let headersHTML = `<th class="p-3 font-bold border-r border-slate-300 w-24">Date</th><th class="p-3 font-bold border-r border-slate-300 w-16">Day</th>`;
  
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
        if (showEvents && eventsHTML !== `<span class="text-[10px] text-slate-400">-</span>`) calExtraInfoHTML += `<div><span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Events</span>${eventsHTML}</div>`;
        if (showTareeq) calExtraInfoHTML += `<div><span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Tareeq</span>${getTareeqInfo(hijriInfo.dayNum, hijriInfo.monthNum)}</div>`;
        if (showAstrology) calExtraInfoHTML += `<div><span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Astro</span>${getAstrologyInfo(currentDate, lat, lng, cityName)}</div>`;
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