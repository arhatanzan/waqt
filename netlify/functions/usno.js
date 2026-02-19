// netlify/functions/usno.js

exports.handler = async function(event, context) {
    // 1. Extract the parameters sent from your frontend app
    const { type, year, date, coords } = event.queryStringParameters;
    let url = "";

    // 2. Build the correct USNO URL based on what your app is asking for
    if (date && coords) {
        url = `https://aa.usno.navy.mil/api/eclipses/${type}/date?date=${date}&coords=${coords}&height=0`;
    } else {
        url = `https://aa.usno.navy.mil/api/eclipses/${type}/year?year=${year}`;
    }

    try {
        // 3. The server fetches the data directly (No CORS blocks here!)
        const response = await fetch(url, {
            headers: { 
                'User-Agent': 'WaqtNamaz-App/1.0',
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();

        // 4. Send the data securely back to your frontend
        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" // Ensures your frontend can read it
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "Failed to fetch from USNO API" }) 
        };
    }
};