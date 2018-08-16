var axios = require('axios')
var uuidv4 = require('uuid/v4')
var db = require('../models')
var PhoneNoToRegistrationId = db["PhoneNoToRegistrationId"];
var Booking = db['Booking'];
var hearingIdToHearing = require('../data');
var Sequelize = require('sequelize')
var sendNotification = require('../helpers/sendNotification')
var TimeAndDate = require('../helpers/timeAndDate')
var Data = require('../data')

const Op = Sequelize.Op;

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
// TODO set timer to set booking to expired after X mins
// TODO stop addition of duplicate timeslot date and venue
const bookNow = (req, res, next) => {
  const phoneNos = req.body.phoneNos;
  const bookerNo = req.body.bookerNo;
  const timeslot = req.body.timeslot;
  const hearingId = req.body.hearingId;
  const hearingObj = Data.getHearing(hearingId);
  const hearingDate = hearingObj.Date.split(' ')[0];
  const venue = hearingObj.Venue;
  const partyCount = hearingObj.Parties.length;
  var alreadyBooked = false;
  const currTime = TimeAndDate.currDate();
  if(currTime.getTime() > TimeAndDate.makeDate(hearingDate,timeslot)) {
    res.status(200).send({
      bookingStatus:'unsuccessful',
      reason:'outdated'
    })
    return;
  }
  //Check if timeslot is already taken on the same day and venue
  Booking.find({
    where: {
      [Op.and]: [
        {hearingDate: hearingDate},
        {timeslot: timeslot},
        {venue: venue},
        {[Op.or]: [{status:'ongoing'},{status:'booked'}]}
      ]
    }
  })
  .then((booking) => {
    // If timeslot on that day and venue is taken
    if(booking !== null) {
      alreadyBooked = true;
      console.log('Time slot is already being booked or is already booked');
      res.status(200).send({
        bookingStatus:'unsuccessful',
        reason:'taken'
      })
    } else {
      //If there is only a single party in the hearing
      if(partyCount === 1) {
        console.log('PARTY COUNT IS 1');
        Booking.create({
          bookingId: uuidv4(),
          hearingId: hearingId,
          hearingDate: hearingDate,
          venue: venue,
          bookerNo: bookerNo,
          timeslot: timeslot,
          status: 'booked',
          pendingParties: 0
        })
        .then(() => {
          res.status(200).send({
            bookingStatus:'successful'
          })
        })
        .catch((err) => {
          console.log('Single party booking failed');
          res.status(400).end();
        })
      } else {
        // If there are other parties that need to accept the booking
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
            // Create a new booking for hearingId if hearingId does not exist.
            // If hearingId exists then replace the remaining fields with the
            // new booking information. A newly ongoing booking will have a
            // new and unique bookingId
            var bookingId = uuidv4();
            Booking.findOrCreate({
              where: {hearingId: hearingId},
              // Create new booking row with the following fields
              defaults: {
                bookingId,
                hearingId,
                timeslot,
                bookerNo,
                pendingParties: partyCount - 1,
                status: 'ongoing',
                hearingDate: hearingDate,
                venue: venue
              }
            })
            .spread((booking, created) => {
              if(!created) {
                // Do not allow user to book if there is already a booked or ongoing
                // hearing of the same Id
                if(booking.status === 'ongoing' || booking.status === 'booked') {
                  throw new Error('hearing is already being booked or already booked!')
                } else {
                  // If hearingId already exits and it is 'rejected' or 'expired'
                  booking.updateAttributes({
                    bookingId,
                    timeslot,
                    bookerNo,
                    pendingParties: partyCount - 1,
                    status: 'ongoing',
                    updatedAt: new Date()
                  })
                  .then(() => {
                    console.log('Setting timer for booking expiry')
                      setTimeout(() => {
                        Booking
                        .find({ where: {hearingId: hearingId} })
                        .then((booking) => {
                          // If the same booking is still ongoing since X mins ago, it becomes expired
                          if(booking.bookingId === bookingId && booking.status === 'ongoing') {
                            booking.updateAttributes({
                              status: 'expired'
                            })
                            .then(() => {
                              PhoneNoToRegistrationId
                              .find({where:{phoneNo: bookerNo}})
                              .then((booker) => {
                                console.log('registrationIdsssss')
                                console.log(registrationIds)
                                var allParties = registrationIds.slice()
                                allParties.push(booker.registrationId);
                                console.log('allParties')
                                console.log(allParties);
                                sendNotification(hearingId,allParties,
                                                  'Ongoing booking has expired while waiting for all parties to accept. Press to book again.')
                                                  .catch((err) => {
                                                    console.log('Unable to send notification about expiry')
                                                    res.status(400).end();
                                                  })
                              })
                              .catch((err) => {
                                console.log(err)
                                res.status(400).end();
                              })
                            })
                            console.log('Timeslot booking expired!')
                          }
                        })
                        .catch((err) => {
                          console.log(err);
                          res.status(400).end();
                        })
                      },60000)
                  })
                }
              } else { // If a new entry was created
                console.log('Setting timer for booking expiry')
                setTimeout(() => {
                  Booking
                  .find({ where: {hearingId: hearingId} })
                  .then((booking) => {
                    // If the same booking is still ongoing since X mins ago, it becomes expired
                    if(booking.bookingId === bookingId && booking.status === 'ongoing') {
                      booking.updateAttributes({
                        status: 'expired'
                      })
                      .then(() => {
                        PhoneNoToRegistrationId
                        .find({where:{phoneNo: bookerNo}})
                        .then((booker) => {
                          console.log('registrationIdsssss')
                          console.log(registrationIds)
                          var allParties = registrationIds.slice()
                          allParties.push(booker.registrationId);
                          console.log('allParties')
                          console.log(allParties);
                          sendNotification(hearingId,allParties,
                                            'Ongoing booking has expired while waiting for all parties to accept. Press to book again.')
                                            .catch((err) => {
                                              console.log('Unable to send notification about expiry')
                                              res.status(400).end();
                                            })
                        })
                        .catch((err) => {
                          console.log(err)
                          res.status(400).end();
                        })
                      })
                      console.log('Timeslot booking expired!')
                    }
                  })
                  .catch((err) => {
                    console.log(err);
                    res.status(400).end();
                  })
                },60000)
              }
            })
            .then(() => {
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
                      'body':'Time slot '+timeslot+' was selected. Press to confirm.',
                      'click_action':'com.example.skynet.supremecourt_TARGET_NOTIFICATION'
                    },
                    'data' : {
                      'hearingId' : hearingId
                    }
                  }
                })
                .then((response) => {
                  console.log(response.data)
                  res.status(200).send({
                    bookingStatus:'successful'
                  });
                })
                .catch((err) => {
                  console.log(err);
                  res.status(400).end();
                })
              })
              .catch((err) => {
                console.log(err);
                res.status(400).end();
              })
            })
            .catch((err) => {
              console.log(err);
              res.status(400).end();
            })
          })
          .catch((err) => {
            console.log(err);
            res.status(400).end();
          })
      }
    }
  })
  .catch((err) => {
    console.log(err)
  })
}
module.exports = {
  addNewRegistrationId : addNewRegistrationId,
  bookNow: bookNow
}
