module.exports = (sequelize, DataTypes) => {
  // setup User model and its fields.
  const Booking = sequelize.define('Booking', {
    hearingId: {
      type: DataTypes.STRING,
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      unique: false
    },
    hearingDate: {
      type:DataTypes.STRING,
      allowNull: false
    },
    venue: {
      type: DataTypes.STRING,
      allowNull: false
    },
    timeslot: {
      type: DataTypes.STRING,
      allowNull: false
    },
    bookerNo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false
    },
    pendingParties: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: false
    },
    status: {
      type: DataTypes.ENUM('ongoing','booked','rejected','expired'),
      allowNull:false,
      defaultValue: 'ongoing'
    },
    acceptedParties: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: []
    }
  });
  return Booking;
};
