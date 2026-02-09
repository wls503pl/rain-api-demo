// ============================================================================
// FILE: webhooks.ts
// PURPOSE: Merchant webhook configuration
// ============================================================================
import { Router } from "express";
import { apiKeyAuth } from "../middleware/auth";
import { query } from "../db";

const router = Router();

// Endpoint: Configure Webhook URL
router.post("/webhooks/config", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "Webhook URL is required" });
    }

    try {
        await query("UPDATE merchants SET webhook_url = $1 WHERE id = $2", [
            url,
            merchantId,
        ]);
        res.json({ message: "Webhook URL updated successfully", url });
    } catch (err) {
        res.status(500).json({
            error: "Failed to update webhook configuration",
        });
    }
});

// Endpoint: Get current Webhook configuration
router.get("/webhooks/config", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    try {
        const result = await query(
            "SELECT webhook_url FROM merchants WHERE id = $1",
            [merchantId]
        );
        res.json({ url: result.rows[0]?.webhook_url || null });
    } catch (err) {
        res.status(500).json({
            error: "Failed to fetch webhook configuration",
        });
    }
});

export default router;
