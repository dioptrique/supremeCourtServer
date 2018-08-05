const dotenv = require('dotenv');

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DEV_DB,
    host: '127.0.0.1',
    port: 5432,
    dialect: 'postgres'
  },
  production: {
  }
};
