/**helpers**/
module.exports = {
/*
TODO: Right now, place.name is not always returning a city, sometimes its a state...in those cases
openweathermap is returning a "cant find city error". We're getting closer!
I've commented out the weather grabbing for now to see what place information is being used in a readible format.
Also not that due to the async.until function I beleive we're getting duplicate city data since its calling
getWeatherData multiple times. We need to figure out how to fix this.
*/
getWeatherData: function(singleStatus) {
  console.log(String(singleStatus.place.name));
  // helper.getCurrentWeatherByCityName(String(singleStatus.place.name), (err, currentWeather) => {
  //     if(err){
  //         console.log(err);
  //     }
  //     else{
  //
  //         console.log('test temperature: ' + currentWeather.main.temp);
  //         console.log('test description: ' + currentWeather.weather[0].main);
  //
  //     }
  // });
    return 1;
},


getScore: function(tweet, afinnArr){
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
},

//reads in afinn111 string which is tab/newline delimited, saves as JS object/dictionary
parse_String: function(data){
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
};