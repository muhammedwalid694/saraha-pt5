import crypto from "node:crypto";

// AES-256-GCM (authenticated encryption). The 32-byte key is derived from
// ENCRYPTION_SECRET_KEY, so the secret can be any length.
// Stored format: iv:authTag:ciphertext (all hex).
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

const getKey = () =>
    crypto.createHash("sha256").update(process.env.ENCRYPTION_SECRET_KEY).digest();

export const encrypt = (text) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(String(text), "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv, tag, encrypted].map((b) => b.toString("hex")).join(":");
}

export const decrypt = (payload) => {
    const [iv, tag, data] = payload.split(":").map((h) => Buffer.from(h, "hex"));
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

// For list endpoints: one corrupted value must not break the whole response.
export const safeDecrypt = (payload) => {
    try { return payload ? decrypt(payload) : payload; } catch { return null; }
}
