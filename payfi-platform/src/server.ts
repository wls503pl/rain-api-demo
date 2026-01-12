import express from "express";
import merchantRoutes from "./routes/merchants";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "PayFi API" });
});

// Register route
app.use("/api", merchantRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`PayFi API running at http://localhost:${PORT}`);
});
