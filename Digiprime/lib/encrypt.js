const crypto = require('crypto');

const secret = process.env.ENCRYPTION_KEY || "ThisIsMySecretKey123456789101112";

module.exports.encrypt = async (plainJson) => {
    try {
        // Random IV
        const iv = crypto.randomBytes(16);

        // cipher with secretkey + IV
        const cipher = crypto.createCipheriv('aes-256-cbc', secret, iv);

        // Stringify the content
        const jsonData = JSON.stringify(plainJson);

        // Encrypt the JSON and convert to base64 encoding
        let encryptedData = cipher.update(jsonData, 'utf8', 'base64');
        encryptedData += cipher.final('base64');

        // Concat the IV and encrypted data
        const encryptedPayload = Buffer.concat([iv, Buffer.from(encryptedData, 'base64')]);

        return encryptedPayload.toString('base64');
    } catch (error) {
        console.error('Error encrypting data:', error);
        return null;
    }
};

module.exports.decrypt = async (encryptedJson) => {
    try {
        const encryptedPayload = Buffer.from(encryptedJson, 'base64');

        // Extract the IV and encrypted text
        const iv = encryptedPayload.subarray(0, 16);
        const encryptedText = encryptedPayload.subarray(16);

        // Create a decipher object using the secret key, IV, and specifying the padding scheme
        const decipher = crypto.createDecipheriv('aes-256-cbc', secret, iv);
        // Auto padding
        decipher.setAutoPadding(true);

        let decryptedData = decipher.update(encryptedText, 'base64', 'utf8');
        decryptedData += decipher.final('utf8');

        return JSON.parse(decryptedData);
    } catch (error) {
        console.error('Error decrypting data:', error);
        return null;
    }
};