// netlify/functions/usno.js

exports.handler = async function(event, context) {
    const { type, year, date, coords } = event.queryStringParameters;
    let url = "";

    if (date && coords) {
        url = `https://aa.usno.navy.mil/api/eclipses/${type}/date?date=${date}&coords=${coords}&height=0`;
    } else {
        url = `https://aa.usno.navy.mil/api/eclipses/${type}/year?year=${year}`;
    }

    try {
        // 1. Check if the Node version is too old
        if (typeof fetch === "undefined") {
            return { 
                statusCode: 500, 
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: "Netlify Node version is too old. It does not support fetch()." }) 
            };
        }

        const response = await fetch(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/json'
            }
        });
        
        // 2. Check if the Navy firewall rejected our server
        if (!response.ok) {
            return { 
                statusCode: 500, 
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: `US Navy blocked the Netlify Server. Status: ${response.status}` }) 
            };
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        // 3. Catch actual code crashes and print the literal error message
        return { 
            statusCode: 500, 
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Backend crash", details: error.message }) 
        };
    }
};