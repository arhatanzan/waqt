// ============================================
// LIVE CLOCK & DATES LOGIC (js/clock.js)
// ============================================

let lastLiveDay = -1;

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
        
        if (now.getDate() !== lastLiveDay) {
            lastLiveDay = now.getDate();
            updateLiveDates();
        }

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

    await fetchHijriData(now, now);
    const hijriInfo = getHijriFromCache(now, lng);
    
    if(hijriInfo && document.getElementById('liveHijriDate')) {
        document.getElementById('liveHijriDate').innerText = `${hijriInfo.string} ${hijriInfo.year}`;
    }
}