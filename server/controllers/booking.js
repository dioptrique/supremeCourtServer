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
const checkBookingStatus = (req, res) => {
  const hearingId = req.body.hearingId;

  Booking.findOne({
    where: {
      hearingId: hearingId,
      status: 'ongoing'
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
        timeslot: booking.timeslot
      }
    }
    res.status(200).send({ response })
  })
};

module.exports = {
  checkBookingStatus: checkBookingStatus
}
