module.exports = {
  up: (queryInterface, Sequelize) => {
    [
      queryInterface.addColumn('Bookings', 'acceptedParties', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: []
      })
    ]
  },
  down: queryInterface => {
    [
      queryInterface.removeColumn('Bookings', 'acceptedParties'),
    ]
  }
};
