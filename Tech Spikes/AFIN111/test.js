let fs = require('fs');
var afinnStr = fs.readFileSync('AFINN-111.txt', 'utf8');
let afinnArr = parse_String(afinnStr);

let tweet = "Wow I can't believe BestBuy screwed me today.";
console.log("Original Tweet: " + tweet);
tweet = tweet.toLowerCase();
let score = getScore(tweet);
console.log("Total Score: " + score);


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

//extremely basic test of looking at each word in example tweet and calculuating score
function getScore(tweet){
  var tempScore = 0;
  let tweetSplit = tweet.split(" ");
  for (var n in tweetSplit){
    console.log(tweetSplit[n]);
    for (var w in afinnArr){
      if (tweetSplit[n] == afinnArr[w].word){
        tempScore += parseInt(afinnArr[w].score);
        console.log(afinnArr[w].word + " -> score: " + afinnArr[w].score);
      }
    }
  }
  return tempScore;
}
