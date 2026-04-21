const axios = require('axios');
require('dotenv').config();

const CJ_GATEWAY = 'https://developers.cjdropshipping.com/api2.0/v1';

async function auditLogistics() {
    const sku = "CJYD193576801AZ";
    const countryCode = "US";
    const warehouseId = "CN"; // Default for this SKU type
    
    const payload = {
        startCountryCode: (warehouseId === 'US' || warehouseId === 'United States') ? 'US' : 'CN',
        endCountryCode: countryCode,
        products: [{ skuCode: sku, quantity: 1 }]
    };

    console.log("--- 🕵️ FORENSIC CJ AUDIT: REQUEST ---");
    console.log(JSON.stringify(payload, null, 2));

    try {
        const response = await axios.post(`${CJ_GATEWAY}/logistic/freightCalculate`, payload, {
            headers: { 
                'CJ-Access-Token': process.env.CJ_ACCESS_TOKEN || '',
                'Content-Type': 'application/json' 
            }
        });

        console.log("\n--- 🕵️ FORENSIC CJ AUDIT: RESPONSE ---");
        console.log(JSON.stringify(response.data, null, 2));

    } catch (err) {
        console.error("\n--- 🕵️ FORENSIC CJ AUDIT: FAILURE ---");
        console.error("Status:", err.response?.status);
        console.log(JSON.stringify(err.response?.data || { message: err.message }, null, 2));
    }
}

auditLogistics();
