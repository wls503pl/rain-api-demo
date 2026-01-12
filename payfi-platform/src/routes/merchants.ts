import { Router } from "express";
import crypto from "crypto";

const router = Router();

// Simulate a database (stored in memory initially)
const merchants: any[] = [];

// Create a merchant
router.post("/merchants", (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Merchant name is required" });
    }

    const apiKey = crypto.randomBytes(24).toString("hex");

    const merchant = {
        id: merchants.length + 1,
        name,
        apiKey,
        createdAt: new Date(),
    };

    merchants.push(merchant);

    res.json({
        message: "Merchant created",
        merchant: {
            id: merchant.id,
            name: merchant.name,
            apiKey: merchant.apiKey,
        },
    });
});

export default router;
