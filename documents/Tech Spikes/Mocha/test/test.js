//test

var assert = require('assert');
var dateTime = require('../testFiles/testFunctions');
describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal([1,2,3].indexOf(4), -1);
    });
  });
});

describe('testFunctions', function() {
	describe('#myDateTime', function() {
		it('should return the current date and time', function() {
			assert(dateTime.myDateTime());
		});
	});
});