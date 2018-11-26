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
const helper = new OpenWeatherMapHelper({
  APPID: 'd8dfe68ffd082d3b189b28e87fe76264',
  units: "imperial"
});


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
  masterObject = {}; // object will contain: list of raw twitter tweet objects (.data),
                    //list of tweet statuses as strings(.statusStrings)
  masterObject.statusStrings = [];
  var weatherCounter = 0;
  //Begin async Block
  //Until the tweets in tweetStatusList match the requested sample size or greater, don't render the page
  async.until(function(){
    if(masterObject.statusStrings.length >= temp_query.sample_size){
      scores = scoreTweets(masterObject.statusStrings);
      renderPage(masterObject.statusStrings, res, scores);
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
            weatherCounter += getWeatherData(raw_tweets[i]); //TODO: Issues with this function see notes below
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

/**helpers**/

/*
TODO: Right now, place.name is not always returning a city, sometimes its a state...in those cases
openweathermap is returning a "cant find city error". We're getting closer!
I've commented out the weather grabbing for now to see what place information is being used in a readible format.
Also not that due to the async.until function I beleive we're getting duplicate city data since its calling
getWeatherData multiple times. We need to figure out how to fix this. 
*/
function getWeatherData(singleStatus) {
  console.log(String(singleStatus.place.name));
  // helper.getCurrentWeatherByCityName(String(singleStatus.place.name), (err, currentWeather) => {
  //     if(err){
  //         console.log(err);
  //     }
  //     else{
  //
  //         console.log('test temperature: ' + currentWeather.main.temp);
  //         console.log('test description: ' + currentWeather.weather[0].main);
  //
  //     }
  // });
    return 1;
}

function scoreTweets(tweets){
  let scores = [];
  for (var t in tweets) {
    var score = getScore(tweets[t]);
    scores.push(score);
    //console.log("Tweet: " + tweets[t] + " Score: " + score);
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
