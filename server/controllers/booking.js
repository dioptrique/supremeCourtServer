var db = require('../models');
var Booking = db['Booking'];
var PhoneNoToRegistrationId = db['PhoneNoToRegistrationId'];
var uuidv4 = require('uuid/v4');
var axios = require('axios');
var hearingIdToHearing = require('../data');
var Sequelize = require('sequelize')
var TimeAndDate = require('../helpers/timeAndDate')
var Data = require('../data')
var sendNotification = require('../helpers/sendNotification')
var sendSMS = require('../helpers/sendSMS')

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
 //TODO the availabil timeslots should depend on hearing time and date?
const getAvailableTimeslots = (req, res) => {
  const hearingId = req.body.hearingId;
  const hearing = Data.getHearing(hearingId);
  const hearingDate = hearing.Date.split(' ')[0];
  const givenHearingTime = hearing.Date.split(' ')[1];
  const givenHearingDateObj = TimeAndDate.makeDate(hearingDate,givenHearingTime);
  const venue = hearing.Venue;
  var allTimeslots = ["09:00","09:30","10:00",
      "10:30","11:00","11:30",
      "14:00","14:30","15:00",
      "15:30","16:00","16:30",
      "17:00","17:30"]

  const currDate = TimeAndDate.currDate()
  Booking.findAll({
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
    var availableTimeslots = []
    if(bookings !== null) {
      console.log('Number of bookings with same timeslot on same data and venue'+bookings.length);
      const reducer = (total,currValue) =>{ total.push(currValue.timeslot); return total; }
      var unavailableTimeslots = bookings.reduce(reducer,[])
      // Remove the timeslots already booked and the time slots before current time
      availableTimeslots = allTimeslots.filter(timeslot => !(unavailableTimeslots.includes(timeslot)))
                                       .filter(timeslot => (currDate.getTime() < TimeAndDate.makeDate(hearingDate,timeslot)))
    } else {
      availableTimeslots = allTimeslots;
    }
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

    // This is the last party to accept the booking request. This means that
    // The booking will be made at this slot
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
          sendNotification(hearingId,registrationIds,'Hearing '+hearingId+' was confirmed\
        at '+booking.timeslot+'.\
        Press to visit the hearing page in the application to check booking details.')
          .then(() => {
            console.log('NOTIFICATION SENT')
            console.log(notifiedParties);
            sendSMS(notifiedParties,'Hearing '+hearingId+' was confirmed\
          at '+booking.timeslot+'.\
          Visit the hearing page in the application to check booking details.')
            .then(() => res.status(200).end())
            .catch((err) => {
              console.log(err);
            })
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
    }
    // This is not the last party to accept the request
    else if (booking.pendingParties > 1) {
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
        sendNotification(hearingId,registrationIds,'Booking at '+booking.timeslot+' for hearing '+hearingId+' was rejected by '
        +rejectorNo+'. Press to book again.')
        .then(() => {
          sendSMS(notifiedParties,'Booking at '+booking.timeslot+' for hearing '+hearingId+' was rejected by '
          +rejectorNo+'. Visit your hearing\'s page on the application to book again.')
          .then(() => res.status(200).end())
          .catch((err) => {
            console.log(err);
            res.status(400).end();
          })
        })
        .catch((err) => {
          console.log(err)
          res.status(400).end()
        })

      })
      .catch((err) => {
        res.status(400).end()
        console.log(err)
      });
  })
  .catch((err) => {
    res.status(400).end()
    console.log(err)
  })
})
}
module.exports = {
  checkBookingStatus: checkBookingStatus,
  acceptBooking: acceptBooking,
  rejectBooking: rejectBooking,
  getAvailableTimeslots: getAvailableTimeslots
}
