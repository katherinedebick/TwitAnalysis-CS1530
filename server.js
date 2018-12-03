//comment
var express = require('express');
var app = express();
var async = require('async');;
var path = require('path');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
var Twit = require('twit');
var config = require('./config'); //use this instead of putting keys in the server file
let fs = require('fs');
const OpenWeatherMapHelper = require('openweathermap-node');
const helper = new OpenWeatherMapHelper(config.weather);
var plotly = require('plotly')('socialpulse', 'jRIANyfu82lUMBjYyidw');
const helperFunctions = require('./helpers');

var afinnStr = fs.readFileSync('AFINN-111.txt', 'utf8');
let afinnArr = helperFunctions.parse_String(afinnStr);
//set up Twitter API connection
var T = new Twit(config.twitter); //now pulling data from config.js and gitignored

const Query = require('./query.js');


//configure EJS templating
app.set('view engine', 'ejs');
//tell app what dir we want for views
app.set('views', path.join(__dirname, 'views'));

// for parsing application/json
app.use(bodyParser.json());
// for parsing application/xwww-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// for parsing multipart/form-data
app.use(upload.array());

// Set static path
app.use(express.static(path.join(__dirname, 'public')));

//route for homepage
app.get('/', function(req, res) {
    res.render('index.ejs');
});

//route for query page
app.get('/query', function(req, res) {
    res.render('query.ejs');
});




app.post('/gettweets', function(req, res){
  var temp_query = new Query(req.body.search_word, req.body.sample_size, req.body.start_date, req.body.end_date);
  masterObject = {}; // object will contain: list of raw twitter tweet objects (.data),
                    //list of tweet statuses as strings(.statusStrings)
  masterObject.statusStrings = [];
  var weatherCounter = 0;


  //Begin async Block
  //Until the tweets in tweetStatusList match the requested sample size or greater, don't render the page
  async.until(function(){
    if(masterObject.statusStrings.length >= temp_query.sample_size){
      scores = scoreTweets(masterObject.statusStrings);
      renderPage(masterObject.statusStrings, res, scores, '/views/tweets.ejs');
      console.log('locations grabbed: ' + weatherCounter);
    }
    return masterObject.statusStrings.length >= temp_query.sample_size;
  }, function processQueryHelper(cb){
    var _masterObject = {};
    var tweetStatusList = [];
    var params = {
      q: temp_query.search_word,
      count: temp_query.sample_size
    }
    T.get('search/tweets', params, function(err, data, response){
      var raw_tweets = data.statuses;
      masterObject.data = data;
      //console.log('data: ' + JSON.stringify(data));
      for (var i=0; i<raw_tweets.length; i++){
        //check if tweet is written in English
        if (String(raw_tweets[i].lang) == 'en') {
          masterObject.statusStrings.push(String(raw_tweets[i].text));
          //experimenting
          // console.log('master: ' + masterObject.data.statuses.length);
          // console.log('raw :' + raw_tweets.length);
          if (raw_tweets[i].place!= null) {
            weatherCounter += helperFunctions.getWeatherData(raw_tweets[i]); //TODO: Issues with this function see notes below
                                                              // Also, I think this is getting called a bunch of times
                                                              //on similar data and giving weatherCounter a
                                                              //much higher value than the actual number of
                                                              //tweets with location data...
          }


        }
      }

      cb();
    });

  }); //end of processQueryHelper, end of .until function argument list


}); //end of app.post

