//comment
var express = require('express');
var helper = require('./helper');
var app = express();
app.set('view engine', 'ejs');
var async = require('async');

var path = require('path');

var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();

var Twit = require('twit');
var config = require('./config'); //use this instead of putting keys in the server file



var T = new Twit(config); //now pulling data from config.js and gitignored

const Query = require('./query.js');

//notify user server is up
console.log('Server is running...');


// for parsing application/json
app.use(bodyParser.json());
// for parsing application/xwww-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// for parsing multipart/form-data
app.use(upload.array());
app.use(express.static('public'));


app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/pages/index.html'));
});

app.post('/gettweets', function(req, res){
  var temp_query = new Query(req.body.search_word, req.body.sample_size, req.body.start_date, req.body.end_date);
  tweets2 = [];

  //Begin async Block
  //Until the tweets in tweets2 match the requested sample size or greater, don't render the page
  async.until(function(){
    if(tweets2.length >= temp_query.sample_size){
      scores = helper.scoreTweets(tweets2);
      helper.renderPage(tweets2, res, scores);
      //res.render(path.join(__dirname+'/views/tweets.ejs'), {tweets: tweets2});
    }
    return tweets2.length >= temp_query.sample_size;
  }, function process_query(cb){
    var params = {
      q: temp_query.search_word,
      count: temp_query.sample_size
    }
    T.get('search/tweets', params, function(err, data, response){
      var raw_tweets = data.statuses;
      for (var i=0; i<raw_tweets.length; i++){
        tweets2.push(String(raw_tweets[i].text));
      }
      cb();
    });
  })
});

app.listen(process.env.PORT || 5000);
