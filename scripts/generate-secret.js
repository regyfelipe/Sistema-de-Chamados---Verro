// Script para gerar NEXTAUTH_SECRET
// Execute: node scripts/generate-secret.js

const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('base64');

console.log('\n✅ NEXTAUTH_SECRET gerado:');
console.log(secret);
console.log('\n📝 Adicione esta linha ao seu arquivo .env.local:');
console.log(`NEXTAUTH_SECRET=${secret}\n`);

