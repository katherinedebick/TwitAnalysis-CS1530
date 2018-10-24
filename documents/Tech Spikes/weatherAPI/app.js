const OpenWeatherMapHelper = require("openweathermap-node");
const helper = new OpenWeatherMapHelper(
    {
        APPID: 'YOUR_OPENWEATHERMAP_API_KEY_GOES_HERE', //get key from AlexIntialProjectNotes.docx
        units: "metric"
    }
);

console.log("starting");

helper.getCurrentWeatherByCityName("Pittsburgh", (err, currentWeather) => {
    if(err){
        console.log(err);
    }
    else{
        console.log(currentWeather);
    }
});
