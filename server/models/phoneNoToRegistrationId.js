module.exports = (sequelize, DataTypes) => {
  // setup User model and its fields.
  const PhoneNoToRegistrationId = sequelize.define('PhoneNoToRegistrationId', {
    phoneNo: {
      allowNull: false,
      type: DataTypes.STRING,
      unique: true
    },
    registrationId: {
      allowNull: false,
      type: DataTypes.STRING,
      unique:false
    }
  });
  return PhoneNoToRegistrationId;
};
