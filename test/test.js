//test.js


var server = require('../server');
var http = require('http')
var assert = require('assert');
var helper = require('../helper');
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
});

describe("helper", function(){
		describe('getScore', function () {
		it('should return my non word tweet score as 0', function() {
			score = helper.getScore('asdfasdf asdfasdfasdf asdfasdf');
			assert.equal(0, score);
		});
	});
});

