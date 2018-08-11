module.exports = {
  up: queryInterface => {
    [
      queryInterface.removeColumn('Bookings', 'notificationKey'),
    ]
  },
  down: (queryInterface, Sequelize) => {
    [
      queryInterface.addColumn('Bookings', 'notificationKey', {
        type: Sequelize.STRING,
        allowNull: false
      })
    ]
  }
};
