module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('Bookings', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      hearingId: {
        type: Sequelize.STRING,
        allowNull: false,
        autoIncrement: false,
        primaryKey: false,
        unique: false
      },
      timeslot: {
        type: Sequelize.STRING,
        allowNull: false
      },
      bookerNo: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: false
      },
      notificationKey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: false
      },
      pendingParties: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: false
      },
      status: {
        type: Sequelize.ENUM('ongoing','booked','rejected','expired'),
        allowNull:false,
        defaultValue: 'ongoing'
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
  down: queryInterface => queryInterface.dropTable('Bookings')
};
