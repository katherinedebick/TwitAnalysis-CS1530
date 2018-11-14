//test.js


var server = require('../server'), http = require('http'), assert = require('assert');
describe('server', function(){
	beforeEach(function () {
	});
	
	describe('/', function () {
		it('should return 200', function (done) {
			http.get('http://localhost:5000', function (res) {
				assert.equal(200, res.statusCode);
				done();
			});
		});
	});
	
	describe('getScore', function () {
		it('should return my non word tweet score as 0', function() {
			score = getScore('asdfasdf asdfasdfasdf asdfasdf');
			console.log(score);
		});
	});
});

