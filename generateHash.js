const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'Motdepasse93260!';
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Generated bcrypt hash:', hash);
}

generateHash();
