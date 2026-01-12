// Register routes in server.ts
import express from "express";
import merchantRoutes from "./routes/merchants";
import { apiKeyAuth } from "./middleware/auth";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "PayFi API" });
});

// Create a protected interface for testing authentication
app.get("/api/protected", apiKeyAuth, (req, res) => {
    res.json({ message: "You have access to protected resource" });
});

// Register route
app.use("/api", merchantRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`PayFi API running at http://localhost:${PORT}`);
});
