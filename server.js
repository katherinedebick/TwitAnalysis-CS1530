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



var afinnStr = fs.readFileSync('AFINN-111.txt', 'utf8');
let afinnArr = parse_String(afinnStr);
//set up Twitter API connection
var T = new Twit(config); //now pulling data from config.js and gitignored

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


app.get('/', function(req, res) {
    res.render('index.ejs');
});

app.post('/gettweets', function(req, res){
  var temp_query = new Query(req.body.search_word, req.body.sample_size, req.body.start_date, req.body.end_date);
  masterObject = {}; // object contains: list of raw twitter tweet objects (.data),
  masterObject.statusStrings = [];

                                               //list of tweet statuses as strings(.statusStrings)
                                              //object is built from return value from processQuery function
  //var scores = scoreTweets(masterObject.statusStrings);
  //Begin async Block
  //Until the tweets in tweetStatusList match the requested sample size or greater, don't render the page
  async.until(function(){
    if(masterObject.statusStrings.length >= temp_query.sample_size){
      scores = scoreTweets(masterObject.statusStrings);
      //experimenting
      getWeatherData(masterObject);

      renderPage(masterObject.statusStrings, res, scores);
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
        }
      }
      // //TO DO check if no tweets were added / matched search criteria
      // //putting check here in case criteria is matched but all tweets are non-english
      // if (i == raw_tweets.length-1 && masterObject.statusStrings.length == 0) {
      //
      // }
      cb();
    });
  }); //end of processQueryHelper, end of .until function argument list


}); //end of app.post

/**helpers**/

function getWeatherData(masterObject) {

}

function processQuery(temp_query){
  var _masterObject = {};
  var tweetStatusList = [];
  var params = {
    q: temp_query.search_word,
    count: temp_query.sample_size
  }
  T.get('search/tweets', params, function(err, data, response){
    // console.log('data: ' + data.statuses[0].created_at);
    //console.log('data: ' + JSON.stringify(data));
    _masterObject.data = data; //saves the raw tweet object list from twitter for use in caller
    var raw_tweets = data.statuses;
    for (var i=0; i<raw_tweets.length; i++){
      tweetStatusList.push(String(raw_tweets[i].text));
    }
    _masterObject.statusStrings = tweetStatusList; //saves the string list version of tweet status for use in caller
  });
  return _masterObject;
}


function getTweetsHelper(req, res) {
  var temp_query = new Query(req.body.search_word, req.body.sample_size, req.body.start_date, req.body.end_date);
  var tweetStatusList = []; //strings

  //Begin async Block
  //Until the tweets in tweetStatusList match the requested sample size or greater, don't render the page
  async.until(function(){
    if(tweetStatusList.length >= temp_query.sample_size){
      scores = scoreTweets(tweetStatusList);
      renderPage(tweetStatusList, res, scores);
      //res.render(path.join(__dirname+'/views/tweets.ejs'), {tweets: tweets2});
    }
    return tweetStatusList.length >= temp_query.sample_size;
  }, function process_query(cb){
    var params = {
      q: temp_query.search_word,
      count: temp_query.sample_size
    }
    T.get('search/tweets', params, function(err, data, response){
      // console.log('data: ' + data.statuses[0].created_at);
      //console.log('data: ' + JSON.stringify(data));
      var raw_tweets = data.statuses;
      for (var i=0; i<raw_tweets.length; i++){
        tweetStatusList.push(String(raw_tweets[i].text));
      }
      cb();
    });
  })
}

function scoreTweets(tweets){
  let scores = [];
  for (var t in tweets) {
    var score = getScore(tweets[t]);
    scores.push(score);
    console.log("Tweet: " + tweets[t] + " Score: " + score);
  }
  return scores;
}

function getScore(tweet){
  var tempScore = 0;
  let tweetSplit = tweet.split(" ");
  for (var n in tweetSplit){
    //console.log(tweetSplit[n]);
    for (var w in afinnArr){
      if (tweetSplit[n] == afinnArr[w].word){
        tempScore += parseInt(afinnArr[w].score);
        //console.log(afinnArr[w].word + " -> score: " + afinnArr[w].score);
      }
    }
  }
  return tempScore;
}

//reads in afinn111 string which is tab/newline delimited, saves as JS object/dictionary
function parse_String(data){
  let splitData = data.split("\n");
  var dict = [];
  for (var n in splitData){
    var temp = splitData[n].split("\t");
    dict.push({
      word: temp[0],
      score: temp[1]
    });
  }
  return dict;
}

function renderPage(tweets, res, scores){
  //console.log('TWEETS FROM RENDER FN: ' + tweets);
  res.render(path.join(__dirname+'/views/tweets.ejs'), {tweets: tweets, scores: scores});
}


app.listen(5000, function(){
  console.log('server started on Port 5000...'); `  `
})
