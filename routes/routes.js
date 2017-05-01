var express = require('express');
var router = express.Router();

router.get('/agent', function(req, res, next) {
  res.render('agent');
});

router.get('/customer', function(req, res, next) {
  res.render('customer');
});

module.exports = router;
