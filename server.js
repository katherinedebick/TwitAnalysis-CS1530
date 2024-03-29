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
var Sentiment = require('sentiment');
var sentiment = new Sentiment();

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
          //masterObject.statusStrings.push(String(raw_tweets[i].text));
          //experimenting
          // console.log('master: ' + masterObject.data.statuses.length);
          // console.log('raw :' + raw_tweets.length);
          if (raw_tweets[i].place!= null) {
            console.log("There is a location");
            weatherCounter += helperFunctions.getWeatherData(raw_tweets[i]); //TODO: Issues with this function see notes below
                                                              // Also, I think this is getting called a bunch of times
                                                              //on similar data and giving weatherCounter a
                                                              //much higher value than the actual number of
                                                              //tweets with location data...
            masterObject.statusStrings.push(String(raw_tweets[i].text));
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

      var oneWordSentiment = getOneWordSentiment(scoreAverage);

      graph_results(scores, masterObject.sequenceNums, numPosTweets, numNegTweets, numNeutralTweets);
      extreme_tweets = getMostEmotionalTweets(masterObject.statusStrings, scores)
      extreme_words = get_emotional_words(masterObject.statusStrings, afinnArr);

      if(extreme_words > 20){
        extreme_words = extreme_words.slice(0, 100);
      }

      res.render(path.join(__dirname + '/views/results.ejs'), {tweets: masterObject.statusStrings, scores: scores, avg: scoreAverage, numNegTweets: numNegTweets, numPosTweets: numPosTweets, numNeutralTweets: numNeutralTweets, oneWordSentiment: oneWordSentiment, searchPhrase: temp_query.search_word, extreme_tweets: extreme_tweets, extreme_words: extreme_words});
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

function getOneWordSentiment(score) {
  if (score <= -3) {
    return "SUPER NEGATIVE";
  }
  else if (score <= -1) {
    return "REALLY NEGATIVE";
  }
  else if (score < 0) {
    return "NEGATIVE";
  }
  else if (score <= 1) {
    return "POSTIVE";
  }
  else if (score <= 3) {
    return "HAPPY";
  }
  else if (score <=5) {
    return "SUPER HAPPY a.k.a. #winning";
  }
  else {
    return "CALCULATION ERROR";
  }
}

function getMostEmotionalTweets(tweets, scores){
  var results = []; //0 = most positive 1 = most negative 2 = most neutral
  var highest = scores[0];
  var lowest = scores[0];
  var neutral = scores[0];
  for(var i=0; i<scores.length; i++){
    //console.log("sannnity");
    if(scores[i]>highest){
      highest = scores[i];
      results[0] = tweets[i];
    }
    if(scores[i]<lowest){
      lowest = scores[i];
      results[1] = tweets[i];
    }
    if(scores[i]==0){
      neutral = scores[i];
      results[2] = tweets[i];
    }
  }

  return results;
}

function scoreTweets(tweets, afinnArr){
  let scores = [];
  for (var t in tweets) {
    var result = sentiment.analyze(tweets[t]);
    //console.log(result.words);
    //console.log(result.score);
    //var score = helperFunctions.getScore(tweets[t], afinnArr);
    scores.push(result.score);
    //console.log("Tweet: " + tweets[t] + " Score: " + score);
  }
  return scores;
}

function get_emotional_words(tweets, afinnArr){
  var words = [];
  for (var t in tweets){
    var result = sentiment.analyze(tweets[t]);
    var result = result.words
    for(var r in result){
      //&& afinnArr.includes(result[r])
      //console.log(result[r])
      if(!words.includes(result[r])){
        //console.log("This word isn't in words:");
        //console.log(result[r])
        words.push(result[r]);
      }
    }
  }
  return words;
}

function graph_results(scores, sequence, numPosTweets, numNegTweets, numNeutralTweets){
  //Create Graph and Send it to Plotly
  var general_plot = {
    x: sequence,
    y: scores,
    type: "scatter"
  };
  var data = [general_plot];
  var graphOptions = {filename: "tweetplot", fileopt: "overwrite"};
  plotly.plot(data, graphOptions, function(err, msg){
    console.log(msg);
  });

  var pie_chart = [{
    values: [numPosTweets, numNegTweets, numNeutralTweets],
    labels:['Positive Tweets', 'Negative Tweets', 'Neutral Tweets'],
    type: 'pie'
  }];
  var pie_data = [pie_chart];

  var graphOptions2 = {filename: 'tweet_pie', fileopt: 'overwrite'};
  plotly.plot(pie_data, graphOptions2, function(err, msg){
    console.log(msg);
  });
}

function renderPage(tweets, res, scores, pageName){
  //console.log('TWEETS FROM RENDER FN: ' + tweets);
  res.render(path.join(__dirname + pageName), {tweets: tweets, scores: scores});
}


app.listen((process.env.PORT || 5000), function(){
  console.log('server started on Port 5000...'); `  `
})
