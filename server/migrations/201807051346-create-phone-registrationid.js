module.exports = {
  // queryInterface object provides an API for performing actions on db.
  // Sequelize object has references of all database types needed to properly
  // define a database
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('PhoneNoToRegistrationId', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      phoneNo: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      registrationId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: false
      },
      // Sequelize model API throws an error if createdAt and updatedAt are
      // no available.
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }),
  down: queryInterface => queryInterface.dropTable('PhoneNoToRegistrationId')
};
