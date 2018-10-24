var express = require('express');
var app = express();
app.set('view engine', 'ejs');

var path = require('path');

var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();

var Twit = require('twit')

var tweets = [];

var T = new Twit({
  consumer_key: '6uDqrXBSyRpNiXnzzsheLNm7k',
  consumer_secret: 'YRqllIAZugkSXSfZTSdqe3nGDtFrnVmR60u6m2MZqJvPUlZGDX',
  access_token: '908083862886076416-2cgZ5HRpfa4BFASYL8FtteTmDuCVrj8',
  access_token_secret: 'X09OZU9yvkL6Vpxu1W56e3dntl2sLmnuiF8SO128jM92W',
  timeout_ms: 60*1000,
  strictSSL: true,
})

function gotData(err, data, response){
  //return data;
  var raw_tweets = data.statuses;
  for (var i=0; i<raw_tweets.length; i++){
    tweets.push(String(raw_tweets[i].text))
    //console.log(tweets[i])
  }
  //res.render('views/graph', {tweets: tweets});
  //console.log("DATA: "+data)
}

const Query = require('./query.js');

// for parsing application/json
app.use(bodyParser.json());
// for parsing application/xwww-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// for parsing multipart/form-data
app.use(upload.array());
app.use(express.static('public'));


// viewed at http://localhost:8080
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/pages/index.html'));
});

app.post('/gettweets', function(req, res){
  var temp_query = new Query(req.body.search_word, req.body.sample_size, req.body.start_date, req.body.end_date);
  process_query(temp_query);
  res.render(path.join(__dirname+'/views/tweets.ejs'), {tweets: tweets});
  //res.sendFile(path.join(__dirname + '/pages/graph.html'));
});

function process_query(query){
  console.log(query.search_word)
  console.log(query.sample_size)
  var params = {
    q: query.search_word,
    count: query.sample_size
  }
  T.get('search/tweets', params, function(err, data, response){
    //return data;
    var raw_tweets = data.statuses;
    for (var i=0; i<raw_tweets.length; i++){
      tweets.push(String(raw_tweets[i].text))
    }
  });
  console.log(tweets)
  for (var i=0; i<tweets.length; i++){
    console.log("Tweet: "+tweets[i])
  }
  //return tweets;
}


app.listen(process.env.PORT || 5000);
