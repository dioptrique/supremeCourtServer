var axios = require('axios')
var uuidv1 = require('uuid/v1')
var db = require('../models')
var PhoneNoToRegistrationId = db["PhoneNoToRegistrationId"];
var Booking = db['Booking'];

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
 * @function bookNow
 * @summary: API controller that gets the registrationIds corresponding to
 * phoneNos in the input and creates a FCM device group for the these
 * registrationIds and sends a notificaiton message to the members of the group.
 * Then, a new booking is inserted into the Bookings table
 * @param {object} req: request object
 * @param {object} res: response object
 * @returns
 */
const bookNow = (req, res) => {
  const phoneNos = req.body.phoneNos;
  const bookerNo = req.body.bookerNo;
  const timeslot = req.body.timeslot;
  const hearingId = req.body.hearingId;
  const partyCount = req.body.partyCount;

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
      // Create a an ongoing booking row in the booking column
      Booking.create({
        hearingId,
        timeslot,
        bookerNo,
        notificationKey: notification_key,
        pendingParties: partyCount,
        status: 'ongoing'
      })
      .then(() =>
        // Send message to group members
        axios({
          method: 'post',
          url: 'https://fcm.googleapis.com/fcm/send',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'key=AAAATBUSzKs:APA91bFDorxTw-AXVrFTGhVEtnobQHRLQ2g8pHJqnw5fDwMiFBKPS6kBgatdWDBdKHwnpszMMxzhltpAvvML97Kn6QXSRTQh5dADQ7EUirzQdxfEHAfhmOu1e0IHc-WrKroIOi7Xz6K4c2PUP1gq_El75ppfIHepXw'
          },
          data: {
            "message":{
              "token":notification_key,
              "notification":{
                "title":"SupremeCourt",
                "body":"Time slot was booked."
              },
              "data" : {
                "hearingId" : hearingId
              }
            }
            /*'to': notification_key,
            'notification': {
              'sound': 'default',
              'gcmSandbox': 'true',
              'badge': 1,
              'title' : 'SupremeCourt',
              'body': 'Time slot was booked! Open your app to confirm/reject.',
              'click_action':'com.example.skynet.supremecourt_TARGET_NOTIFICATION'
            },
            'data': {
              'hearindId': hearingId
            }
          }*/
        })
        .then((response) => {
          console.log(response.data)
          res.status(200).end();
        })
      )
    })})
}
module.exports = {
  addNewRegistrationId : addNewRegistrationId,
  bookNow: bookNow
}
