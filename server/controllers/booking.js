var db = require('../models');
var Booking = db['Booking'];
var PhoneNoToRegistrationId = db['PhoneNoToRegistrationId'];
var uuidv4 = require('uuid/v4');
var axios = require('axios');
var hearingIdToHearing = require('../data');
var Sequelize = require('sequelize')

const Op = Sequelize.Op;

/**
 * @function checkBookingStatus
 * @summary: API controller to check the status of the booking of the given
 * hearing. It also sends the bookerNo so that the bookerNo will not
 * receive the booking acceptance activity upon making a booking.
 * @param {object} req: request object
 * @param {object} res: response object
 * @returns
 */
 // TODO change findOne to find to check if there are more than one ongoing
 // hearing booking of the same hearingId
const checkBookingStatus = (req, res) => {
  const hearingId = req.body.hearingId;

  Booking.findOne({
    where: {
      hearingId: hearingId
    }
  })
  .then((booking) => {
    var response;
    if(booking === null) {
      response = {
        status: 'idle'
      }
    } else {
      response = {
        status: booking.status,
        bookerNo: booking.bookerNo,
        timeslot: booking.timeslot,
        acceptedParties: booking.acceptedParties
      }
      console.log(response)
    }
    res.status(200).send({ response })
  })
};

/**
 * @function getAvailableTimeslots
 * @summary: API controller to get the timeslots to a particular hearing
 * that are not already booked or ongoing on the same date and venue
 * @param {object} req: request object
 * @param {object} res: response object
 * @returns
 */
 //TODO all timeslots should depend on hearing time?
const getAvailableTimeslots = (req, res) => {
  const hearingId = req.body.hearingId;
  const hearingDate = hearingIdToHearing.get(hearingId).Date.split(' ')[0];
  const venue = hearingIdToHearing.get(hearingId).Venue;
  var allTimeslots = ["09:00","09:30","10:00",
      "10:30","11:00","11:30",
      "14:00","14:30","15:00",
      "15:30","16:00","16:30",
      "17:00","17:30"]
  Booking.find({
    // Get all the bookings on the same day and venue
    where: {
      [Op.and]: [
        {hearingDate: hearingDate},
        {venue: venue},
        {[Op.or]: [{status:'ongoing'},{status:'booked'}]}
      ]
    }
  })
  .then((bookings) => {
    console.log(bookings);
    var availableTimeslots;

    if(bookings !== null) {
      const reducer = (total,currValue) =>{ total.push(currValue.timeslot); return total; }
      var unavailableTimeslots = bookings.reduce(reducer,[])
      console.log(unavailableTimeslots)
      var availableTimeslots = allTimeslots.filter(timeslot => !(unavailableTimeslots.includes(timeslot)))
      console.log(availableTimeslots)
    } else {
      availableTimeslots = allTimeslots;
    }
    console.log(availableTimeslots)
    res.status(200).send({ availableTimeslots,allTimeslots })
  })
};

/**
 * @function acceptBooking
 * @summary: API controller to update the booking in the bookings table with
 * the given hearingId such that number of pendingParties decreases by 1 and accepting
 * party is added to the acceptedParties array. If number of pendingParties hits 0,
 * the status of the booking turns to 'booked' and notification is sent out to
 * all registered parties.
 * @param {object} req: request object
 * @param {object} res: response object
 * @returns
 */
const acceptBooking = (req, res) => {
  const hearingId = req.body.hearingId;
  const acceptorNo = req.body.acceptorNo;

  Booking.findOne({
    where: {
      hearingId: hearingId
    }
  })
  .then((booking) => {
    // Make sure that all invovled parties with their phone numbers registered
    // in the db receive the Booked notification except for the current
    // party(last acceptor)
    var notifiedParties = booking.acceptedParties.slice();
    notifiedParties.push(booking.bookerNo);
    console.log('notification parties:')
    console.log(notifiedParties)

    var updatedAcceptedParties = booking.acceptedParties;
    updatedAcceptedParties.push(acceptorNo);

    // This is the last party to accept the booking request
    if(booking.pendingParties === 1) {
      booking.updateAttributes({
        pendingParties: 0,
        status: 'booked',
        acceptedParties: updatedAcceptedParties
      })
      .then(() => {
        // Make api call to FCM to send notifications to acceptedParties
        var registrationIds = []
        var promises = []
        // Get the corresponding registrationIds to phoneNos
        notifiedParties.forEach((phoneNo) => {
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
              'notification_key_name': uuidv4(),
              'registration_ids': registrationIds
            }
          })
          .then((response) => {
              var notification_key = response.data.notification_key;
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
                      'body':'Hearing was confirmed at '+booking.timeslot+'. Press to view details of confirmed booking.',
                      'click_action':'com.example.skynet.supremecourt_TARGET_NOTIFICATION'
                    },
                    'data' : {
                      'hearingId' : hearingId
                    }
                  }
              })
              .then((response) => {
                console.log(response.data)
                res.status(200).end();
              })
              .catch((err) => {
                console.log('Sending notification message failed')
                console.log(err);
                res.send(400).end();
              })
          })
          .catch((err) => {
            console.log('Getting notification_key failed');
            console.log(err);
            res.status(400).end();
          })
      })
      .catch((err) => { console.log(err) })
    })
    } else if (booking.pendingParties > 1) {
        booking.updateAttributes({
          pendingParties: booking.pendingParties -1,
          acceptedParties: updatedAcceptedParties
        })
        .then(() => res.send(200).end());
    } else {
      throw new Error('pendingParties is already 0!');
    }
  })
  .catch((err) => console.log(err));
};

/**
 * @function rejectBooking
 * @summary: API controller to update the booking in the bookings table with
 * the given hearingId such that status of booking changes to rejected and all other
 * parties except the rejector gets a notification that the booking was rejected.
 * @param {object} req: request object
 * @param {object} res: response object
 * @returns
 */
 // TODO send notifications to all other users upon rejection
const rejectBooking = (req, res) => {
  const hearingId = req.body.hearingId;
  const rejectorNo = req.body.rejectorNo;

  Booking.findOne({
    where: {
      hearingId: hearingId
    }
  })
  .then((booking) => {
    var notifiedParties = booking.acceptedParties.slice();
    notifiedParties.push(booking.bookerNo);
    console.log('notification parties:')
    console.log(notifiedParties)
    booking.updateAttributes({
      status: 'rejected'
    })
    .then(() => {
      // Make api call to FCM to send notifications to acceptedParties
      var registrationIds = []
      var promises = []
      // Get the corresponding registrationIds to phoneNos
      notifiedParties.forEach((phoneNo) => {
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
            'notification_key_name': uuidv4(),
            'registration_ids': registrationIds
          }
        })
        .then((response) => {
            var notification_key = response.data.notification_key;
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
                    'body':'Booking was rejected by a party member at '+booking.timeslot+'. Press to book again.',
                    'click_action':'com.example.skynet.supremecourt_TARGET_NOTIFICATION'
                  },
                  'data' : {
                    'hearingId' : hearingId
                  }
                }
            })
            .then((response) => {
              console.log(response.data)
              res.status(200).end();
            })
            .catch((err) => {
              console.log('Sending notification message failed')
              console.log(err);
              res.send(400).end();
            })
        })
        .catch((err) => {
          console.log('Getting notification_key failed');
          console.log(err);
          res.status(400).end();
        })
    })
    .catch((err) => console.log(err));
  })
})
}
module.exports = {
  checkBookingStatus: checkBookingStatus,
  acceptBooking: acceptBooking,
  rejectBooking: rejectBooking,
  getAvailableTimeslots: getAvailableTimeslots
}
