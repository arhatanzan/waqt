// ============================================
// MAIN APPLICATION CONTROLLER (js/app.js)
// ============================================

// INJECT ASTRONOMICAL PRECISION ANGLES
SunCalc.addTime(-19, "saherExact", "saherEnd"); 
SunCalc.addTime(-4.5, "maghribExact", "maghribEnd"); 

// --- DARK MODE TOGGLE ---
function toggleTheme() {
    const isDark = AppState.theme.toggle();
    const body = DOMUtils.getElement('app_body');
    const themeToggle = DOMUtils.getElement('theme_toggle');
    
    if (isDark) {
        body?.classList.add(CONFIG.CLASSES.dark_mode);
        localStorage.setItem(CONFIG.STORAGE.theme_key, CONFIG.STORAGE.dark_mode_value);
        if (themeToggle) themeToggle.textContent = '☀️';
    } else {
        body?.classList.remove(CONFIG.CLASSES.dark_mode);
        localStorage.setItem(CONFIG.STORAGE.theme_key, CONFIG.STORAGE.light_mode_value);
        if (themeToggle) themeToggle.textContent = '🌙';
    }
}

// Initialize theme from localStorage
function initializeTheme() {
    const savedTheme = localStorage.getItem(CONFIG.STORAGE.theme_key) || CONFIG.STORAGE.default_theme;
    const isDarkMode = savedTheme === CONFIG.STORAGE.dark_mode_value;
    const body = DOMUtils.getElement('app_body');
    const themeToggle = DOMUtils.getElement('theme_toggle');
    
    AppState.theme.set(isDarkMode);
    
    if (isDarkMode) {
        body?.classList.add(CONFIG.CLASSES.dark_mode);
        if (themeToggle) themeToggle.textContent = '☀️';
    } else {
        body?.classList.remove(CONFIG.CLASSES.dark_mode);
        if (themeToggle) themeToggle.textContent = '🌙';
    }
}

// --- DATE VALIDATION ---
function updateEndDateMin() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate');
    
    if (startDate) {
        endDate.min = startDate;
        
        // Check if current endDate is before startDate
        if (endDate.value && endDate.value < startDate) {
            endDate.value = startDate;
        }
    }
}

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

// Reusable collapse/expand toggle
function toggleCollapse(sectionKey, contentKey) {
    const section = DOMUtils.getElement(sectionKey);
    const content = DOMUtils.getElement(contentKey);
    
    if (!section || !content) return;
    
    if (section.classList.contains(CONFIG.CLASSES.collapsed)) {
        section.classList.remove(CONFIG.CLASSES.collapsed);
        content.style.maxHeight = 'none';
    } else {
        section.classList.add(CONFIG.CLASSES.collapsed);
        content.style.maxHeight = '0px';
    }
}

function toggleControlsCollapse() {
    toggleCollapse('controls_section', 'controls_content');
}

function toggleTimetableCollapse() {
    toggleCollapse('timetable_section', 'timetable_content');
}

function applyDisplaySettings() {
    const viewFormat = document.querySelector('input[name="viewFormat"]:checked').value;
    const is24Hour = document.querySelector('input[name="timeFormat"]:checked').value === "24";
    const showSaher = document.getElementById("showSaher").checked;
    const showEvents = document.getElementById("showEvents").checked;
    const showTareeq = document.getElementById("showTareeq").checked;
    
    // Check if we have data to apply settings to
    const tableBody = document.getElementById("tableBody");
    if (!tableBody || tableBody.children.length === 0) {
        alert("Please generate the timetable first using the Generate button.");
        return;
    }
    
    // First, switch view
    if (viewFormat === 'calendar') {
        document.getElementById('table-container').classList.add('hidden');
        document.getElementById('calendar-container').classList.remove('hidden');
    } else {
        document.getElementById('table-container').classList.remove('hidden');
        document.getElementById('calendar-container').classList.add('hidden');
    }
    
    // For table view, update column visibility and time format
    if (viewFormat === 'table') {
        updateTableDisplay(showSaher, showEvents, showTareeq, is24Hour);
    }
}

