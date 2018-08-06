var axios = require('axios')
var uuidv1 = require('uuid/v1')
var db = require('../models')
var PhoneNoToRegistrationId = db["PhoneNoToRegistrationId"];

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
  console.log(phoneNos);
  var registrationIds = []

  var promises = []
  // Get the corresponding registrationIds to phoneNos
  phoneNos.forEach((phoneNo) => {
    promises.push(PhoneNoToRegistrationId.find({ where: {phoneNo:phoneNo} })
                           .then((phoneNoToRegistrationId) => {
                                registrationIds.push(phoneNoToRegistrationId.registrationId)
                              }
                            )
                            .catch((err) => console.log('Error finding corresponding Id: '+err)))
  })

  // Create a notification group on FCM once all the corresponding regIds are
  // fetched from db
  Promise.all(promises).then(() => {
    console.log('RegistrationIds :'+registrationIds)
    axios({
      method: 'post',
      url: 'https://fcm.googleapis.com/fcm/notification',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'key=AAAATBUSzKs:APA91bFDorxTw-AXVrFTGhVEtnobQHRLQ2g8pHJqnw5fDwMiFBKPS6kBgatdWDBdKHwnpszMMxzhltpAvvML97Kn6QXSRTQh5dADQ7EUirzQdxfEHAfhmOu1e0IHc-WrKroIOi7Xz6K4c2PUP1gq_El75ppfIHepXw',
        'project_id':'326771068075'
      },
      data: {
        'operation': 'create',
        'notification_key_name': uuidv1(),
        'registration_ids': registrationIds
      }
    })
    .then((response) => {
      var notification_key = response.data.notification_key;
      console.log('NOTIFICATION KEY: '+notification_key)
      // Send message to group members
      axios({
        method: 'post',
        url: 'https://fcm.googleapis.com/fcm/send',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'key=AAAATBUSzKs:APA91bFDorxTw-AXVrFTGhVEtnobQHRLQ2g8pHJqnw5fDwMiFBKPS6kBgatdWDBdKHwnpszMMxzhltpAvvML97Kn6QXSRTQh5dADQ7EUirzQdxfEHAfhmOu1e0IHc-WrKroIOi7Xz6K4c2PUP1gq_El75ppfIHepXw'
        },
        data: {
          'to': notification_key,
          'notification': {
            'sound': 'default',
            'gcmSandbox': 'true',
            'badge': 1,
            'title' : 'SupremeCourt',
            'body': 'Time slot was booked! Open your app to confirm/reject.'
          }
        }
      })
      .then((response) => {
        console.log(response.data)
      })
    })})

}
module.exports = {
  addNewRegistrationId : addNewRegistrationId,
  sendNotifications: sendNotifications
}
