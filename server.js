"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// import bodyParser from "body-parser";
require("dotenv/config");
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default(); // Connects to Redis at default localhost:6379
const app = (0, express_1.default)();
const FAVORITES_KEY = "favorites";
const port = 3000;
const path = require('path');
const API_KEY = process.env.weatherApiKey;
// this will serve all files in the public directory as static
// files, such as HTML, CSS, images, etc.
app.use(express_1.default.static("public"));
app.use(express_1.default.json()); // to support JSON-encoded bodies
app.use(express_1.default.static(path.join(__dirname, 'static')));
// GET /api/weather/:zipcode
app.get("/api/weather/:zipcode", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("GET /api/weather");
    console.log(JSON.stringify(req.params));
    const zipCode = req.params.zipcode;
    try {
        const response = yield fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${zipCode}&days=3&aqi=yes&alerts=yes`);
        if (!response.ok)
            throw new Error("Failed to fetch weather data");
        const data = yield response.json();
        console.log(data);
        res.status(200).json({
            location: data.location.name,
            state: data.location.region,
            currentTempC: data.current.temp_c,
            currentTempF: data.current.temp_f,
            condition: data.current.condition.text,
            forecast: data.forecast.forecastday.map((day) => ({
                date: day.date,
                condition: day.day.condition.text,
                minTempC: day.day.mintemp_c,
                maxTempC: day.day.maxtemp_c,
                minTempF: day.day.mintemp_f,
                maxTempF: day.day.maxtemp_f
            }))
        });
        console.log("Weather data fetched successfully");
    }
    catch (error) {
        console.error("Error fetching weather data:", error);
        res.status(500).json({ error: "Invalid ZIP code or no weather data available." });
    }
    return;
}));
app.post("/api/favorite/:zipcode", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("POST /api/favorite/:zipcode");
    const zipCode = req.params.zipcode;
    if (!zipCode) {
        res.status(400).send("You must provide a zip code to add a favorite.");
        return;
    }
    yield addFavorite(zipCode, res);
}));
// Get all favorite zip codes
app.get("/api/favorite", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("GET /api/favorite");
    try {
        const favorites = yield redis.smembers(FAVORITES_KEY); // Retrieve all zip codes
        res.status(200).json({ favorites });
    }
    catch (error) {
        console.error("Error retrieving favorites:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
// Delete a favorite zip code
app.delete("/api/favorite/:zipcode", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("DELETE /api/favorite/:zipcode");
    const zipCode = req.params.zipcode;
    if (!zipCode) {
        res.send("You must provide a zip code to delete a favorite.");
        return;
    }
    yield deleteFavorite(zipCode, res);
}));
function addFavorite(zipCode, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const exists = yield redis.sismember(FAVORITES_KEY, zipCode);
            if (exists) {
                return res.status(409).json({ error: "Zip code is already a favorite." });
            }
            yield redis.sadd(FAVORITES_KEY, zipCode);
            res.status(201).json({ message: "Zip code added to favorites.", zipCode });
        }
        catch (error) {
            console.error("Error adding favorite:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
        return;
    });
}
function deleteFavorite(zipCode, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const removed = yield redis.srem(FAVORITES_KEY, zipCode);
            if (!removed) {
                return res.status(404).json({ error: "Zip code not found in favorites." });
            }
            res.status(204).json({ message: "Zip code removed from favorites.", zipCode });
        }
        catch (error) {
            console.error("Error deleting favorite:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
        return;
    });
}
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
