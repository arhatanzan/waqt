// ============================================
// AUDIO CONTROLS & VISUAL CUES (js/audio.js)
// ============================================

let audioUnlocked = false;
let lastAzaanTriggerTime = "";
let isDragging = false;

function unlockAudioContext() {
    if (!audioUnlocked) {
        const audio = document.getElementById("azaanAudio");
        if(audio) {
            audio.play().then(() => {
                audio.pause();
                audio.currentTime = 0;
                audioUnlocked = true;
            }).catch(() => {
                // Mark as unlocked even if play fails (browser autoplay policy)
                audioUnlocked = true;
            });
        } else {
            // Audio element doesn't exist yet, mark as unlocked
            audioUnlocked = true;
        }
    }
}

function togglePlayPause() {
    const audio = document.getElementById("azaanAudio");
    if(!audio) return;
    
    if(audio.paused) {
        playAzaan();
    } else {
        pauseAzaan();
    }
}

function playAzaan() {
    const audio = document.getElementById("azaanAudio");
    if(audio) {
        audio.play().then(() => {
            updatePlayButton();
            document.getElementById("pdf-header").style.boxShadow = "0 0 25px rgba(16, 185, 129, 0.6)";
            document.getElementById("pdf-header").style.transition = "box-shadow 0.5s ease-in-out";
        }).catch((error) => {
            // Silently handle autoplay policy errors
            // Browser autoplay policies require user interaction, which has already occurred via Generate
            console.debug("Auto-Azaan play blocked by browser policy:", error);
        });
    }
}

function pauseAzaan() {
    const audio = document.getElementById("azaanAudio");
    if(audio) {
        audio.pause();
        updatePlayButton();
    }
    removeVisualCue();
}

function stopAzaan() {
    const audio = document.getElementById("azaanAudio");
    if(audio) { audio.pause(); audio.currentTime = 0; }
    lastAzaanTriggerTime = ""; 
    updatePlayButton();
    removeVisualCue();
}

function updatePlayButton() {
    const btn = document.getElementById("playPauseBtn");
    const audio = document.getElementById("azaanAudio");
    if(btn && audio) {
        if(audio.paused) {
            btn.textContent = "▶";
            btn.title = "Play";
        } else {
            btn.textContent = "⏸";
            btn.title = "Pause";
        }
    }
}

function removeVisualCue() {
    if(document.getElementById("pdf-header")) document.getElementById("pdf-header").style.boxShadow = "none";
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
        speed = Math.max(0.5, Math.min(5, parseFloat(speed) || 1));
        audio.playbackRate = speed;
        
        // Update button styling
        document.querySelectorAll('[id^="speed-"]').forEach(btn => {
            btn.classList.remove("bg-emerald-500", "text-white", "font-extrabold");
            btn.classList.add("bg-slate-100", "text-slate-700");
        });
        
        // Highlight the active button
        const activeBtn = document.getElementById(`speed-${speed}x`);
        if(activeBtn) {
            activeBtn.classList.remove("bg-slate-100", "text-slate-700");
            activeBtn.classList.add("bg-emerald-500", "text-white", "font-extrabold");
        }
        
        // Update custom speed input
        const customInput = document.getElementById("customAudioSpeed");
        if(customInput) {
            customInput.value = speed;
        }
    }
}

function seekAudio(e) {
    const audio = document.getElementById("azaanAudio");
    const container = document.getElementById("audioProgressContainer");
    if(!audio || !container) return;
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    
    audio.currentTime = percentage * (audio.duration || 0);
}

document.addEventListener("DOMContentLoaded", () => {
    const azaanAudio = document.getElementById("azaanAudio");
    const progressContainer = document.getElementById("audioProgressContainer");
    const progressBar = document.getElementById("audioProgressBar");
    const timeDisplay = document.getElementById("audioTimeDisplay");
    const playPauseBtn = document.getElementById("playPauseBtn");

    if(azaanAudio && progressContainer && progressBar && timeDisplay) {
        // Unlock audio context immediately on page load for Auto-Azaan
        unlockAudioContext();
        
        // Set initial speed button highlight
        const activeBtn = document.getElementById("speed-1x");
        if(activeBtn) {
            activeBtn.classList.remove("bg-slate-100", "text-slate-700");
            activeBtn.classList.add("bg-emerald-500", "text-white", "font-extrabold");
        }
        
        // Progress bar click seek
        progressContainer.addEventListener("click", seekAudio);
        
        // Progress bar drag seek
        progressContainer.addEventListener("mousedown", (e) => {
            isDragging = true;
            seekAudio(e);
        });
        
        document.addEventListener("mousemove", (e) => {
            if(isDragging && progressContainer) {
                seekAudio(e);
            }
        });
        
        document.addEventListener("mouseup", () => {
            isDragging = false;
        });
        
        azaanAudio.addEventListener("timeupdate", () => {
            if(!isDragging) {
                const currentTime = azaanAudio.currentTime;
                const duration = azaanAudio.duration || 0;
                if (duration > 0) {
                    progressBar.style.width = `${(currentTime / duration) * 100}%`;
                    timeDisplay.innerText = `${formatAudioTime(currentTime)} / ${formatAudioTime(duration)}`;
                }
            }
        });
        
        azaanAudio.addEventListener("loadedmetadata", () => { 
            timeDisplay.innerText = `00:00 / ${formatAudioTime(azaanAudio.duration)}`; 
        });
        
        azaanAudio.addEventListener("play", () => {
            updatePlayButton();
        });
        
        azaanAudio.addEventListener("pause", () => {
            updatePlayButton();
        });
        
        azaanAudio.addEventListener("ended", () => {
            progressBar.style.width = "0%";
            timeDisplay.innerText = `00:00 / ${formatAudioTime(azaanAudio.duration)}`;
            updatePlayButton();
            removeVisualCue();
        });
    }
});
