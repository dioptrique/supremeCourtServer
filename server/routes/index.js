var phoneNoToRegistrationIdController = require('../controllers/phoneNoToRegistrationId')
var bookingController = require('../controllers/booking')

module.exports = (app) => {
  welcome = {
    message: 'hello'
  }
  /* GET home page. */
  app.get('/', function(req, res) {
    res.status(200).send(welcome);
  });

  app.post('/addNewRegistrationId', phoneNoToRegistrationIdController.addNewRegistrationId);

  app.post('/bookNow', phoneNoToRegistrationIdController.bookNow);

  app.post('/checkBookingStatus', bookingController.checkBookingStatus);

  app.post('/acceptBooking', bookingController.acceptBooking);

  app.post('/rejectBooking', bookingController.rejectBooking);
}
