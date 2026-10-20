# Waylo — HTML, CSS & JavaScript Prototype

A responsive, beginner-friendly front-end prototype for a Karachi public transport helper.

## Run it
1. Extract `waylo-prototype.zip`.
2. Open the `waylo-prototype` folder.
3. Double-click `index.html` to open it in your browser.
4. For location and voice input, use a supported browser (usually Chrome) and allow microphone access when prompted. Voice recognition may require HTTPS or localhost.

## Files
- `index.html` — page structure and sample content
- `style.css` — responsive layout and visual styling
- `script.js` — demo interactions and filtering

## Working in this prototype
- Enter start and destination
- Swap locations
- Choose cheapest, fastest, balanced, or less-walking priority
- Set budget and transfer limit to filter sample route cards
- Expand step-by-step route instructions
- Try voice input (browser support varies)
- Open a community report form and add a demo report to the feed
- "Use my current location" detects where you are (GPS, then OpenStreetMap place name; falls back to the nearest known Karachi area)
- Pick areas from a suggestion list, make text larger with A+, share trip plan

## Important
This is a front-end prototype. Route options, fares, travel times, and community updates are illustrative demo data, not verified live information. It does not yet connect to a database, official transport feeds, real GPS tracking, or an AI model. To launch it for real users, connect your actual route database and validate fares, stops, accessibility, and safety information.
