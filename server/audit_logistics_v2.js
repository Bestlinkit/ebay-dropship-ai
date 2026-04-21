const axios = require('axios');
require('dotenv').config();

const CJ_GATEWAY = 'https://developers.cjdropshipping.com/api2.0/v1';

async function forensicAuditV2() {
    console.log("--- 🕵️ FORENSIC CJ AUDIT v2.0 (DEEP CARRIER PROBE) ---");
    
    // 1. SETUP
    const token = process.env.CJ_ACCESS_TOKEN || '';
    if (!token) {
        console.error("❌ ERROR: CJ_ACCESS_TOKEN not found in env.");
        return;
    }
    const headers = { 'CJ-Access-Token': token, 'Content-Type': 'application/json' };

    // Target SKU
    const targetSku = "CJYD193576801AZ";

    try {
        // [STEP 1] Fetch Product Details by SKU to find PID and all variants
        console.log(`\n[1/5] CROSS-CHECKING SKU: ${targetSku} via CJ Product API...`);
        const searchRes = await axios.get(`${CJ_GATEWAY}/product/list`, {
            params: { sku: targetSku },
            headers
        });

        const product = searchRes.data?.data?.list?.[0];
        if (!product) {
            console.log("❌ CRITICAL: SKU not found in CJ Product Registry.");
            return;
        }

        const pid = product.pid || product.productId;
        console.log(`✅ MATCH: PID found: ${pid}. Title: ${product.productNameEn}`);

        // [STEP 2] Get ALL variants for this PID to test consistency
        console.log(`\n[2/5] FETCHING ALL VARIANTS for consistency test...`);
        const detailRes = await axios.get(`${CJ_GATEWAY}/product/variant/list`, {
            params: { pid },
            headers
        });

        const variants = detailRes.data?.data || [];
        console.log(`Found ${variants.length} variants.`);

        const testSkus = variants.slice(0, 5).map(v => ({
            sku: v.variantSku || v.skuCode || v.sku,
            warehouse: v.variantWarehouseCode || 'CN'
        }));

        // [STEP 3 & 4] Run Logistics Probes
        console.log(`\n[3/4/5] STARTING MULTI-SKU LOGISTICS PROBE...`);
        
        for (const item of testSkus) {
            console.log(`\n--- PROBING SKU: ${item.sku} (WH: ${item.warehouse}) ---`);
            
            const payload = {
                startCountryCode: (item.warehouse === 'US' || item.warehouse === 'United States') ? 'US' : 'CN',
                endCountryCode: "US",
                products: [{ skuCode: item.sku, quantity: 1 }]
            };

            console.log("REQUEST PAYLOAD:", JSON.stringify(payload));
            
            try {
                const fRes = await axios.post(`${CJ_GATEWAY}/logistic/freightCalculate`, payload, { headers });
                
                console.log("RAW FULL RESPONSE:");
                console.log(JSON.stringify(fRes.data, null, 2));

                if (fRes.data.data && fRes.data.data.length > 0) {
                    console.log(`✅ SUCCESS: ${fRes.data.data.length} methods found for ${item.sku}`);
                } else {
                    console.log(`⚠️ EMPTY: No methods for ${item.sku}. Check message: "${fRes.data.message}"`);
                }

            } catch (err) {
                console.error(`❌ API ERROR for ${item.sku}:`, err.response?.data || err.message);
            }
        }

        // [STEP B] Cross-Warehouse Test for Target SKU
        console.log(`\n--- [SPECIAL] CROSS-WAREHOUSE TEST (SKU: ${targetSku}) ---`);
        const whTestPayload = {
            startCountryCode: "US", // Force US warehouse test even if listed as CN
            endCountryCode: "US",
            products: [{ skuCode: targetSku, quantity: 1 }]
        };
        console.log("Testing FORCE-US Request:", JSON.stringify(whTestPayload));
        try {
            const whRes = await axios.post(`${CJ_GATEWAY}/logistic/freightCalculate`, whTestPayload, { headers });
            console.log("FORCE-US RESPONSE:", JSON.stringify(whRes.data, null, 2));
        } catch (e) {
            console.error("FORCE-US FAILED:", e.response?.data || e.message);
        }

    } catch (error) {
        console.error("Forensic Audit CRASHED:", error.message);
    }

    console.log("\n--- FORENSIC AUDIT COMPLETE ---");
}

forensicAuditV2();
