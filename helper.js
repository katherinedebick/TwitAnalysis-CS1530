//server helper functions
var exports = module.exports = {};
let fs = require('fs');
var afinnStr = fs.readFileSync('AFINN-111.txt', 'utf8');
let afinnArr = parse_String(afinnStr);
var path = require('path');

exports.scoreTweets = function(tweets){
  let scores = [];
  for(var t in tweets){
    var score = exports.getScore(tweets[t]);
    scores.push(score);
    console.log("Tweet: "+tweets[t]+" Score: "+score);
  }
  return scores;
};

exports.getScore = function(tweet){
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
};

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

exports.renderPage = function(tweets, res, scores){
  res.render(path.join(__dirname+'/views/tweets.ejs'), {tweets: tweets, scores: scores});
};

