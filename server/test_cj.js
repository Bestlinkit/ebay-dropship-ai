const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3001/api/cj';

async function testCJAPI() {
    console.log("--- STARTING CJ API VERIFICATION ---");
    
    try {
        // 1. Test Search
        console.log("\n[1/3] Testing CJ Search (Keyword: 'iPhone Case')...");
        const searchRes = await axios.get(`${BASE_URL}/search?keyword=iPhone Case`);
        console.log("Status:", searchRes.data?.code === 200 ? "SUCCESS ✅" : "FAILED ❌");
        if (searchRes.data?.data?.list) {
            console.log("Items found:", searchRes.data.data.list.length);
            const firstPid = searchRes.data.data.list[0].pid;
            
            // 2. Test Detail
            console.log(`\n[2/3] Testing CJ Detail (PID: ${firstPid})...`);
            const detailRes = await axios.get(`${BASE_URL}/detail?pid=${firstPid}`);
            console.log("Status:", detailRes.data?.code === 200 ? "SUCCESS ✅" : "FAILED ❌");
            
            if (detailRes.data?.data?.productVariants) {
                const firstVid = detailRes.data.data.productVariants[0].vid;
                
                // 3. Test Freight
                console.log(`\n[3/3] Testing CJ Freight (VID: ${firstVid})...`);
                const freightRes = await axios.post(`${BASE_URL}/freight`, {
                    startCountryCode: 'CN',
                    endCountryCode: 'US',
                    products: [{ quantity: 1, vid: firstVid }]
                });
                console.log("Status:", freightRes.data?.code === 200 ? "SUCCESS ✅" : "FAILED ❌");
                console.log("Logistics providers:", freightRes.data?.data?.length || 0);
            }
        }
        
    } catch (error) {
        console.error("Verification CRASHED ❌");
        console.error("Message:", error.message);
        if (error.response) {
            console.error("Response Data:", error.response.data);
        }
    }
    
    console.log("\n--- VERIFICATION COMPLETE ---");
}

testCJAPI();
