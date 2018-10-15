var express = require('express');
var app = express();
var path = require('path');

var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();

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

app.post('/', function(req, res){
  var temp_query = new Query(req.body.search_word, req.body.sample_size, req.body.start_date, req.body.end_date);
  process_query(temp_query);
  res.sendFile(path.join(__dirname + '/pages/graph.html'));
});

function process_query(query){
  console.log(query.search_word);
}


app.listen(8080);
