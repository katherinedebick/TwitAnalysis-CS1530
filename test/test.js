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
		it('"love" input, should return my non word tweet score as 0', function() {
			score = helper.getScore('asdfasdf asdfasdfasdf asdfasdf');
			assert.equal(0, score);
		});
		
		it('should return a scored of 3', function() {
			score = helper.getScore('love');
			assert.equal(3, score);
		});
		
		it(' "LOVE" input, should return a score of 3', function() {
			score = helper.getScore('LOVE');
			assert.equal(3, score);
		});
		
		it(' "lOvE" input, should return a score of 3', function() {
			score = helper.getScore('lOvE');
			assert.equal(3, score);
		});
		
		it(' "hugs and kisses", should return a score of ', function() {
			score = helper.getScore('hugs and kisses');
			assert.equal(2, score);
		});
	});
});

