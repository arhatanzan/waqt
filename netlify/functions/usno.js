// netlify/functions/usno.js
const https = require('https');

exports.handler = async function(event, context) {
    const { type, year, date, coords } = event.queryStringParameters;
    let url = "";

    // Build the URL
    if (date && coords) {
        url = `https://aa.usno.navy.mil/api/eclipses/${type}/date?date=${date}&coords=${coords}&height=0`;
    } else {
        url = `https://aa.usno.navy.mil/api/eclipses/${type}/year?year=${year}`;
    }

    // Use a Promise to handle the native HTTPS request
    return new Promise((resolve) => {
        https.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/json'
            }
        }, (res) => {
            let data = '';

            // A chunk of data has been received
            res.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received
            res.on('end', () => {
                // If the Navy blocks the Netlify server, pass the error securely
                if (res.statusCode !== 200) {
                    resolve({
                        statusCode: 500,
                        headers: { "Access-Control-Allow-Origin": "*" },
                        body: JSON.stringify({ error: `US Navy firewall blocked Netlify. Status: ${res.statusCode}` })
                    });
                    return;
                }

                // Success! Send the eclipse data back to your frontend
                resolve({
                    statusCode: 200,
                    headers: { 
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*" 
                    },
                    body: data
                });
            });

        }).on("error", (err) => {
            // A hard network crash occurred
            resolve({
                statusCode: 500,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: "Backend network crash", details: err.message })
            });
        });
    });
};