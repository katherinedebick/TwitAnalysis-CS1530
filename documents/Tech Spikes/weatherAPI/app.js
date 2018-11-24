const OpenWeatherMapHelper = require("openweathermap-node");
const helper = new OpenWeatherMapHelper(
    {
        APPID: 'd8dfe68ffd082d3b189b28e87fe76264', //get key from AlexIntialProjectNotes.docx
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
