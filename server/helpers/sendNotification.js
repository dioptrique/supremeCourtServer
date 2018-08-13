var axios = require('axios')
var uuidv4 = require('uuid/v4')

/**
 * @function sendNotification
 * @summary: Send notifications to device groups using FCM
 * Then, a new booking is inserted into the Bookings table
 * @param {String[]} registrationIds: the registrationIds to the send the notifications to
 * @returns Promise
 */

module.exports = sendNotification = (registrationIds, message) => {
   console.log('RegistrationIds :'+registrationIds)
   return axios({
     method: 'post',
     url: 'https://fcm.googleapis.com/fcm/notification',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'key=AAAATBUSzKs:APA91bFDorxTw-AXVrFTGhVEtnobQHRLQ2g8pHJqnw5fDwMiFBKPS6kBgatdWDBdKHwnpszMMxzhltpAvvML97Kn6QXSRTQh5dADQ7EUirzQdxfEHAfhmOu1e0IHc-WrKroIOi7Xz6K4c2PUP1gq_El75ppfIHepXw',
       'project_id':'326771068075'
     },
     data: {
       'operation': 'create',
       'notification_key_name': uuidv4(),
       'registration_ids': registrationIds
     }
   })
   .then((response) => {
     var notification_key = response.data.notification_key;
     // Send message to group members
     axios({
       method: 'post',
       url: 'https://fcm.googleapis.com/fcm/send',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': 'key=AAAATBUSzKs:APA91bFDorxTw-AXVrFTGhVEtnobQHRLQ2g8pHJqnw5fDwMiFBKPS6kBgatdWDBdKHwnpszMMxzhltpAvvML97Kn6QXSRTQh5dADQ7EUirzQdxfEHAfhmOu1e0IHc-WrKroIOi7Xz6K4c2PUP1gq_El75ppfIHepXw'
       },
       data: {
         'to':notification_key,
         'notification': {
           'title':'SupremeCourt',
           'body': message,
           'click_action':'com.example.skynet.supremecourt_TARGET_NOTIFICATION'
         },
         'data' : {
           'hearingId' : hearingId
         }
       }
     })
     .catch((err) => {
       throw err;
     })
   })
   .catch((err) => {
     throw err;
   })
}
