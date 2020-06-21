var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET About page. */
router.get('/about', function(req, res){
  res.render('about', {
    title: 'About'
  });
});

/* GET Contact page. */
router.get('/contact', function(req, res){
  res.render('contact', {
    title: 'Contact'
  });
});

/* GET Contact page. */
router.get('/crawling', function(req, res){
  res.render('crawling', {
    title: 'Crawling'
  });
});

module.exports = router;
