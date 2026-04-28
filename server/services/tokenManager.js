const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(__dirname, '../tokens.json');

class TokenManager {
    constructor() {
        this.tokens = this.loadTokens();
    }

    loadTokens() {
        try {
            if (fs.existsSync(TOKEN_PATH)) {
                const data = fs.readFileSync(TOKEN_PATH, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error("[TokenManager] Error loading tokens:", error);
        }
        return {
            access_token: null,
            refresh_token: null,
            expires_at: 0
        };
    }

    saveTokens(tokens) {
        try {
            const dataToSave = {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token || this.tokens.refresh_token,
                expires_at: Date.now() + (tokens.expires_in * 1000)
            };
            this.tokens = dataToSave;
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(dataToSave, null, 2));
            console.log("[TokenManager] Tokens saved successfully.");
        } catch (error) {
            console.error("[TokenManager] Error saving tokens:", error);
        }
    }

    getAccessToken() {
        return this.tokens.access_token;
    }

    getRefreshToken() {
        return this.tokens.refresh_token;
    }

    isExpired() {
        // Return true if within 5 minutes of expiration
        return Date.now() > (this.tokens.expires_at - 300000);
    }

    hasRefreshToken() {
        return !!this.tokens.refresh_token;
    }
}

module.exports = new TokenManager();
