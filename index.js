export default function handler(req, res) {
    res.status(200).json({
        message: "Welcome to the API!",
        endpoints: {
            ping: "/api/ping",
            weather: "/api/weather?q={city}&verify={YOUR_VERIFY_TOKEN}&freedom=true",
        },
    });
}
