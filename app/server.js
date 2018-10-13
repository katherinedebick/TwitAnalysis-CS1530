var express = require('express');
var app = express();
var path = require('path');

var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();


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
  console.log('Elements Found: ');
  console.log(req.body.search_word);
  console.log(req.body.sample_size);
  console.log(req.body.start_date);
  console.log(req.body.end_date);
  res.sendFile(path.join(__dirname + '/pages/graph.html'));
});

app.listen(8080);
