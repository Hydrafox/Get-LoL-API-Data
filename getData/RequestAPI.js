module.exports = function() {


	this.RequestAPI = function(socket, parameter) {

		this.request = require('request');

		this.socket = socket;
		this.parameter = new Parameter();
		this.requestController_TenSeconds = [];		
		this.requestController_TenMinutes = [];		

		this.setAPIValues = function(keyAPI, keyRequestLimitByTenMinutes, keyRequestLimitByTenSeconds) {
			this.keyAPI = keyAPI;
			this.keyRequestLimitByTenMinutes = keyRequestLimitByTenMinutes;
			this.keyRequestLimitByTenSeconds = keyRequestLimitByTenSeconds;
		}

		this.getIdChampion = function(nameChampionToStart, region, championsDataManager) {

			if(this.requestManager("getIdChampion", championsDataManager, [nameChampionToStart, region, championsDataManager])) {
				var url = "https://euw.api.pvp.net/api/lol/"+ region.toLowerCase() +"/v1.4/summoner/by-name/"+ nameChampionToStart +"?api_key="+ this.keyAPI;
				this.request(url, function (error, response, body) {
				  	if (!error && response.statusCode == 200) {
				  		var data = JSON.parse(body);
		    			var lowerCaseName = nameChampionToStart.toLowerCase().replace(/ /g,"");
				  		var id = data[lowerCaseName].id;	

						championsDataManager.callback_championIdFound({"id" : id});
				  	}
				  	else {
						championsDataManager.callback_championIdFound({"erreur" : response.statusCode});
				  	}
				});
			}
			championsDataManager.fillDatabase.switchCursor();
			championsDataManager.fillDatabase.switchCursor();
		}

		this.getTierChampion = function(id, region, championsDataManager) {

			if(this.requestManager("getTierChampion", championsDataManager, [id, region, championsDataManager])) {
				var url = "https://euw.api.pvp.net/api/lol/"+ region.toLowerCase() +"/v2.5/league/by-summoner/"+ id +"?api_key="+ this.keyAPI;
				this.request(url, function (error, response, body) {
				  	if (!error && response.statusCode == 200) {
				  		var data = JSON.parse(body);
				  		var tier = data[id][0]["tier"].toLowerCase();
				  		tier = tier.charAt(0).toUpperCase() + tier.slice(1);

						championsDataManager.callback_championTierFound({"tier" : tier});
				  	}
				  	else {
						championsDataManager.callback_championTierFound({"erreur" : response.statusCode});
				  	}
				});
			}
		}

		this.getMastery = function(id, region, championsDataManager) {

			if(this.requestManager("getMastery", championsDataManager, [id, region, championsDataManager])) {
				var url = "https://euw.api.pvp.net/championmastery/location/"+ this.convertRegion(region).toLowerCase() +"/player/"+ id +"/champions?api_key="+ this.keyAPI;
				this.request(url, function (error, response, body) {
				  	if (!error && response.statusCode == 200) {
				  		data = JSON.parse(body);	
						championsDataManager.callback_gatherPlayerMastery({"data" : data});
				  	}
				  	else {
						championsDataManager.callback_gatherPlayerMastery({"erreur" : response.statusCode});
				  	}
				});
			}
		}

		this.gatherOtherPlayers = function(id, region, championsDataManager) {

			if(this.requestManager("gatherOtherPlayers", championsDataManager, [id, championsDataManager])) {
				var url = "https://euw.api.pvp.net/api/lol/"+ region.toLowerCase() +"/v1.3/game/by-summoner/"+ id +"/recent?api_key="+ this.keyAPI;
				this.request(url, function (error, response, body) {
				  	if (!error && response.statusCode == 200) {
				  		data = JSON.parse(body);	

						championsDataManager.callback_gatherOtherPlayers({"data" : data});
				  	}
				  	else {
						championsDataManager.callback_gatherOtherPlayers({"erreur" : response.statusCode});
				  	}
				});
			}
		}

		this.convertRegion = function(region) {
			return {
				"BR" : "BR1",
				"EUNE" : "EUN1",
				"EUW" : "EUW1",
				"JP" : "JP1",
				"KR" : "KR",
				"LAN" : "LA1",
				"LAS" : "LA2",
				"NA" : "NA1",
				"OCE" : "OC1",
				"RU" : "RU",
				"TR" : "TR1"
			}[region];
		}

		this.requestManager = function(nameFunction, championsDataManager, args) {

//			this.socket.emit("log", "Request " + nameFunction); // Temproaire

			var timestampActual = new Date().getTime();
			var limitTenSeconds = this.parameter.keyRequestLimitByTenSeconds;
			var limitTenMinutes = this.parameter.keyRequestLimitByTenMinutes;

			this.deleteOldEntry(timestampActual);

			// Control limit - 10 seconds
			if(this.requestController_TenSeconds.length > limitTenSeconds) {

				/*
				// Delete the old entries
				for(var i=0; i<this.requestController_TenSeconds.length; i++) {
					if(this.requestController_TenSeconds[i] < timestampActual-(10*1000)) {
						this.requestController_TenSeconds[i].shift();
						i--;
					}
					else {
						i = this.requestController_TenSeconds.length;
					}
				}
				*/

				// Check if now we can make a request
				//if(this.requestController_TenSeconds.length > limitTenSeconds) {
  				
  				waitTenSeconds(nameFunction, championsDataManager, args);
  				return false;
				//}				
			}

			// Control limit - 10 minutes
			if(this.requestController_TenMinutes.length > limitTenMinutes) {

				/*
				// Delete the old entries
				for(var i=0; i<this.requestController_TenMinutes.length; i++) {
					if(this.requestController_TenMinutes[i] < timestampActual-(10*1000)) {
						this.requestController_TenMinutes[i].shift();
						i--;
					}
					else {
						i = this.requestController_TenMinutes.length;
					}
				}
				*/

				// Check if now we can make a request
				//if(this.requestController_TenMinutes.length > limitTenMinutes) {

  				waitTenMinutes(nameFunction, championsDataManager, args);
  				return false;
				//}				
			}

			// Add the timestamp actuel to the request controllers	
			this.requestController_TenSeconds.push(timestampActual);
			this.requestController_TenMinutes.push(timestampActual);

			// Display the number of requests in log
//			this.socket.emit("logPlayerGathered", {"Nb Request - 10 seconds" : this.requestController_TenSeconds.length, "Nb Request - 10 minutes" : this.requestController_TenMinutes.length});
			return true;
		}

		this.deleteOldEntry = function(timestampActual) {

			var dataDeleted = false;
			for(var i=0; i<this.requestController_TenSeconds.length; i++) {
				if(this.requestController_TenSeconds[i] < timestampActual-(10*1000)) {
					this.requestController_TenSeconds.shift();
					dataDeleted = true;
					i--;
				}
				else {
					i = this.requestController_TenSeconds.length;
				}
			}

			for(var i=0; i<this.requestController_TenMinutes.length; i++) {
				if(this.requestController_TenMinutes[i] < timestampActual-(10*60*1000)) {
					this.requestController_TenMinutes.shift();
					dataDeleted = true;
					i--;
				}
				else {
					i = this.requestController_TenMinutes.length;
				}
			}

			if(dataDeleted) {

				// Display the number of requests in log
//				this.socket.emit("logPlayerGathered", {"Nb Request - 10 seconds" : this.requestController_TenSeconds.length, "Nb Request - 10 minutes" : this.requestController_TenMinutes.length});
			}
		}

		this.waitTenSeconds = function(nameFunction, championsDataManager, args) {

			var timestampActual = new Date().getTime();
//			this.socket.emit("log", this.requestController_TenSeconds.length + " request  done during the last 10 seconds");

			// Check every 1 second if the user pushed the stop button
    		var self = this;
			var interval = setInterval(function(){ 

				self.deleteOldEntry(timestampActual);
//				self.socket.emit("logPlayerGathered", {"Nb Request - 10 seconds" : self.requestController_TenSeconds.length, "Nb Request - 10 minutes" : self.requestController_TenMinutes.length});
				if(championsDataManager.fillDatabase.stopLauncher) {
					clearTimeout(timeout);
					championsDataManager.fillDatabase.launcherStopped();
				} 
			}, 100);

			// Wait for 10 seconds
			var timeout = setTimeout(function() { 

//				self.socket.emit("log", self.requestController_TenSeconds.length + " request done, waiting 10 seconds");
//				self.socket.emit("log", "10 seconds have passed, the launcher will continue to gather the data");

				// Delete the interval
				clearInterval(interval);

				// Empty the requestController associated
				self.requestController_TenSeconds = [];

				// Try again the request
				nameFunction == "getIdChampion"   ? self.getIdChampion(args[0], args[1], args[2]) 	:
				nameFunction == "getTierChampion" ? self.getTierChampion(args[0], args[1], args[2]) :
				nameFunction == "getMastery" 	  ? self.getMastery(args[0], args[1], args[2]) 		:
													self.gatherOtherPlayers(args[0], args[1], args[2]);

			}, (10*1000));
		}

		this.waitTenMinutes = function(nameFunction, championsDataManager, args) {

			var timestampActual = new Date().getTime();
//			this.socket.emit("log", this.requestController_TenMinutes.length + " request done, waiting 10 minutes");

				// Check every 1 second if the user pushed the stop button
    			var self = this;
				var interval = setInterval(function() { 

					self.deleteOldEntry(timestampActual);
//					self.socket.emit("logPlayerGathered", {"Nb Request - 10 seconds" : self.requestController_TenSeconds.length, "Nb Request - 10 minutes" : self.requestController_TenMinutes.length});
					if(championsDataManager.fillDatabase.stopLauncher) {
						clearTimeout(timeout);
						championsDataManager.fillDatabase.launcherStopped();
					} 
				}, 100);

				// Wait for 10 minutes
				var timeout = setTimeout(function(){ 

//					self.socket.emit("log", self.requestController_TenMinutes.length + " request done during the last 10 minutes");
//					self.socket.emit("log", "10 minutes have passed, the launcher will continue to gather the data");

					// Delete the interval
					clearInterval(interval);

					// Empty the requestControllers associated
					self.requestController_TenSeconds = [];
					self.requestController_TenMinutes = [];

					// Try again the request
					nameFunction == "getIdChampion"   ? self.getIdChampion(args[0], args[1], args[2]) 	:
					nameFunction == "getTierChampion" ? self.getTierChampion(args[0], args[1], args[2]) :
					nameFunction == "getMastery" 	  ? self.getMastery(args[0], args[1], args[2]) 		:
														self.gatherOtherPlayers(args[0], args[1], args[2]);

			}, (10*60*1000));
		}
	}
};