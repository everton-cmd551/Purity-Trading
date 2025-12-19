const fs = require('fs');
const content = `DATABASE_URL="postgresql://neondb_owner:npg_7cELgz8Pktpq@ep-falling-waterfall-abpy1ipa-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"`;
fs.writeFileSync('.env', content);
console.log('.env updated successfully');
