// ============================================================================
// FILE: compliance.ts
// PURPOSE: Manage KYC levels and check merchant compliance
// ============================================================================

import { Router } from "express";
import { apiKeyAuth } from "../middleware/auth";
import { KYCLevel, KYC_LEVELS } from "../compliance/kycLevels";
import { query } from "../db";

const router = Router();

// Endpoint: Update merchant's KYC level
// Only authenticated merchant can update their own KYC level
router.post("/compliance/set-kyc", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    const { level } = req.body;

    // Validate that level is one of the valid KYC levels
    if (!Object.values(KYC_LEVELS).includes(level)) {
        return res.status(400).json({ error: "Invalid KYC level" });
    }

    try {
        // Update merchant's KYC level in database
        await query("UPDATE merchants SET kyc_level = $1 WHERE id = $2", [
            level,
            merchantId,
        ]);

        res.json({ message: "KYC updated", merchantId, level });
    } catch (err) {
        console.error("Failed to update KYC:", err);
        res.status(500).json({ error: "Failed to update KYC" });
    }
});

// Helper function: Get merchant's KYC level and frozen status
// This is called before every transaction to check compliance
// Returns both KYC level and frozen status from database
export async function getMerchantCompliance(merchantId: number) {
    try {
        // Query database for this merchant's KYC and frozen status
        const result = await query(
            "SELECT kyc_level, is_frozen FROM merchants WHERE id = $1",
            [merchantId]
        );

        // If merchant not found, return safe defaults (no transactions allowed)
        if (result.rowCount === 0) {
            return { kycLevel: KYC_LEVELS.Unverified, isFrozen: false };
        }

        const row = result.rows[0];
        return {
            kycLevel: (row.kyc_level as KYCLevel) ?? KYC_LEVELS.Unverified,
            isFrozen: row.is_frozen ?? false,
        };
    } catch (err) {
        console.error("Error fetching merchant compliance:", err);
        // If error, assume merchant is not verified (safest option)
        return { kycLevel: KYC_LEVELS.Unverified, isFrozen: false };
    }
}

export default router;
