var redis = require("redis");
var config = require('./config.js');



var client = redis.createClient();
client.auth(config.redisPassword, redis.print);

var twentyMin = 60*20*1000;



var interval = 1*60*1000;

setInterval(function(){
	var currentTime = new Date().getTime();
	//get all the shares
	client.del("20minshares");
	client.keys("shares:*", function(err, response){
		//loop through each address
		response.forEach(function(address, i){
			//get shares
			client.zrangebyscore(address, (currentTime - twentyMin), currentTime, function(err, response){
				var shares = 0;
				response.forEach(function(share, i){
					var array = share.split(":");
					shares = shares + parseInt(array[0]);
				});
				client.zadd("20minshares", shares, address.split(":")[1] + ":" + shares);
				client.zadd("20minsharespersonal", shares, address.split(":")[1]);
			});
		});
	});
	
	console.log("updated shares");
}, interval);
	
	

