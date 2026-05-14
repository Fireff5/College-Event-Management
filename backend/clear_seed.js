const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
    user: process.env.DB_USER, host: process.env.DB_HOST,
    database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: process.env.DB_PORT,
});
pool.query("DELETE FROM participants WHERE id IN ('SP1001','SP1002')")
    .then(r => console.log('Deleted', r.rowCount, 'sample participant(s)'))
    .catch(e => console.error(e.message))
    .finally(() => pool.end());
