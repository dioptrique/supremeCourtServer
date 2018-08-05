var phoneNoToRegistrationIdController = require('../controllers/phoneNoToRegistrationId')

module.exports = (app) => {
  welcome = {
    message: 'hello'
  }
  /* GET home page. */
  app.get('/', function(req, res) {
    res.status(200).send(welcome);
  });

  app.post('/addNewRegistrationId', phoneNoToRegistrationIdController.addNewRegistrationId);
}
