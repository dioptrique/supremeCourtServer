module.exports = {
  up: (queryInterface, Sequelize) => {
    [
      queryInterface.addColumn('Bookings', 'hearingDate', {
        type: Sequelize.STRING,
        allowNull: false
      })
    ]
  },
  down: queryInterface => {
    [
      queryInterface.removeColumn('Bookings', 'hearingDate'),
    ]
  }
};
