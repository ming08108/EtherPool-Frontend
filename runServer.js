var redis = require("redis");

var express = require('express');
var bodyParser = require('body-parser');

var ethRPC = require("./ethRPC.js");

var config = require('./config.js');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.set('view engine', 'jade');

var poolAddress = config.poolAddress;


var client = redis.createClient();
client.auth(config.redisPassword, redis.print);

var twentyMin = 60*20*1000;


app.get("/", function(req, res){
	var currentTime = new Date().getTime();
	client.get("lastpayout", function(err, lastPayout){
		client.zrevrange("20minshares", 0, -1, function(err, response){
			console.log(response)
			ethRPC.getBalance(poolAddress, function(json){
				var poolBalance = parseInt(json.result, 16)
				client.hgetall("totalRoundShares", function(err, shares){
					var totalShares = 0;
					for (var key in shares) {
						if (shares.hasOwnProperty(key)) {
							totalShares = totalShares + parseInt(shares[key]);
						}
					}
					res.render('index', { shares: response, totalShares: totalShares, poolBalance : poolBalance, lastPayout:lastPayout});
				});
			});
			
		});
	});
});

app.get("/:address", function(req, res){
	var address = req.params.address;
	getAddress(address, res);

});

app.post("/address", function(req, res){
	var address = req.body.address;
	console.log(req.body)
	getAddress(address, res);
});

var getAddress = function(address, res){
	client.zrevrange("payments:" + address, 0, -1, "WITHSCORES", function(err, payouts){

		client.zscore("reportedHashrate", address, function(err, yourSpeed){
			client.hget("totalRoundShares", address, function(err, yourShares){
				client.hgetall("totalRoundShares", function(err, shares){
					client.hget("balances", address, function(err, balance){

						var totalShares = 0;
						for (var key in shares) {
							if (shares.hasOwnProperty(key)) {
								totalShares = totalShares + parseInt(shares[key]);
							}
						}
						res.render('address', { yourShares: yourShares, address: address, totalShares: totalShares, balance : balance, yourSpeed : yourSpeed, payouts : payouts});
					});
					
				});
			});

		});

	});
}

app.listen(7000);
