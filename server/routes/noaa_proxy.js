let express = require('express');
let router = express.Router();
let proxy = require('express-http-proxy');

router.use('/', proxy('https://www.nohrsc.noaa.gov', {

    filter: function (req, res) {
        return req.method == 'GET';
    }
}))
// https://www.nohrsc.noaa.gov/snow_model/GE/latest_nohrsc_nsm_link.kmz
// http://www.nohrsc.noaa.gov/snow_model/GE/latest_nohrsc_nsm.kmz
// http://www.nohrsc.noaa.gov//snow_model/GE/20200221/nsm_swe/nsm_swe_2020022105_R001C002_us.png
module.exports = router;