function updateTableDisplay(showSaher, showEvents, showTareeq, is24Hour) {
    const tableHeader = document.getElementById("tableHeader");
    const tableBody = document.getElementById("tableBody");
    
    // Update header column visibility
    const headerCells = tableHeader.querySelectorAll('th');
    headerCells.forEach(th => {
        const colName = th.dataset.column;
        if (colName === 'events') th.style.display = showEvents ? '' : 'none';
        else if (colName === 'tareeq') th.style.display = showTareeq ? '' : 'none';
        else if (colName === 'saher') th.style.display = showSaher ? '' : 'none';
    });
    
    // Update each row's column visibility
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, idx) => {
            const colName = cell.dataset.column;
            
            // Hide/show based on column name
            if (colName === 'events') cell.style.display = showEvents ? '' : 'none';
            else if (colName === 'tareeq') cell.style.display = showTareeq ? '' : 'none';
            else if (colName === 'saher') cell.style.display = showSaher ? '' : 'none';
            
            // Update time format if there's time data
            const timeData = cell.dataset.time;
            if (timeData) {
                const [hour, min] = timeData.split(':').map(x => parseInt(x));
                const dateObj = new Date();
                dateObj.setHours(hour, min, 0);
                cell.innerHTML = formatTime(dateObj, is24Hour);
            }
        });
    });
}