app.post('/showResults', function(req, res){
  var temp_query = new Query(req.body.search_word, req.body.sample_size, req.body.start_date, req.body.end_date);
  masterObject = {}; // object will contain: list of raw twitter tweet objects (.data),
                    //list of tweet statuses as strings(.statusStrings)
  masterObject.statusStrings = [];
  masterObject.sequenceNums = []; //For plotly feasibility
  var weatherCounter = 0;
  //Begin async Block
  //Until the tweets in tweetStatusList match the requested sample size or greater, don't render the page
  async.until(function(){
    if(masterObject.statusStrings.length >= temp_query.sample_size){
      //once if statement is satisifed (tweets are grabbed)
      //get afinn111 scores
      scores = scoreTweets(masterObject.statusStrings, afinnArr);
      //more NLP to improve scores

      //calculate score average
      var scoreAverage = (scores.reduce((a, b) => a + b, 0)) / scores.length;
      var numNegTweets = scores.reduce(function(acc, x) {
        return x < 0 ? acc + 1 : acc;
      }, 0);
      var numPosTweets = scores.reduce(function(acc, x) {
        return x > 0 ? acc + 1 : acc;
      }, 0);
      var numNeutralTweets = scores.reduce(function(acc, x) {
        return x == 0 ? acc + 1 : acc;
      }, 0);

      //Create Graph and Send it to Plotly
      var general_plot = {
        x: masterObject.sequenceNums,
        y: scores,
        type: "scatter"
      };
      var data = [general_plot];
      var graphOptions = {filename: "tweetplot", fileopt: "overwrite"};
      plotly.plot(data, graphOptions, function(err, msg){
        console.log(msg);
        res.render(path.join(__dirname + '/views/results.ejs'), {tweets: masterObject.statusStrings, scores: scores, avg: scoreAverage, numNegTweets: numNegTweets, numPosTweets: numPosTweets, numNeutralTweets: numNeutralTweets});
      });
      // render results page
      //res.render(path.join(__dirname + '/views/results.ejs'), {tweets: masterObject.statusStrings, scores: scores, avg: scoreAverage, numNegTweets: numNegTweets, numPosTweets: numPosTweets, numNeutralTweets: numNeutralTweets});
      console.log('locations grabbed: ' + weatherCounter);
    }
    return masterObject.statusStrings.length >= temp_query.sample_size;
  }, function processQueryHelper(cb){
    var _masterObject = {};
    var tweetStatusList = [];
    var params = {
      q: temp_query.search_word,
      count: temp_query.sample_size
    }
    T.get('search/tweets', params, function(err, data, response){
      var raw_tweets = []
      raw_tweets = data.statuses;
      masterObject.data = data;
      //console.log('data: ' + JSON.stringify(data));
      for (var i=0; i<raw_tweets.length; i++){
        //check if tweet is written in English
        if (String(raw_tweets[i].lang) == 'en') {
          masterObject.statusStrings.push(String(raw_tweets[i].text));
          if (masterObject.sequenceNums.length < 1){
            masterObject.sequenceNums.push(0);
          }else{
            masterObject.sequenceNums.push(masterObject.sequenceNums[masterObject.sequenceNums.length-1]+1);
          }
          //experimenting
          // console.log('master: ' + masterObject.data.statuses.length);
          // console.log('raw :' + raw_tweets.length);
          if (raw_tweets[i].place!= null) {
            weatherCounter += helperFunctions.getWeatherData(raw_tweets[i]); //TODO: Issues with this function see notes below
                                                              // Also, I think this is getting called a bunch of times
                                                              //on similar data and giving weatherCounter a
                                                              //much higher value than the actual number of
                                                              //tweets with location data...
          }


        }
      }

      cb();
    });

  }); //end of processQueryHelper, end of .until function argument list


}); //end of app.post


function scoreTweets(tweets, afinnArr){
  let scores = [];
  for (var t in tweets) {
    var score = helperFunctions.getScore(tweets[t], afinnArr);
    scores.push(score);
    //console.log("Tweet: " + tweets[t] + " Score: " + score);
  }
  return scores;
}


function renderPage(tweets, res, scores, pageName){
  //console.log('TWEETS FROM RENDER FN: ' + tweets);
  res.render(path.join(__dirname + pageName), {tweets: tweets, scores: scores});
}


app.listen(5000, function(){
  console.log('server started on Port 5000...'); `  `
})
