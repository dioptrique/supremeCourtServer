var axios = require('axios')
var constants = require('constants')

/**
 * @function sendSMS
 * @summary: Send SMS to the device group using sms gateway
 * @param {String[]} phoneNos: the phoneNos to the send the sms to
 * @param {message} registrationIds: the message to be sent
 * @returns Promise
 */

module.exports = sendSMS = (hearingId, phoneNos, message) => {
  var phoneNosInUrl = ''
  // Check if phoneNos is an array and convert it to segment of the sms gateway
  // api call
  if(!(phoneNos instanceof Array)) {
    phoneNosInUrl = phoneNosInUrl.concat('65'+phoneNos)
  } else {
    phoneNos.forEach((phoneNo) => {
      phoneNosInUrl = phoneNosInUrl.concat('65'+phoneNo+';');
    })
    phoneNosInUrl = phoneNosInUrl.slice(0,-1)
  }
  //Manually create a firebase dynamic link to our application
  var firebaseLink = 'https://supremecourtbook.page.link/?link=https://supremecourtbook.com/'+hearingId+'&apn=com.example.skynet.supremecourt'

  var augmentedMessage = message + ' Click here: '+firebaseLink;
  
  const url = 'https://www.isms.com.my/isms_send.php?un='+ISMS_USER+'&pwd='+ISMS_PWD+'&dstno='+phoneNosInUrl+'&msg='+augmentedMessage+'&type=1&sendid=12345678'
  return axios({
    method: 'get',
    url: url
  })
  .then(() => {console.log('Smses sent!')})
  .catch((err) => {
    throw err;
  })
}
