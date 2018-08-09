var db = require('../models');
var Booking = db['Booking'];

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
 * @function acceptBooking
 * @summary: API controller to update the booking in the bookings table with
 * the given hearingId such that number of pendingParties decreases by 1 and accepting
 * party is added to the acceptedParties array. If number of pendingParties hits 0,
 * the status of the booking turns to 'booked'.
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
    var updatedAcceptedParties = booking.acceptedParties;
    updatedAcceptedParties.push(acceptorNo)
    if(booking.pendingParties === 1) {
      booking.updateAttributes({
        pendingParties: 0,
        status: 'booked',
        acceptedParties: updatedAcceptedParties
      })
    } else if (booking.pendingParties > 1) {
        booking.updateAttributes({
          pendingParties: booking.pendingParties -1,
          acceptedParties: updatedAcceptedParties
        })
    } else {
      throw new Error('pendingParties is already 0!');
    }
    res.send(200).end();
  })
  .catch((err) => console.log(err));
};

module.exports = {
  checkBookingStatus: checkBookingStatus,
  acceptBooking: acceptBooking
}
