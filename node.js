// Script untuk generate hash yang benar
// Jalankan di Node.js: node generate_hash.js

const crypto = require('crypto');

// Daftar flag yang ingin di-hash
const flags = [
  "FLAG{welcome_to_ctf}",
  "FLAG{basic_crypto}",
  "FLAG{decode_this}",
  "FLAG{find_me}",
  "FLAG{sql_master}",
];

console.log('=== CTF Flag Hashes (SHA256) ===\n');

flags.forEach(flag => {
  const hash = crypto.createHash('sha256').update(flag).digest('hex');
  console.log(`Flag: ${flag}`);
  console.log(`Hash: ${hash}`);
  console.log(`SQL: UPDATE ctf_challenges SET flag_hash = '${hash}' WHERE title LIKE '%welcome%';\n`);
});

console.log('\n=== Copy-paste SQL for Supabase ===\n');
flags.forEach(flag => {
  const hash = crypto.createHash('sha256').update(flag).digest('hex');
  console.log(`-- Flag: ${flag}`);
  console.log(`UPDATE ctf_challenges SET flag_hash = '${hash}' WHERE flag_hash IS NULL OR flag_hash = '';`);
  console.log('');
});

// Atau buat insert statement baru
console.log('\n=== Sample INSERT statement ===\n');
console.log(`
INSERT INTO ctf_challenges (title, description, difficulty, points, category, flag_hash)
VALUES 
  ('Welcome Challenge', 'Find the flag in the description: FLAG{welcome_to_ctf}', 'easy', 10, 'warmup', '${crypto.createHash('sha256').update('FLAG{welcome_to_ctf}').digest('hex')}'),
  ('Basic Crypto', 'Decode: RkxBR3tiYXNpY19jcnlwdG99', 'easy', 20, 'crypto', '${crypto.createHash('sha256').update('FLAG{basic_crypto}').digest('hex')}'),
  ('Hidden Flag', 'The flag is hidden in the source code', 'medium', 30, 'web', '${crypto.createHash('sha256').update('FLAG{find_me}').digest('hex')}');
`);