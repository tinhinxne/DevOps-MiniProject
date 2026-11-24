const { Pool } = require('pg');
require('pg').types.setTypeParser(1082, (v) => v);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;