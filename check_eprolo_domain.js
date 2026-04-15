import axios from 'axios';

async function checkDomain() {
    const domains = [
        'https://api.eprolo.com',
        'https://api.eprolo.com/v1',
        'https://api.eprolo.com/v2',
        'https://www.eprolo.com/api'
    ];

    console.log("--- EPROLO DOMAIN CHECK ---");
    for (const d of domains) {
        try {
            const res = await axios.get(d, { timeout: 5000 });
            console.log(`${d}: SUCCESS (${res.status})`);
        } catch (e) {
            console.log(`${d}: FAILED (${e.response ? e.response.status : e.message})`);
        }
    }
}

checkDomain();
