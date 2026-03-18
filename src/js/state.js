// ============================================
// APPLICATION STATE MANAGER (js/state.js)
// ============================================

/**
 * Centralized state management for the entire application
 * Replaces scattered global variables with organized state object
 */

const AppState = {
  // ======= THEME STATE =======
  theme: {
    isDark: true,  // Dark mode is now default
    
    toggle() {
      this.isDark = !this.isDark;
      return this.isDark;
    },
    
    set(isDark) {
      this.isDark = isDark;
    }
  },

  // ======= AUDIO STATE =======
  audio: {
    isUnlocked: false,
    lastAzaanTriggerTime: '',
    isDragging: false,
    currentSpeed: 1,
    
    unlock() {
      this.isUnlocked = true;
    },
    
    setTriggerTime(time) {
      this.lastAzaanTriggerTime = time;
    },
    
    resetTriggerTime() {
      this.lastAzaanTriggerTime = '';
    },
    
    setDragging(isDragging) {
      this.isDragging = isDragging;
    },
    
    setSpeed(speed) {
      this.currentSpeed = speed;
    }
  },

  // ======= CLOCK STATE =======
  clock: {
    lastLiveDay: -1,
    
    updateDay(day) {
      this.lastLiveDay = day;
    },
    
    hasDateChanged(day) {
      return day !== this.lastLiveDay;
    }
  },

  // ======= SEARCH STATE =======
  search: {
    timeout: null,
    
    setDebounceTimeout(timeoutId) {
      if (this.timeout) clearTimeout(this.timeout);
      this.timeout = timeoutId;
    },
    
    clear() {
      if (this.timeout) clearTimeout(this.timeout);
      this.timeout = null;
    }
  },

  // ======= DATA CACHE =======
  cache: {
    hijri: {},
    
    getHijriByKey(key) {
      return this.hijri[key];
    },
    
    setHijriByKey(key, data) {
      this.hijri[key] = data;
    },
    
    hasHijriData(key) {
      return key in this.hijri;
    },
    
    clearHijriCache() {
      this.hijri = {};
    }
  },

  // ======= LOCATION STATE =======
  location: {
    lat: null,
    lng: null,
    cityName: '',
    
    set(lat, lng, cityName) {
      this.lat = lat;
      this.lng = lng;
      this.cityName = cityName;
    },
    
    getLat() {
      return this.lat || 0;
    },
    
    getLng() {
      return this.lng || 0;
    }
  },

  // ======= UI STATE =======
  ui: {
    isControlsCollapsed: false,
    isTimetableCollapsed: false,
    isGenerating: false,
    currentViewFormat: 'table', // 'table' or 'calendar'
    
    setControlsCollapsed(isCollapsed) {
      this.isControlsCollapsed = isCollapsed;
    },
    
    setTimetableCollapsed(isCollapsed) {
      this.isTimetableCollapsed = isCollapsed;
    },
    
    setGenerating(isGenerating) {
      this.isGenerating = isGenerating;
    },
    
    setViewFormat(format) {
      this.currentViewFormat = format;
    },
    
    toggleControlsCollapsed() {
      this.isControlsCollapsed = !this.isControlsCollapsed;
      return this.isControlsCollapsed;
    },
    
    toggleTimetableCollapsed() {
      this.isTimetableCollapsed = !this.isTimetableCollapsed;
      return this.isTimetableCollapsed;
    }
  }
};

// Make AppState globally accessible
window.AppState = AppState;
