module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.changeColumn('Bookings', 'hearingId',{
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      autoIncrement: false
    }),
  down: queryInterface => queryInterface.changeColumn('Bookings', 'hearingId', {
    type: Sequelize.STRING,
    allowNull: false,
    unique: false,
    autoIncrement: false
  })
};
