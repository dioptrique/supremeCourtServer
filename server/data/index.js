var rawData = require('./data1')
var Constants = require('../constants')
var TimeAndDate = require('../helpers/timeAndDate')
var d3 = require('d3-collection')

var array = []
rawData.forEach((hearing) => {

  array.push([hearing.HearingID, hearing]);
})

const hearingIdToHearing = new Map(array)

console.log(TimeAndDate.currDate())

const getHearing = (hearingId) => {
  var oldHearing = hearingIdToHearing.get(hearingId);
  // Create a new hearing object that only stores the essentials
  var parties = []
  oldHearing.PartiesList.Party.forEach((party) => {
    parties.push({
      PartyType: party.PartyType,
      PartyName: party.PartyName
    })
  })
  var hearing = {
    HearingID: oldHearing.HearingID,
    CaseNo: oldHearing.CaseNo,
    CaseName: oldHearing.CaseName,
    Date: oldHearing.Date,
    Venue: oldHearing.Venue,
    Parties: parties
  }
  // Update the Date attribute of the new hearing such that
  // 2018-07-18 is today
  var hearingJustDate = hearing.Date.split(" ")[0]
  var hearingJustTime = hearing.Date.split(" ")[1]
  var currJustDate = TimeAndDate.currDate().toISOString().split('T')[0];
  var time_passed = new Date(currJustDate).getTime() - new Date('2018-07-18').getTime();
  var newHearingJustDate = new Date(new Date(hearingJustDate).getTime() + time_passed).toISOString().split("T")[0];
  hearing.Date = newHearingJustDate+' '+hearingJustTime;

  return hearing;
}

const lawFirmToHearingId = new Map();

rawData.forEach((hearing) => {
  var parties = hearing["PartiesList"]["Party"];
  parties.forEach((party) => {
    if(party["Solicitors"] === undefined) { return; }
    var solicitors = party["Solicitors"]["Solicitor"];
    solicitors.forEach((solicitor) => {
      var lawFirm = solicitor.LFName;
      if(lawFirmToHearingId.has(lawFirm)) {
        lawFirmToHearingId.get(lawFirm).add(hearing["HearingID"])
      } else {
        lawFirmToHearingId.set(lawFirm,new Set([hearing["HearingID"]]))
      }
    })
  })
})

const lawFirms = Array.from(lawFirmToHearingId.keys());

/**
 * @function getHearingsInWindow
 * @summary: Get the hearings in the time window set as Constant for a
 * particular lawfirm.
 * @param {string} lawFirm the name of the law firm to get the hearings for
 * @returns JSON object of hearings
 */
const getHearingsInWindow = (lawFirm) => {
  var windowEnd = new Date(new Date((TimeAndDate.currDate().getTime() + Constants.WINDOW)).toDateString());
  console.log(windowEnd);
  var hearingIds = Array.from(lawFirmToHearingId.get(lawFirm))
  hearings = []
  hearingIds.forEach((hearingId) => {
    hearings.push(getHearing(hearingId))
  })
  console.log(hearings)
  var hearingsInWindow = hearings.filter((hearing) =>
    new Date(new Date(hearing.Date).toDateString()).getTime() < windowEnd.getTime() &&
    new Date(new Date(hearing.Date).toDateString()).getTime() >= new Date(TimeAndDate.currDate().toDateString()).getTime());
  // Group hearings by date
  return d3.nest().key(d => d.Date.split(" ")[0])
                  .sortKeys((a,b) => Date.parse(a) - Date.parse(b))
                  .entries(hearingsInWindow);
}

module.exports = {
    getHearing: getHearing,
    lawFirms: lawFirms,
    getHearingsInWindow: getHearingsInWindow
}
