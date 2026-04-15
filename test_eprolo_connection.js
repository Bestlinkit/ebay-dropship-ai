import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Manual .env loader for ESM
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envConfig = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envConfig.split(/\r?\n/).forEach(line => {
            if (line.trim() && !line.startsWith('#')) {
                const firstEqual = line.indexOf('=');
                if (firstEqual !== -1) {
                    const key = line.substring(0, firstEqual).trim();
                    const value = line.substring(firstEqual + 1).trim();
                    env[key] = value;
                }
            }
        });
        return env;
    } catch (e) {
        return {};
    }
}

const env = loadEnv();
const API_KEY = env.VITE_EPROLO_API_KEY;
const API_SECRET = env.VITE_EPROLO_API_SECRET;
const PROXY_URL = env.VITE_PROXY_URL;

async function testEndpoint(url, useProxy = false) {
    const finalUrl = useProxy ? `${PROXY_URL}?url=${encodeURIComponent(url)}` : url;
    console.log(`\nTesting: ${url} (${useProxy ? 'VIA PROXY' : 'DIRECTLY'})`);
    
    try {
        const response = await axios({
            method: 'post',
            url: finalUrl,
            data: { keywords: 'watch', page: 1, limit: 1 },
            headers: {
                'X-API-KEY': API_KEY,
                'X-API-SECRET': API_SECRET,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
        });
        console.log(`Result: SUCCESS (Status ${response.status})`);
        console.log("Response Body (first 100 chars):", JSON.stringify(response.data).substring(0, 100));
        return true;
    } catch (error) {
        if (error.response) {
            console.log(`Result: FAILED (Status ${error.response.status})`);
        } else {
            console.log(`Result: ERROR (${error.message})`);
        }
        return false;
    }
}

async function runDiagnostics() {
    console.log("--- EPROLO API DEEP DIAGNOSTIC V2 ---");
    
    if (!API_KEY || !API_SECRET) {
        console.error("Missing credentials in .env");
        return;
    }

    const variations = [
        'https://api.eprolo.com/openapi/v1/product/list',
        'https://api.eprolo.com/v1/product/list',
        'https://api.eprolo.com/api/v1/product/list',
        'https://api.eprolo.com/product/list'
    ];

    for (const url of variations) {
        await testEndpoint(url, false); // Directly first to confirm path
    }
}

runDiagnostics();
