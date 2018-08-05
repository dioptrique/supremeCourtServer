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

  message = {
    msg: 'wassup'
  }

  res.status(200).send({ message })
};

module.exports = {
  addNewRegistrationId : addNewRegistrationId
}
