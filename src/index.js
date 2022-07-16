// Environment vars
require("dotenv").config();

// Essential deps & config
const express = require("express");
const app = require("express")();
const httpServer = require("http").Server(app);
const port = process.env.PORT;
const cors = require("cors");

// Server setup
app.use(express.json()); // parsing application/json
app.use(express.urlencoded({ extended: true })); // parsing application/x-www-form-urlencoded
let corsOptions = {
    origin: ["https://studio.apollographql.com", "http://127.0.0.1", "http://localhost"],
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
};
app.use(cors(corsOptions)); // cors

// Env mode check
console.log("Launching API in env mode:", process.env.NODE_ENV);

/** ROUTES **/

// Index page (to check status of API)
app.get("/", function (_req, res) {
    res.json({
        data: { msg: `Index. DSN: ${db.getDSN()}`, status: "online" },
    });
});

// Ping route for uptimerobot
app.all("/ping", (_req, res) => {
    res.send("API is running!");
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
        .then(console.log(`🚀 API launched at http://localhost:${port}`))
        .then(app.emit("booted"))
        .catch((err) => console.log("Error booting up!", err));
    console.log(`🌠 [${date.toISOString().slice(0, -5)}]`);
});

module.exports = { app, httpServer };
