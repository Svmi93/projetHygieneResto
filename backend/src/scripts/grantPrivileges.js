const mysql = require('mysql2/promise');
require('dotenv').config();

async function grantPrivileges() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: process.env.USERNAME,
    password: process.env.PASSWORD,
    port: 8889,
  });

  try {
    const dbName = process.env.DATABASE;
    const username = process.env.USERNAME;
    const password = process.env.PASSWORD;

    const grantQuery = "GRANT ALL PRIVILEGES ON " + dbName + ".* TO '" + username + "'@'%';";
    const flushQuery = "FLUSH PRIVILEGES;";

    await connection.query(grantQuery);
    await connection.query(flushQuery);

    console.log('Privileges granted successfully.');
  } catch (error) {
    console.error('Error granting privileges:', error.message);
  } finally {
    await connection.end();
  }
}

grantPrivileges();
