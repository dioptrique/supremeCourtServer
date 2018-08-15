/**
 * @function currDate
 * @summary: gets the current date with SG time UTC+8
 * @returns Promise
 */
const currDate = () => new Date(new Date().setHours((new Date().getHours() + 8)));

/**
 * @function makeDate
 * @summary: makes a date given the time and date
 * @returns Date
 */
const makeDate = (date,time) => {
  return new Date(date+'T'+time)
}

module.exports = {
  currDate: currDate,
  makeDate: makeDate
}
