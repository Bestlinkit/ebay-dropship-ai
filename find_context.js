import fs from 'fs';
import path from 'path';

const assetsDir = 'dist/assets';
const files = fs.readdirSync(assetsDir).filter(f => f.startsWith('index-') && f.endsWith('.js'));

for (const file of files) {
    const filePath = path.join(assetsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const regex = /.{0,50}createContext.{0,50}/g;
    let match;
    console.log(`Results for ${file}:`);
    while ((match = regex.exec(content)) !== null) {
        console.log(`Match: ${match[0]}`);
    }
}
