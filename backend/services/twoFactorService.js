/**
 * TWO-FACTOR AUTHENTICATION SERVICE
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

class TwoFactorService {
    generateSecret(userEmail) {
        return speakeasy.generateSecret({
            name: `${process.env.TWO_FACTOR_ISSUER} (${userEmail})`,
            issuer: process.env.TWO_FACTOR_ISSUER || 'RTWE ERP'
        });
    }

    async generateQRCode(secret) {
        try {
            return await QRCode.toDataURL(secret.otpauth_url);
        } catch (error) {
            console.error('QR code generation error:', error);
            throw error;
        }
    }

    verifyToken(secret, token) {
        return speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: parseInt(process.env.TWO_FACTOR_WINDOW) || 2
        });
    }

    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            const formatted = code.match(/.{1,4}/g).join('-');
            codes.push(formatted);
        }
        return codes;
    }

    encrypt(text) {
        const algorithm = 'aes-256-cbc';
        const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
        const iv = Buffer.from(process.env.ENCRYPTION_IV, 'hex');

        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return encrypted;
    }

    decrypt(encrypted) {
        const algorithm = 'aes-256-cbc';
        const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
        const iv = Buffer.from(process.env.ENCRYPTION_IV, 'hex');

        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}

module.exports = new TwoFactorService();
