var Data = require('../data')

/**
 * @function getLawFirms
 * @summary: API controller to get all unique LawFirms
 * @param {object} req: request object
 * @param {object} res: response object
 * @returns
 */
const getLawFirms = (req, res) => {
  lawFirms = Data.lawFirms;
  res.status(200).send({ lawFirms });
};


/**
 * @function getLawFirmHearings
 * @summary: API controller to get all hearings of a lawFirms within the window.
 * The hearings are grouped by their dates
 * @param {object} req: request object
 * @param {object} res: response object
 * @returns
 */
const getLawFirmHearings = (req, res) => {
  const lawFirm = req.body.lawFirm;
  const hearingsInWindow = Data.getHearingsInWindow(lawFirm)
  res.status(200).send({hearingsInWindow})
};

module.exports = {
  getLawFirms: getLawFirms,
  getLawFirmHearings: getLawFirmHearings
}

/**
 * @function getHearing
 * @summary: Returns a hearing object given the hearingId
 * @param {object} req: request object
 * @param {object} res: response object
 * @returns
 */
const getHearing = (req, res) => {
  var hearingId = req.body.hearingId;
  const hearing = Data.getHearing(hearingId);
  res.status(200).send({ hearing });
};

module.exports = {
  getLawFirms: getLawFirms,
  getLawFirmHearings: getLawFirmHearings,
  getHearing: getHearing
}
