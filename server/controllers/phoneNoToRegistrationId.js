var db = require('../models')

/**
 * @function addNewRegistrationId
 * @summary: API controller to add a new a new registration Id to an existing
 * phoneNo or create a new row in PhoneNoToRegistrationId table if no such
 * phoneNo exits
 * @param {object} req: request object
 * @param {object} res: response object
 * @returns
 */
const addNewRegistrationId = (req, res) => {
  const phoneNo = req.body.phoneNo;
  const registrationId = req.body.registrationId;
  PhoneNoToRegistrationId = db["PhoneNoToRegistrationId"];

  PhoneNoToRegistrationId.findOrCreate({
                                          where: {phoneNo: phoneNo},
                                          defaults: {registrationId: registrationId}
                                        })
                          .spread((user, created) => {
                            if(!created) {
                              user.updateAttributes({
                                registrationId: registrationId
                              })
                            }
                          })
                          .then(() =>
                            res.status(200).send({ message:'success!' })
                          );
};

/**
 * @function sendNotifications
 * @summary: API controller that gets the registrationIds corresponding to
 * phoneNos in the input and creates a FCM device group for the these
 * registrationIds and sends a notificaiton message to the members of the group.
 * @param {object} req: request object
 * @param {object} res: response object
 * @returns
 */
const sendNotifications = (req, res) => {
  const phoneNos = req.body.phoneNos;
  PhoneNoToRegistrationId = db["PhoneNoToRegistrationId"];
  console.log(phoneNos);

  res.status(200).send({ phoneNos })
};

module.exports = {
  addNewRegistrationId : addNewRegistrationId,
  sendNotifications: sendNotifications
}
