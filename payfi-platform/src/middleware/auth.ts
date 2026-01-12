// Add API Key authentication middleware (critical engineering capability)
import { Request, Response, NextFunction } from "express";

// Simple simulated storage (optimize it into a database later)
const validApiKeys = new Set<string>();

export function registerApiKey(key: string) {
    validApiKeys.add(key);
}

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey || typeof apiKey !== "string") {
        return res.status(401).json({ error: "Missing API Key" });
    }

    if (!validApiKeys.has(apiKey)) {
        return res.status(403).json({ error: "Invalid API Key" });
    }

    next();
}
