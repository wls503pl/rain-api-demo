// ============================================================================
// FILE: compliance.ts
// PURPOSE: KYC management and merchant account controls (DB-backed)
// ============================================================================

import { Router } from "express";
import { apiKeyAuth } from "../middleware/auth";
import { KYCLevel, KYC_LEVELS } from "../compliance/kycLevels";
import { query } from "../db";

const router = Router();

/**
 * Set KYC level for authenticated merchant
 */
router.post("/compliance/set-kyc", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    const { level } = req.body;

    if (!Object.values(KYC_LEVELS).includes(level)) {
        return res.status(400).json({ error: "Invalid KYC level" });
    }

    try {
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

/**
 * getMerchantCompliance
 *
 * Fetch KYC level and frozen status from database.
 * This is the single source of truth for transaction compliance.
 *
 * Returns:
 * {
 *   kycLevel: KYCLevel,
 *   isFrozen: boolean
 * }
 *
 * Default: Unverified + not frozen if merchant not found
 */
export async function getMerchantCompliance(merchantId: number) {
    try {
        const result = await query(
            "SELECT kyc_level, is_frozen FROM merchants WHERE id = $1",
            [merchantId]
        );
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
        // fallback defaults
        return { kycLevel: KYC_LEVELS.Unverified, isFrozen: false };
    }
}

export default router;
