// ============================================================================
// FILE: webhookService.ts
// PURPOSE: Asynchronous event notification service
// ============================================================================
import axios from "axios";
import { query } from "../db";

export enum WebhookEvent {
    PAYMENT_SUCCESS = "payment.success",
    BALANCE_UPDATED = "balance.updated",
    KYC_UPDATED = "kyc.updated",
    ACCOUNT_FROZEN = "account.frozen",
}

export async function triggerWebhook(
    merchantId: number,
    event: WebhookEvent,
    data: any
) {
    try {
        // 1. Get merchant's webhook URL
        const result = await query(
            "SELECT webhook_url FROM merchants WHERE id = $1",
            [merchantId]
        );
        const webhookUrl = result.rows[0]?.webhook_url;

        if (!webhookUrl) {
            console.log(
                `[Webhook] No URL configured for merchant ${merchantId}, skipping.`
            );
            return;
        }

        // 2. Prepare payload
        const payload = {
            id: `evt_${Math.random().toString(36).substr(2, 9)}`,
            event,
            merchantId,
            data,
            created_at: new Date().toISOString(),
        };

        // 3. Send asynchronously (don't await in main flow)
        console.log(`[Webhook] Sending ${event} to ${webhookUrl}`);

        axios
            .post(webhookUrl, payload, { timeout: 5000 })
            .then((response) => {
                console.log(
                    `[Webhook] Success: Merchant ${merchantId} received ${event}`
                );
            })
            .catch((err) => {
                console.error(
                    `[Webhook] Failed: Could not reach ${webhookUrl}. Error: ${err.message}`
                );
            });
    } catch (err) {
        console.error("[Webhook] Service Error:", err);
    }
}
