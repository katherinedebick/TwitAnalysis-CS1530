var express = require('express');
var app = express();
app.set('view engine', 'ejs')
var async = require('async');;

var path = require('path');

var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();

var Twit = require('twit')

let fs = require('fs');
var afinnStr = fs.readFileSync('AFINN-111.txt', 'utf8');
let afinnArr = parse_String(afinnStr);



var T = new Twit({
  consumer_key: '6uDqrXBSyRpNiXnzzsheLNm7k',
  consumer_secret: 'YRqllIAZugkSXSfZTSdqe3nGDtFrnVmR60u6m2MZqJvPUlZGDX',
  access_token: '908083862886076416-2cgZ5HRpfa4BFASYL8FtteTmDuCVrj8',
  access_token_secret: 'X09OZU9yvkL6Vpxu1W56e3dntl2sLmnuiF8SO128jM92W',
  timeout_ms: 60*1000,
  strictSSL: true,
})

const Query = require('./query.js');

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
      scores = scoreTweets(tweets2);
      renderPage(tweets2, res, scores);
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


function scoreTweets(tweets){
  let scores = [];
  for(var t in tweets){
    var score = getScore(tweets[t]);
    scores.push(score);
    console.log("Tweet: "+tweets[t]+" Score: "+score);
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
  res.render(path.join(__dirname+'/views/tweets.ejs'), {tweets: tweets, scores: scores});
}


app.listen(process.env.PORT || 5000);
