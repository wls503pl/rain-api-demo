// receiver.js,
// a simple server that listens on port 8080 and prints the bodies of received POST requests.
const http = require("http");
const server = http.createServer((req, res) => {
    if (req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", () => {
            console.log("Received Webhook:", JSON.parse(body));
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "received" }));
        });
    } else {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Webhook receiver running");
    }
});
server.listen(8080, () => {
    console.log("Webhook receiver listening on port 8080");
});
