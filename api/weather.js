import fetch from "node-fetch";
import cache from "../utils/cache";
import timeConsole from "../utils/timeConsole";

const apiKey = process.env.API_KEY;
const apiUrl = process.env.API_URL;
const geoUrl = process.env.GEO_URL;

const getGeoData = async (city) => {
    const geoResponse = await fetch(`${geoUrl}?q=${city}&appid=${apiKey}&limit=1`);
    const geoResult = await geoResponse.json();
    const data = {
        lat: geoResult[0].lat,
        lon: geoResult[0].lon,
        name: `${geoResult[0].name}, ${geoResult[0].country}`,
    };
    timeConsole("Got geo", data);
    return data;
};

export default async function handler(req, res) {
    const { q: city, id, freedom, verify } = req.query;

    if (verify !== process.env.VERIFY) {
        res.status(401).send("Unauthorized.");
        return;
    }

    timeConsole("Got incoming call from:", id);

    // Use cache if available
    const cachedWeather = cache.get(city);
    if (cachedWeather) {
        timeConsole("Sending cached weather data...");
        res.status(200).json(cachedWeather);
        return;
    }

    try {
        const geo = await getGeoData(city);
        const units = freedom === "true" ? "imperial" : "metric";
        const exclude = "hourly,minutely,alerts";

        const weatherResponse = await fetch(
            `${apiUrl}?lat=${geo.lat}&lon=${geo.lon}&appid=${apiKey}&exclude=${exclude}&units=${units}`
        );
        const weather = await weatherResponse.json();
        const responseData = { geo, ...weather };

        // Cache for 10 minutes
        cache.set(city, responseData, 600);
        timeConsole("Fetched and cached new weather data.");

        res.status(200).json(responseData);
    } catch (error) {
        timeConsole("Error fetching weather data", error);
        res.status(500).json({ error: "Failed to fetch weather data" });
    }
}
