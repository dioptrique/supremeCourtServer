module.exports = {
  up: (queryInterface, Sequelize) => {
    [
      queryInterface.addColumn('Bookings', 'bookingId', {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      })
    ]
  },
  down: queryInterface => {
    [
      queryInterface.removeColumn('Bookings', 'bookingId'),
    ]
  }
};
