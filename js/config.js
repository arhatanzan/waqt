// ============================================
// APPLICATION CONFIGURATION (js/config.js)
// ============================================

/**
 * Centralized configuration for all element IDs, constants, and settings
 * This eliminates magic strings scattered throughout the codebase
 */

const CONFIG = {
  // ======= DOM SELECTORS =======
  DOM: {
    // Main containers
    app_body: 'app-body',
    app_container: 'app-container',
    pdf_header: 'pdf-header',
    
    // Theme toggle
    theme_toggle: 'themToggle',
    
    // Location & date inputs
    city_search: 'citySearch',
    search_results: 'searchResults',
    selected_lat: 'selectedLat',
    selected_lng: 'selectedLng',
    pending_city_name: 'pendingCityName',
    start_date: 'startDate',
    end_date: 'endDate',
    
    // Controls section
    controls_section: 'controls-section',
    controls_header: 'controls-header',
    controls_content: 'controls-content',
    collapse_icon: 'collapse-icon',
    
    // Timetable section
    timetable_section: 'timetable-section',
    timetable_header: 'timetable-header',
    timetable_content: 'timetable-content',
    timetable_collapse_icon: 'timetable-collapse-icon',
    
    // Table elements
    table_container: 'table-container',
    table_header: 'tableHeader',
    table_body: 'tableBody',
    
    // Calendar view
    calendar_container: 'calendar-container',
    calendar_grid: 'calendarGrid',
    
    // Live clock
    sec_hand: 'secHand',
    min_hand: 'minHand',
    hour_hand: 'hourHand',
    digital_time: 'digitalTime',
    live_greg_date: 'liveGregDate',
    live_hijri_date: 'liveHijriDate',
    
    // Display controls
    show_saher: 'showSaher',
    show_events: 'showEvents',
    show_tareeq: 'showTareeq',
    time_format: 'timeFormat',
    view_format: 'viewFormat',
    
    // Button controls
    generate_btn: 'generateBtn',
    play_pause_btn: 'playPauseBtn',
    
    // Audio elements
    azaan_audio: 'azaanAudio',
    audio_progress_container: 'audioProgressContainer',
    audio_progress_bar: 'audioProgressBar',
    audio_time_display: 'audioTimeDisplay',
    location_display: 'location-display',
    header_years: 'header-years',
    
    // Modal
    explanation_modal: 'explanationModal'
  },

  // ======= DISPLAY TEXT =======
  TEXT: {
    fetching: 'Fetching APIs...',
    generate: 'Generate',
    error_generate_first: 'Please generate the timetable first using the Generate button.',
    error_pdf_lib: 'PDF library is not loaded. Please refresh the page and try again.',
    error_export_pdf: 'An error occurred while exporting PDF: ',
    error_invalid_dates: 'End date cannot be earlier than the start date. Please select valid dates.',
    error_azaan: 'Please click \'Generate\' or play the audio manually once to enable Auto-Azaan.'
  },

  // ======= TIME FORMATTING =======
  TIME: {
    saher_buffer_minutes: 10,
    subah_angle: -18,
    tulu_buffer_minutes: 1,
    zohar_buffer_minutes: 1,
    maghrib_buffer_minutes: 5,
    
    clock_update_interval: 1000, // ms
    search_debounce_delay: 300  // ms
  },

  // ======= DATE DEFAULTS =======
  DATE: {
    default_days_ahead: 29,
    default_city: 'Lucknow',
    default_lat: 26.8467,
    default_lng: 80.9462,
    timezone_offset_threshold: 55 // longitude threshold for timezone adjustment
  },

  // ======= PDF EXPORT CONFIG =======
  PDF: {
    margin: [15, 15, 15, 15],
    filename: 'Waqt-e-Namaz-Timetable.pdf',
    image: { type: 'png', quality: 0.98 },
    html2canvas: { scale: 2, logging: false, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: 'avoid' }
  },

  // ======= AUDIO CONFIG =======
  AUDIO: {
    min_speed: 0.5,
    max_speed: 5,
    speed_step: 0.25
  },

  // ======= UI CLASSES =======
  CLASSES: {
    collapsed: 'collapsed',
    hidden: 'hidden',
    disabled: 'opacity-50',
    cursor_wait: 'cursor-wait',
    dark_mode: 'dark-mode',
    active_speed: 'bg-emerald-500 text-white font-extrabold',
    inactive_speed: 'bg-slate-100 text-slate-700'
  },

  // ======= THEME STORAGE =======
  STORAGE: {
    theme_key: 'theme',
    dark_mode_value: 'dark',
    light_mode_value: 'light'
  },

  // ======= GRID & TABLE =======
  TABLE: {
    time_col_class: 'p-3 font-bold border-r border-slate-300 whitespace-normal break-words min-w-[80px]'
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
