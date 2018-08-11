var rawData = require('./data1')

var array = []
rawData.forEach((hearingJson) => {
  array.push([hearingJson.HearingID, hearingJson]);
})

var hearingIdToHearing = new Map(array)
console.log('Test map: '+hearingIdToHearing.get('296267').Date)

module.exports = hearingIdToHearing
