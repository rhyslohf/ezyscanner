const request = require('request')
const cheerio = require('cheerio')

var find = function(plateData) {


  return new Promise(function(resolve, reject) {
    var plate = plateData ? plateData["number"] : null;
    if (!plate) reject(null);

    let cookieJar = request.jar()

    // login GET
    let loginGetUrl = "https://www.ecom.transport.sa.gov.au/et/checkRegistrationExpiryDate.do"
    request.get({url:loginGetUrl, jar:cookieJar}, function() {

      // query POST
      let platePostUrl = "https://www.ecom.transport.sa.gov.au/et/cred_registration_details.do"
      request.post({url:platePostUrl, jar:cookieJar, form:{"plateNumber": plate.toUpperCase()}}, function(error, response, html) {
        var $ = cheerio.load(html, { ignoreWhitespace: false })

        var plateObject = {}
        $('td.fieldTitle').each(function(i, element) {
          var keyStr = $(element).text().trim().replace(/[^\x20-\x7E]/gmi, " ")
          keyStr = keyStr.split(' ').join('_').toLowerCase()
          var valStr = $(this).next().text().trim()
          plateObject[keyStr] = valStr
        })

        // {plate_type, plate_number, make, body_type, primary_colour, vin, ctp_insurer, expiry_date}
        resolve(plateObject)
      })
    });
  })
}

module.exports = find;