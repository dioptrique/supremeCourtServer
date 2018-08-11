var rawData = require('./data1')

var array = []
rawData.forEach((hearingJson) => {
  array.push([hearingJson.HearingID, hearingJson]);
})

var hearingIdToHearing = new Map(array)

module.exports = hearingIdToHearing
