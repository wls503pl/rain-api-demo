// ============================================================================
// FILE: compliance.ts
// PURPOSE: KYC management and merchant account controls
// ============================================================================

import { Router } from "express";
import { apiKeyAuth } from "../middleware/auth";
import { KYCLevel, KYC_LEVELS } from "../compliance/kycLevels";

/**
 * Compliance Data Storage
 *
 * This is in-memory demo storage. In production, these would be
 * persisted in PostgreSQL for durability and scalability.
 *
 * merchantKycMap: Maps merchant_id -> KYCLevel for fast lookup
 * frozenMerchants: Set of merchant IDs with frozen/suspended accounts
 */

/**
 * merchantKycMap
 *
 * In-memory registry of KYC verification levels for merchants.
 *
 * Structure: Record<merchantId, KYCLevel>
 * Example: { 1: "Basic", 2: "Standard", 3: "VIP" }
 *
 * Default: If a merchant is not in this map, they default to "Unverified"
 *
 * Usage:
 * - Read by: riskEngine.ts, wallets.ts, cards.ts for compliance checks
 * - Written by: compliance.ts set-kyc endpoint
 *
 * In Production:
 * Should be: SELECT merchant_id, kyc_level FROM merchants
 * or a JOIN with users/merchants table
 */
export const merchantKycMap: Record<number, KYCLevel> = {};

/**
 * frozenMerchants
 *
 * In-memory set of merchant IDs with suspended/frozen accounts.
 * Frozen merchants cannot perform ANY transactions regardless of KYC level.
 *
 * Structure: Set<merchantId>
 * Example: Set { 5, 12, 18 }
 *
 * Usage:
 * - Checked by: complianceCheck() in wallets.ts and cards.ts
 * - Modified by: compliance.ts (future freeze/unfreeze endpoints)
 *
 * In Production:
 * Should be: SELECT merchant_id FROM merchants WHERE status = 'frozen'
 */
export const frozenMerchants = new Set<number>();

const router = Router();

/**
 * POST /api/compliance/set-kyc
 *
 * Updates a merchant's KYC verification level.
 * Determines what transaction amounts they can perform.
 *
 * Authentication: Required (X-API-Key header)
 *
 * Request Body:
 * {
 *   "level": "Unverified" | "Basic" | "Standard" | "Business" | "VIP"
 * }
 *
 * Response on Success:
 * {
 *   "message": "KYC updated",
 *   "merchantId": number,
 *   "level": "Basic" (or whatever was set)
 * }
 *
 * Response on Invalid Level:
 * {
 *   "error": "Invalid KYC level"
 * }
 * HTTP: 400 Bad Request
 *
 * Implementation:
 * 1. Extract authenticated merchant ID from request
 * 2. Validate that requested level exists in KYC_LEVELS
 * 3. Store merchant -> level mapping in merchantKycMap
 * 4. Confirm with response
 *
 * Effect:
 * - All future transactions by this merchant are evaluated against new limits
 * - Takes effect immediately
 * - Can be called multiple times to change level (no version control)
 */
router.post("/compliance/set-kyc", apiKeyAuth, (req: any, res) => {
    const merchantId = req.merchant.id;
    const { level } = req.body;

    // Validate that the requested level is one of the allowed values
    if (!Object.values(KYC_LEVELS).includes(level)) {
        return res.status(400).json({ error: "Invalid KYC level" });
    }

    // Store the merchant's new KYC level in memory
    merchantKycMap[merchantId] = level;

    // Confirm the update
    res.json({
        message: "KYC updated",
        merchantId,
        level,
    });
});

export default router;
