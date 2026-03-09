// ============================================
// AUDIO CONTROLS & VISUAL CUES (js/audio.js)
// ============================================

let audioUnlocked = false;
let lastAzaanTriggerTime = "";

function unlockAudioContext() {
    if (!audioUnlocked) {
        const audio = document.getElementById("azaanAudio");
        if(audio) {
            audio.play().then(() => {
                audio.pause();
                audio.currentTime = 0;
                audioUnlocked = true;
            }).catch(() => {
                // Silently swallow the lock warning
            });
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
        }).catch(() => {
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
    if(audio) { audio.pause(); audio.currentTime = 0; }
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

function setAudioSpeed(speed) {
    const audio = document.getElementById("azaanAudio");
    if(audio) {
        audio.playbackRate = speed;
        
        // Update button styling
        document.querySelectorAll('[id^="speed-"]').forEach(btn => {
            btn.classList.remove("bg-emerald-200", "text-slate-900", "font-extrabold");
            btn.classList.add("text-slate-700");
        });
        
        const activeBtn = document.getElementById(`speed-${speed}x`);
        if(activeBtn) {
            activeBtn.classList.remove("text-slate-700");
            activeBtn.classList.add("bg-emerald-200", "text-slate-900", "font-extrabold");
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const azaanAudio = document.getElementById("azaanAudio");
    const progressBar = document.getElementById("audioProgressBar");
    const timeDisplay = document.getElementById("audioTimeDisplay");

    if(azaanAudio && progressBar && timeDisplay) {
        // Set initial speed button highlight
        const activeBtn = document.getElementById("speed-1x");
        if(activeBtn) {
            activeBtn.classList.add("bg-emerald-200", "text-slate-900", "font-extrabold");
        }
        
        azaanAudio.addEventListener("timeupdate", () => {
            const currentTime = azaanAudio.currentTime;
            const duration = azaanAudio.duration || 0;
            if (duration > 0) {
                progressBar.style.width = `${(currentTime / duration) * 100}%`;
                timeDisplay.innerText = `${formatAudioTime(currentTime)} / ${formatAudioTime(duration)}`;
            }
        });
        azaanAudio.addEventListener("loadedmetadata", () => { timeDisplay.innerText = `00:00 / ${formatAudioTime(azaanAudio.duration)}`; });
        azaanAudio.addEventListener("ended", () => {
            progressBar.style.width = "0%";
            timeDisplay.innerText = `00:00 / ${formatAudioTime(azaanAudio.duration)}`;
            removeVisualCue();
        });
    }
});