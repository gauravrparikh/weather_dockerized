import express from "express";
import 'dotenv/config'
import Redis from "ioredis";

const redis = new Redis('redis://redis:6379'); // Connects to Redis
const app = express();
const FAVORITES_KEY = "favorites";
const port = process.env.PORT || 3000;
const path = require('path');
const API_KEY = process.env.WEATHER_API_KEY;

// this will serve all files in the public directory as static
// files, such as HTML, CSS, images, etc.
app.use(express.static("public"));
app.use(express.json()); // to support JSON-encoded bodies
app.use(express.static(path.join(__dirname, 'static')));

// GET /api/weather/:zipcode
app.get("/api/weather/:zipcode", async (req, res) => {
    console.log("GET /api/weather");
    // console.log(JSON.stringify(req.params));
    const zipCode = req.params.zipcode;
    try {
        const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${zipCode}&days=3&aqi=yes&alerts=yes`);
        if (!response.ok) throw new Error("Failed to fetch weather data");

        const data = await response.json();
        console.log(data);

        res.status(200).json({
            location: data.location.name,
            state: data.location.region,
            currentTempC: data.current.temp_c,
            currentTempF: data.current.temp_f,
            condition: data.current.condition.text,
            forecast: data.forecast.forecastday.map((day: { date: any; day: { condition: { text: any; }; mintemp_c: any; maxtemp_c: any; mintemp_f: any; maxtemp_f: any; }; }) => ({
                date: day.date,
                condition: day.day.condition.text,
                minTempC: day.day.mintemp_c,
                maxTempC: day.day.maxtemp_c,
                minTempF: day.day.mintemp_f,
                maxTempF: day.day.maxtemp_f
            }))
        });
        console.log("Weather data fetched successfully");
    } catch (error) {
        console.error("Error fetching weather data:", error);
        res.status(500).json({ error: "Invalid ZIP code or no weather data available." });
    }
    return;
});
  
app.post("/api/favorite/:zipcode", async (req, res) => {
    console.log("POST /api/favorite/:zipcode");
    const zipCode = req.params.zipcode;
  
    if (!zipCode) {
      res.status(400).send("You must provide a zip code to add a favorite.");
      return;
    }
    await addFavorite(zipCode, res);
  });


// Get all favorite zip codes
app.get("/api/favorite", async (req, res) => {
    console.log("GET /api/favorite");

    try {
        const favorites = await redis.smembers(FAVORITES_KEY); // Retrieve all zip codes
        res.status(200).json({ favorites });
    } catch (error) {
        console.error("Error retrieving favorites:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



// Delete a favorite zip code
app.delete("/api/favorite/:zipcode", async (req, res) => {
    console.log("DELETE /api/favorite/:zipcode");
    const zipCode = req.params.zipcode;
    if (!zipCode) {
        res.send("You must provide a zip code to delete a favorite.");
        return;
    }
    await deleteFavorite(zipCode, res);
});

async function addFavorite(zipCode: string, res: any) {
    try {
            const exists = await redis.sismember(FAVORITES_KEY, zipCode);
            if (exists) {
                return res.status(409).json({ error: "Zip code is already a favorite." });
            }

            await redis.sadd(FAVORITES_KEY, zipCode);
            res.status(201).json({ message: "Zip code added to favorites.", zipCode });
    } catch (error) {
            console.error("Error adding favorite:", error);
            res.status(500).json({ error: "Internal Server Error" });
    }
    return;
}

async function deleteFavorite(zipCode: string, res: any) {
    try {
        const removed = await redis.srem(FAVORITES_KEY, zipCode);
        if (!removed) {
            return res.status(404).json({ error: "Zip code not found in favorites." });
        }

        res.status(204).json({ message: "Zip code removed from favorites.", zipCode });
    } catch (error) {
        console.error("Error deleting favorite:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
    return;
}



const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});