window.onload = async function () {
    initializeTheme();
    
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 29);
    
    if(document.getElementById("startDate")) {
        document.getElementById("startDate").value = formatHtmlDate(today);
        document.getElementById("endDate").value = formatHtmlDate(thirtyDaysLater);
        document.getElementById("citySearch").value = "Lucknow";
        
        updateEndDateMin();
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
  
  // DATE VALIDATION: Check if endDate is not less than startDate
  if (end < start) {
    alert("End date cannot be earlier than the start date. Please select valid dates.");
    if(genBtn) {
        genBtn.innerText = "Generate";
        genBtn.disabled = false;
        genBtn.classList.remove("opacity-50", "cursor-wait");
    }
    return;
  }
  
  const showSaher = document.getElementById("showSaher").checked;
  const showEvents = document.getElementById("showEvents").checked;
  const showTareeq = document.getElementById("showTareeq").checked;
  const is24Hour = document.querySelector('input[name="timeFormat"]:checked').value === "24";

  await fetchHijriData(start, end);

  document.getElementById("location-display").innerText = `Timings for ${cityName}`;
  const startGregInfo = formatDate(start);
  const startHijriInfo = getHijriFromCache(start, lng);
  document.getElementById("header-years").innerText = `${startGregInfo.gregYear}  //  ${startHijriInfo.year}`;

  const tableHeader = document.getElementById("tableHeader");
  const tableBody = document.getElementById("tableBody");
  const calendarGrid = document.getElementById("calendarGrid");
  
  tableHeader.innerHTML = ""; tableBody.innerHTML = ""; calendarGrid.innerHTML = "";

  const uniformTimeCol = "p-3 font-bold border-r border-slate-300 whitespace-normal break-words min-w-[80px]";
  // Generate ALL columns regardless of settings - applyDisplaySettings will hide/show them
  let headersHTML = `<th class="p-3 font-bold border-r border-slate-300 w-24">Date</th><th class="p-3 font-bold border-r border-slate-300 w-16">Day</th>`;
  headersHTML += `<th class="p-3 font-bold border-r border-slate-300 min-w-[140px]" data-column="events">Events</th>`;
  headersHTML += `<th class="p-3 font-bold border-r border-slate-300 w-28" data-column="tareeq">Tareeq</th>`;
  headersHTML += `<th class="${uniformTimeCol} text-emerald-800 bg-emerald-50/50" data-column="saher">Tark-e-Saher<br><span class="text-[9px] font-normal text-slate-500 uppercase tracking-wide">10m Buffer</span></th>`;
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

    // Always include all columns - applyDisplaySettings will show/hide them
    rowHTML += `<td class="p-2 border-r border-slate-200 text-left align-top pt-3" data-column="events">${eventsHTML}</td>`;
    rowHTML += `<td class="p-2 border-r border-slate-200 text-center align-top pt-3" data-column="tareeq">${getTareeqInfo(hijriInfo.dayNum, hijriInfo.monthNum)}</td>`;
    rowHTML += `<td class="p-2 bg-emerald-50/30 align-middle" data-column="saher" data-time="${saher.getHours()}:${String(saher.getMinutes()).padStart(2, '0')}">${formatTime(saher, is24Hour)}</td>`;

    rowHTML += `
            <td class="p-2 align-middle" data-time="${subah.getHours()}:${String(subah.getMinutes()).padStart(2, '0')}">${formatTime(subah, is24Hour)}</td>
            <td class="p-2 bg-amber-50/30 align-middle" data-time="${tulu.getHours()}:${String(tulu.getMinutes()).padStart(2, '0')}">${formatTime(tulu, is24Hour)}</td>
            <td class="p-2 align-middle" data-time="${zohar.getHours()}:${String(zohar.getMinutes()).padStart(2, '0')}">${formatTime(zohar, is24Hour)}</td>
            <td class="p-2 bg-indigo-50/30 align-middle border-r-0" data-time="${maghrib.getHours()}:${String(maghrib.getMinutes()).padStart(2, '0')}">${formatTime(maghrib, is24Hour)}</td>
        </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", rowHTML);

    let calExtraInfoHTML = ``;
    if (showEvents || showTareeq) {
        calExtraInfoHTML += `<div class="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1.5">`;
        if (showEvents && eventsHTML !== `<span class="text-[10px] text-slate-400">-</span>`) calExtraInfoHTML += `<div><span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Events</span>${eventsHTML}</div>`;
        if (showTareeq) calExtraInfoHTML += `<div><span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Tareeq</span>${getTareeqInfo(hijriInfo.dayNum, hijriInfo.monthNum)}</div>`;
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

// PDF Export Configuration
const PDF_EXPORT_CONFIG = {
  margin: [15, 15, 15, 15],
  filename: "Waqt-e-Namaz-Timetable.pdf",
  image: { type: "png", quality: 0.98 },
  html2canvas: { scale: 2, logging: false, useCORS: true, backgroundColor: "#ffffff" },
  jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  pagebreak: { mode: 'avoid' }
};

/**
 * Main export to PDF function
 * Validates data, creates PDF content, and exports to file
 */
function exportPDF() {
  try {
    // Validate library availability
    if (typeof html2pdf === 'undefined') {
      alert("PDF library is not loaded. Please refresh the page and try again.");
      return;
    }
    
    // Validate timetable data exists
    const tableBody = document.getElementById("tableBody");
    if (!tableBody || tableBody.children.length === 0) {
      alert("Please generate the timetable first.");
      return;
    }
    
    // Create PDF content
    const pdfContent = createPdfContent();
    
    // Export content to PDF
    exportContentToPdf(pdfContent);
    
  } catch (error) {
    console.error("Export PDF error:", error);
    alert("An error occurred while exporting PDF: " + error.message);
  }
}

/**
 * Creates the complete PDF document structure
 * @returns {HTMLElement} Container element with header, table, and footer
 */
function createPdfContent() {
  const container = document.createElement("div");
  container.style.backgroundColor = "white";
  container.style.padding = "10px";
  
  // Add header section
  container.appendChild(createPdfHeader());
  
  // Add timetable section
  container.appendChild(createPdfTable());
  
  // Add footer section
  container.appendChild(createPdfFooter());
  
  return container;
}

/**
 * Creates the header section of the PDF
 * @returns {HTMLElement} Header element with title and location info
 */
function createPdfHeader() {
  const locationDisplay = document.getElementById("location-display").innerText;
  const headerYears = document.getElementById("header-years").innerText;
  
  const header = document.createElement("div");
  header.style.marginBottom = "10px";
  header.style.borderBottom = "2px solid #1e293b";
  header.style.paddingBottom = "8px";
  
  header.innerHTML = `
    <h1 style="font-size: 22px; font-weight: bold; color: #0d3b2d; margin: 0 0 5px 0; letter-spacing: 1px;">WAQT-E-NAMAZ</h1>
    <p style="font-size: 12px; color: #475569; margin: 3px 0; font-weight: 600;">${locationDisplay}</p>
    <p style="font-size: 10px; color: #64748b; margin: 3px 0;">${headerYears}</p>
    <p style="font-size: 9px; color: #94a3b8; margin: 3px 0;">Prayer Times Timetable</p>
  `;
  
  return header;
}

/**
 * Creates the table section of the PDF
 * @returns {HTMLElement} Table element with headers and body rows
 */
function createPdfTable() {
  const sourceTableHeader = document.getElementById("tableHeader");
  const sourceTableBody = document.getElementById("tableBody");
  
  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.style.fontSize = "9px";
  table.style.fontFamily = "Arial, sans-serif";
  
  // Add table header
  table.appendChild(createTableHeaderSection(sourceTableHeader));
  
  // Add table body
  table.appendChild(createTableBodySection(sourceTableBody));
  
  return table;
}

/**
 * Creates the table header section
 * @param {HTMLElement} sourceHeader - Original table header element
 * @returns {HTMLElement} New thead element with styled cells
 */
function createTableHeaderSection(sourceHeader) {
  const thead = document.createElement("thead");
  thead.style.backgroundColor = "#f1f5f9";
  thead.style.borderBottom = "2px solid #cbd5e1";
  
  const headerRow = document.createElement("tr");
  const sourceHeaderCells = sourceHeader.querySelectorAll("th");
  
  sourceHeaderCells.forEach((sourceCell) => {
    const colName = sourceCell.dataset.column;
    const isHidden = getComputedStyle(sourceCell).display === "none";
    
    // Skip hidden columns
    if (isHidden && colName) return;
    
    const th = document.createElement("th");
    th.style.cssText = "padding: 5px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600; color: #1e293b; word-wrap: break-word; max-width: 60px; font-size: 8px;";
    th.innerHTML = sourceCell.innerText;
    
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  return thead;
}

/**
 * Creates the table body section
 * @param {HTMLElement} sourceBody - Original table body element
 * @returns {HTMLElement} New tbody element with styled rows
 */
function createTableBodySection(sourceBody) {
  const tbody = document.createElement("tbody");
  const sourceRows = sourceBody.querySelectorAll("tr");
  
  sourceRows.forEach((sourceRow, rowIndex) => {
    const newRow = document.createElement("tr");
    newRow.style.backgroundColor = rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc";
    newRow.style.borderBottom = "1px solid #e2e8f0";
    
    const sourceCells = sourceRow.querySelectorAll("td");
    sourceCells.forEach((sourceCell) => {
      const colName = sourceCell.dataset.column;
      const isHidden = getComputedStyle(sourceCell).display === "none";
      
      // Skip hidden columns
      if (isHidden && colName) return;
      
      const td = document.createElement("td");
      td.style.cssText = "padding: 5px; border: 1px solid #e2e8f0; text-align: center; font-size: 9px; color: #334155; word-wrap: break-word; max-width: 70px;";
      td.innerHTML = sourceCell.innerHTML;
      
      newRow.appendChild(td);
    });
    
    tbody.appendChild(newRow);
  });
  
  return tbody;
}

/**
 * Creates the footer section of the PDF
 * @returns {HTMLElement} Footer element with generation timestamp
 */
function createPdfFooter() {
  const footer = document.createElement("div");
  footer.style.cssText = "margin-top: 10px; padding-top: 8px; border-top: 1px solid #cbd5e1; font-size: 8px; color: #94a3b8; text-align: center;";
  footer.innerHTML = `Generated on ${new Date().toLocaleString()}<br>Crafted by Kaif Abbas`;
  
  return footer;
}

/**
 * Exports content to PDF using html2pdf library
 * Uses off-screen positioning to prevent visual flicker
 * @param {HTMLElement} content - Content element to export
 */
function exportContentToPdf(content) {
  // Create wrapper positioned off-screen to avoid visual flicker
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position: absolute; left: -9999px; top: -9999px; width: 100%;";
  wrapper.appendChild(content);
  document.body.appendChild(wrapper);
  
  html2pdf()
    .set(PDF_EXPORT_CONFIG)
    .from(content)
    .save()
    .then(() => {
      console.log("PDF exported successfully");
    })
    .catch((error) => {
      console.error("PDF export error:", error);
      alert("Error exporting PDF: " + error.message);
    })
    .finally(() => {
      // Clean up: remove wrapper from DOM
      if (wrapper.parentNode) {
        document.body.removeChild(wrapper);
      }
    });
}