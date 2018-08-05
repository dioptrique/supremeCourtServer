fs  = require('fs')
path = require('path')
Sequelize = require('sequelize')
dotenv = require('dotenv')
configs = require('../config/config')

// Current module's filename
const basename = path.basename(module.filename);
// If NODE_ENV is not set in .env file env is 'development by default'
const env = process.env.NODE_ENV || 'development';
// configuration depends on the enviroment we set in .env
const config = configs[env];
const db = {};
var sequelize = null;

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
  // Initialize the sequelize ORM with the values in config/config.js file
  sequelize = new Sequelize(config.database, config.username,
                                            config.password, config);
} else if(process.env.NODE_ENV === 'production') {
  console.log('Binding remoteDB to sequelize')
  sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false,
  dialectOptions: {
    ssl: true /* for SSL config since Heroku gives you this out of the box */
  }
});
}

// Test connection to database
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

/*
  Import all the sequelize models defined in separate files in the models
  directory and store them in the db[] array as key value pairs, where
  the key is the model name and the value is the model.
*/
fs
  .readdirSync(__dirname) // Read all the files in the current directory
  .filter(file =>
  // file is not hidden file
  (file.indexOf('.') !== 0) &&
  // file is not this file: 'index.js'
  (file !== basename) &&
  // file is javascript file
  (file.slice(-3) === '.js'))
  .forEach((file) => {
  const model = sequelize.import(path.join(__dirname, file));
  db[model.name] = model;
});

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
