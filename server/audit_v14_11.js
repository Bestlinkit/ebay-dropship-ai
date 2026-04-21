const axios = require('axios');
require('dotenv').config();

const CJ_GATEWAY = 'https://developers.cjdropshipping.com/api2.0/v1';
const API_KEY = process.env.VITE_CJ_API_KEY;

async function forensicLogisticsAudit() {
    console.log("--- 🕵️ FORENSIC CJ AUDIT v14.11 (SKU & WAREHOUSE) ---");
    
    try {
        // [PHASE 0] Authenticate
        console.log("[0/5] Authenticating with CJ API Key...");
        const authRes = await axios.post(`${CJ_GATEWAY}/authentication/getAccessToken`, {
            apiKey: API_KEY
        });
        
        if (!authRes.data?.data?.accessToken) {
            console.error("❌ AUTH FAILED:", authRes.data);
            return;
        }
        const token = authRes.data.data.accessToken;
        console.log("✅ Authenticated. Token length:", token.length);
        const headers = { 'CJ-Access-Token': token, 'Content-Type': 'application/json' };

        // [PHASE 1] Check SKU Validity at Logistics Level
        const targetSku = "CJYD193576801AZ";
        console.log(`\n[1/5] Verifying Target SKU: ${targetSku}...`);
        
        const listRes = await axios.get(`${CJ_GATEWAY}/product/list`, {
            params: { sku: targetSku },
            headers
        });

        const product = listRes.data?.data?.list?.[0];
        if (!product) {
            console.log("❌ SKU NOT FOUND in official product list.");
            return;
        }

        const pid = product.pid;
        console.log(`✅ SKU VALID. PID: ${pid}. Name: ${product.productNameEn}`);

        // [PHASE 2] Fetch Full Details to see Warehouse Options
        console.log(`\n[2/5] Fetching Variant & Warehouse Metadata (PID: ${pid})...`);
        const detailRes = await axios.get(`${CJ_GATEWAY}/product/detail`, {
            params: { pid },
            headers
        });

        const variants = detailRes.data?.data?.productVariants || [];
        console.log(`Found ${variants.length} variants in registry.`);

        // [PHASE 3] Test 3 SKUs for Consistency
        const testSkus = variants.slice(0, 3).map(v => ({
            sku: v.variantSku,
            whCode: v.variantWarehouseCode || 'CN'
        }));

        console.log(`\n[3/5] Consistency Test (Target + 2 Variants):`);
        
        const destination = "US";
        
        for (const item of testSkus) {
            console.log(`--- Testing SKU: ${item.sku} (Default WH: ${item.whCode}) ---`);
            
            // Sub-test A: Default Warehouse
            const p1 = {
                startCountryCode: (item.whCode === 'US') ? 'US' : 'CN',
                endCountryCode: destination,
                products: [{ skuCode: item.sku, quantity: 1 }]
            };
            
            try {
                const res1 = await axios.post(`${CJ_GATEWAY}/logistic/freightCalculate`, p1, { headers });
                console.log(`[DEFAULT WH: ${p1.startCountryCode}] Result:`, res1.data.code, res1.data.message);
                if (res1.data.data?.length > 0) console.log(`✅ SUCCESS: ${res1.data.data.length} methods.`);
                else {
                    console.log("⚠️ EMPTY RESPONSE. DATA:", JSON.stringify(res1.data, null, 2));
                }

                // Sub-test B: Forced Inverse Warehouse (If CN, try US and vice versa)
                const inverseWh = p1.startCountryCode === 'CN' ? 'US' : 'CN';
                const p2 = { ...p1, startCountryCode: inverseWh };
                const res2 = await axios.post(`${CJ_GATEWAY}/logistic/freightCalculate`, p2, { headers });
                console.log(`[FORCED WH: ${inverseWh}] Result:`, res2.data.code, res2.data.message);
                if (res2.data.data?.length > 0) console.log(`✅ SUCCESS: ${res2.data.data.length} methods for Inverse WH.`);

            } catch (err) {
                console.error(`❌ API FAULT for ${item.sku}:`, err.response?.data || err.message);
            }
        }

    } catch (e) {
        console.error("Forensic Audit CRASHED:", e.message);
    }
    
    console.log("\n--- FORENSIC AUDIT COMPLETE ---");
}

forensicLogisticsAudit();
