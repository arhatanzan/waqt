# WAQT-E-NAMAZ Pro Generator

A sophisticated astronomical prayer times calculator and timetable generator for the Islamic calendar, combining strict astronomical precision with traditional Shia jurisprudential rules (Ihtiyat) and historical documentation.

## 🌟 Features

### Core Functionality
- **Precise Prayer Time Calculation**: Uses SunCalc astronomical library with custom derivations for Fajr (-19°), Maghrib (-4.5°), and specialized solar angles
- **Dual Calendar System**: Displays both Gregorian and Hijri (lunar) calendar dates simultaneously
- **Multiple View Formats**: 
  - Table view with detailed prayer times
  - Calendar grid view for quick reference
- **Customizable Display Options**:
  - Show/hide Saher (pre-dawn meal end time)
  - Show/hide Events (historical and solar events)
  - Show/hide Tareeq (lunar date auspiciousness)
  - 12-hour or 24-hour time format

### Advanced Features
- **Live Digital & Analog Clock**: Real-time display with precision updates
- **Geolocation Support**: Search any city worldwide using Open-Meteo API
- **Audio Notifications**: Azaan playback with adjustable speed (0.5x to 3x)
- **PDF Export**: Generate professional A4 PDF timetables
- **Hijri Data Caching**: Fast API responses with intelligent caching
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

### Calculation Methodology
This timetable integrates:
- **Astronomical Precision**: -19° solar depression for Fajr, -4.5° for Maghrib
- **Safety Buffers**: 10-minute subtraction for Saher, 5-minute subtraction for Maghrib
- **Tareeq (Nahas/Saad)**: Derived from traditions of Imam Jafar al-Sadiq (A.S.)
  - Standard Nahas: 3rd, 5th, 13th, 16th, 21st, 24th, 25th of lunar month
  - Nahas Akbar (Major Inauspicious): 1st of Muharram, Safar, Rabi al-Awwal, Rabi-us-Sani

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for:
  - City search (Open-Meteo API)
  - Hijri calendar data (Al-Adhan API)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/waqt-e-namaz.git
   cd waqt-e-namaz
   ```

2. **Open in browser**
   ```bash
   # Simply open index.html
   open index.html
   # Or use a local server
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

### Usage

1. **Select Location**
   - Click on the "City" search field
   - Type your city name (e.g., "London", "Dubai", "Istanbul")
   - Select from suggestions

2. **Choose Date Range**
   - Set "From" date for start of timetable
   - Set "To" date for end of timetable
   - Default: 30 days from today

3. **Generate Timetable**
   - Click "Generate" button
   - Wait for API data to load

4. **Customize Display**
   - Toggle columns (Saher, Events, Tareeq)
   - Choose time format (12H/24H)
   - Switch between Table and Calendar view
   - Click "Apply Changes"

5. **Export to PDF**
   - Click "📄 Export PDF" button
   - Standard A4 portrait format
   - Includes all visible columns

6. **Audio Playback**
   - Click "▶" to play Azaan
   - Adjust playback speed from 0.5x to 3x
   - Click "⏹" to stop

## 📁 Project Structure

```
waqt-e-namaz/
├── index.html              # Main HTML template
├── README.md              # This file
├── .gitignore             # Git ignore rules
├── .nvmrc                 # Node version specifier
├── css/
│   └── styles.css         # Custom CSS styles
├── js/
│   ├── app.js            # Main application controller
│   ├── api.js            # API layer (Hijri data, cache)
│   ├── utils.js          # Utility functions
│   ├── audio.js          # Audio player functionality
│   └── clock.js          # Live clock and date updates
├── data/
│   ├── events.js         # Historical and solar events data
│   └── azaan.mp3         # Azaan audio file
└── netlify/
    └── functions/        # Netlify serverless functions
        └── usno.js       # USNO API wrapper (optional)
```

## 🔧 Technical Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Tailwind CSS for styling, responsive design
- **Vanilla JavaScript**: ES6+ with modular architecture
- **Libraries**:
  - [SunCalc.js](https://github.com/mourner/suncalc) - Astronomical calculations
  - [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) - PDF generation
  - Tailwind CSS - Utility-first CSS framework

### APIs
- **Open-Meteo Geocoding API**: City search and location data
- **Al-Adhan API**: Hijri calendar conversions
- **USNO (Optional)**: Alternative astronomical calculations

## 📊 API Specifications

### Open-Meteo Geocoding
```javascript
GET https://geocoding-api.open-meteo.com/v1/search
Parameters:
  - name: City name to search
  - count: Maximum results (default: 5)
  - language: Result language code
  - format: json
```

### Al-Adhan API
```javascript
GET https://api.aladhan.com/v1/gToHCalendar/{month}/{year}
Returns:
  - Hijri calendar conversions
  - Month view with all dates
  - Cached by month for performance
```

## 🎨 Customization

### Prayer Time Settings
Edit `js/app.js` to modify solar angles:
```javascript
// Current configuration (lines 4-5)
SunCalc.addTime(-19, "saherExact", "saherEnd"); 
SunCalc.addTime(-4.5, "maghribExact", "maghribEnd");
```

### Color Scheme
Modify Tailwind classes in `index.html` for theming

### Events Data
Edit `data/events.js` to add/remove historical events and solar dates

## 📋 PDF Export Details

- **Format**: A4 Portrait
- **Margins**: 15mm on all sides
- **Font**: Arial, 9px base size
- **Content**: Header, timetable, footer with generation timestamp
- **Includes**: All visible columns based on user settings
- **Excludes**: Controls, clock, and UI elements

## 🌐 Deployment

### Netlify (Recommended)
```bash
npm install -g netlify-cli
netlify deploy
```

### GitHub Pages
```bash
# Push to gh-pages branch
git push origin main
```

### Traditional Hosting
Simply upload all files to your web server. No build process required.

## 🛠️ Development

### Code Structure
- **Modular Functions**: Each function has single responsibility
- **JSDoc Comments**: Comprehensive function documentation
- **Error Handling**: Try-catch blocks with user-friendly messages
- **Performance**: API caching, debounced search, efficient DOM updates

### Adding Features
1. Create feature branch: `git checkout -b feature/new-feature`
2. Follow existing code style and patterns
3. Add JSDoc comments to new functions
4. Test thoroughly before committing
5. Submit pull request

## 🐛 Known Issues & Limitations

- Prayer times may vary slightly based on madhab (Islamic school of thought)
- Some regions may have API data limitations
- Audio playback requires browser support for MP3
- PDF export quality depends on system rendering

## 📱 Browser Support

| Browser | Support |
|---------|---------|
| Chrome  | ✅ Full |
| Firefox | ✅ Full |
| Safari  | ✅ Full |
| Edge    | ✅ Full |
| IE 11   | ❌ Not supported |

## 📝 License

This project is open source. Please check LICENSE file for details.

## 🙏 Credits

- **Created by**: Kaif Abbas
- **Libraries**: SunCalc.js, html2pdf.js, Tailwind CSS
- **Data**: Al-Adhan API, Open-Meteo API

## 📞 Support & Feedback

For issues, suggestions, or contributions:
- Create an issue on GitHub
- Submit a pull request
- Contact the maintainer

## 🎓 Islamic References

- Imam Jafar al-Sadiq (A.S.) - Source of many calculations
- Tuhfat al-Awam - Traditional jurisprudential reference
- Shia Islamic Jurisprudence - Calculation methodology basis

---

**Last Updated**: March 2026
**Version**: 1.0.0

*"So establish prayer and give zakah, and borrow from Allah a beautiful loan."* - Quran 73:20