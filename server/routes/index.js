var phoneNoToRegistrationIdController = require('../controllers/phoneNoToRegistrationId')
var bookingController = require('../controllers/booking')
var dataController = require('../controllers/data')

module.exports = (app) => {
  welcome = {
    message: 'hello'
  }
  /* GET home page. */
  app.get('/', function(req, res) {
    res.status(200).send(welcome);
  });
  app.get('/getLawFirms', dataController.getLawFirms);

  app.post('/getLawFirmHearings',dataController.getLawFirmHearings);

  app.post('/getHearing', dataController.getHearing)

  app.post('/addNewRegistrationId', phoneNoToRegistrationIdController.addNewRegistrationId);

  app.post('/bookNow', phoneNoToRegistrationIdController.bookNow);

  app.post('/checkBookingStatus', bookingController.checkBookingStatus);

  app.post('/acceptBooking', bookingController.acceptBooking);

  app.post('/rejectBooking', bookingController.rejectBooking);

  app.post('/getAvailableTimeSlots', bookingController.getAvailableTimeslots);

}
