
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const PROXY_URL = process.env.VITE_PROXY_URL;
const APP_ID = process.env.VITE_EBAY_APP_ID;
const CERT_ID = process.env.VITE_EBAY_CERT_ID;

async function testItemFetch(itemId) {
    try {
        console.log(`Testing Fetch for Item: ${itemId}`);
        const authBase64 = Buffer.from(`${APP_ID}:${CERT_ID}`).toString('base64');
        const tokenRes = await axios.post('https://api.ebay.com/identity/v1/oauth2/token', 
            'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${authBase64}`
            }
        });
        const token = tokenRes.data.access_token;
        console.log("Token Secured.");

        const targetUrl = `https://api.ebay.com/buy/browse/v1/item/v1|${itemId}|0`;
        console.log(`Requesting: ${targetUrl}`);
        
        const proxyUri = `${PROXY_URL}?url=${encodeURIComponent(targetUrl)}&auth=${encodeURIComponent(token)}&marketplaceid=EBAY_US`;
        const response = await axios.get(proxyUri);
        
        console.log("Response Status:", response.status);
        console.log("Data Type:", typeof response.data);
        console.log("Main Image:", response.data.image?.imageUrl);
        console.log("Additional Images:", response.data.additionalImages?.length);
        console.log("Price:", response.data.price?.value);

    } catch (e) {
        console.error("Fetch Failed.");
        if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Data:", JSON.stringify(e.response.data, null, 2));
        } else {
            console.error(e.message);
        }
    }
}

testItemFetch("187636131520");
