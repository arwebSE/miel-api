// Environment vars
require("dotenv").config();

// Essential deps & config
const express = require("express");
const app = require("express")();
const NodeCache = require("node-cache");
const nCache = new NodeCache();
const httpServer = require("http").Server(app);
const port = process.env.PORT;
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const fs = require("fs");

const apiKey = process.env["API_KEY"];
const apiUrl = process.env["API_URL"];
const geoUrl = process.env["GEO_URL"];

let logDate = new Date();
logDate = logDate.toLocaleDateString();
logDate = logDate.replaceAll("/", "");

const log = fs.createWriteStream(`${__dirname}/logs/${logDate}.log`, { flags: "w" });

const timeConsole = (...args) => {
    const d = new Date();
    console.log(`[${d.toLocaleTimeString()}]`, ...args);
    log.write(`[${d.toLocaleTimeString()}] ${args}\n`);
};

// Server setup
app.use(express.json()); // parsing application/json
app.use(express.urlencoded({ extended: true })); // parsing application/x-www-form-urlencoded

// cors
app.use((req, res, next) => {
    res.append("Access-Control-Allow-Origin", "*");
    res.append("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Expose-Headers", "*");
    next();
});

// Env mode check
timeConsole("Launching API in env mode:", process.env.NODE_ENV);

const cacheMW = (duration) => {
    return (req, res, next) => {
        const oUrl = req.originalUrl.split('&id')[0];
        const rUrl = req.url.split('&id')[0];
        let key = "__express__" + oUrl || rUrl;
        let cachedBody = nCache.get(key);
        if (cachedBody) {
            timeConsole("Query already fetched, sending cache...");
            res.send(cachedBody);
            return;
        } else {
            res.sendResponse = res.send;
            res.send = (body) => {
                timeConsole("Storing response in cache...");
                nCache.set(key, body, duration);
                res.sendResponse(body);
            }
            next();
        }
    }
};

/** ROUTES **/

// Ping route for uptimerobot
app.all("/ping", (_req, res) => {
    res.send("API is running!");
});

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

// Get weather, caches for 10min
app.all("/weather", cacheMW(60 * 10), async (req, res) => {
    if (req.query.verify === process.env["VERIFY"]) {
        timeConsole("Got incoming call from:", req.query.id);
        const geo = await getGeoData(req.query.q);
        const exclude = "hourly,minutely,alerts";
        let units = "metric";
        if (req.query.freedom === "true") units = "imperial";
        const response = await fetch(
            `${apiUrl}?lat=${geo.lat}&lon=${geo.lon}&appid=${apiKey}&exclude=${exclude}&units=${units}`
        );
        const weather = await response.json();
        timeConsole("Got weather:", weather.current.weather[0].main);
        res.json({ geo, ...weather });
    } else res.send("Unauthorized.");
});

/** ROUTES END **/

// ERROR HANDLING
app.use((_req, _res, next) => {
    let err = new Error("Not Found");
    err.status = 404;
    next(err);
});
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({
        errors: [{ status: err.status, title: err.message, detail: err.message }],
    });
});

app.listen(async () => {
    // BOOT TEXT
    let date = new Date();

    const bootup = new Promise((resolve) => httpServer.listen({ port }, resolve));
    await bootup
        .then(timeConsole(`🚀 API launched at http://localhost:${port}`))
        .then(app.emit("booted"))
        .catch((err) => timeConsole("Error booting up!", err));
    timeConsole(`🌠 [${date.toISOString().slice(0, -5)}]`);
});

module.exports = { app, httpServer };
