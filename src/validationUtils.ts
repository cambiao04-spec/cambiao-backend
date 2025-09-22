import axios from "axios";
import * as crypto from 'crypto';

export function decryptToken(rawToken: string): any {
    if (!rawToken) throw new Error('Token no proporcionado');
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET no está definido');
    const key = crypto.createHash('sha256').update(secret).digest();

    const cleanToken = decodeURIComponent(rawToken.replace(/\s/g, '+'));
    const [ivB64, authTagB64, encryptedB64] = cleanToken.split('.');
    if (!ivB64 || !authTagB64 || !encryptedB64) throw new Error('Formato de token inválido');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const encrypted = Buffer.from(encryptedB64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
}

export async function encryptToken(payload: object): Promise<string> {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET no definido');

    const key = crypto.createHash('sha256').update(secret).digest();

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const json = JSON.stringify(payload);
    let encrypted = cipher.update(json, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    return [iv.toString('base64'), authTag.toString('base64'), encrypted].join('.',);
}

export async function exchangeRateCurrencyUsd(currency: string, monto: number): Promise<number> {
    const apiKey = process.env.API_EXCHANGE_RATE;
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${currency}`;
    const { data } = await axios.get(url);
    const rate = data.conversion_rates['USD'];
    if (!rate) throw new Error('No se pudo obtener la tasa');
    return +(monto * rate).toFixed(2);
}

export async function exchangeRateCurrencyLocal(currency: string, monto: number): Promise<number> {
    const apiKey = process.env.API_EXCHANGE_RATE;
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
    const { data } = await axios.get(url);
    const rate = data.conversion_rates[currency];
    if (!rate) throw new Error('No se pudo obtener la tasa');
    return +(monto * rate).toFixed(2);
}

export function extractPublicId(imageUrl: string): string | null {
    const regex = /\/upload\/(?:v\d+\/)?([^\.]+)\./;
    const match = imageUrl.match(regex);
    return match ? match[1] : null;
}
