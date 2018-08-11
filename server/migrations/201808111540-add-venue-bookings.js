module.exports = {
  up: (queryInterface, Sequelize) => {
    [
      queryInterface.addColumn('Bookings', 'venue', {
        type: Sequelize.STRING,
        allowNull: false
      })
    ]
  },
  down: queryInterface => {
    [
      queryInterface.removeColumn('Bookings', 'venue'),
    ]
  }
};
