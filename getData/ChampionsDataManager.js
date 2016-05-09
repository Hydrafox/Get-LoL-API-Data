require("./ListChampions.js")();
require("./Champion.js")();
require("./RequestAPI.js")();

module.exports = function() {

	this.ChampionsDataManager = function(socket, parameter, fillDatabase) {

		this.socket = socket;
		this.parameter = parameter;
		this.fillDatabase = fillDatabase;
		this.listChampions = new ListChampions(socket, parameter);
		this.requestAPI = new RequestAPI(socket, parameter);
		this.errorType = {400: "Bad request", 401: "Unauthorized", 403: "Access Denied", 404: "Not Found", 429: "Rate limit exceeded", 500: "Internal server error", 503: "Service unavailable"};

		this.nbDataGatheredByTier = {};
		this.currentId = 0;
		this.currentChampion;

		this.setAPIValues = function(keyAPI, keyRequestLimitByTenMinutes, keyRequestLimitByTenSeconds) {
			this.requestAPI.setAPIValues(keyAPI, keyRequestLimitByTenMinutes, keyRequestLimitByTenSeconds, this);
		}


		// GET ID
		this.getIdChampion = function() {
			var id = this.requestAPI.getIdChampion(this.parameter.nameChampionToStart, this.parameter.region, this);
		}

		this.callback_championIdFound = function(id) {

			if(id.hasOwnProperty('id')){
//		  		this.socket.emit("log", "Champion ID : "+ id.id);

		  		// Gather this player tier
		  		this.gatherPlayerTier(id.id, this.parameter.region);
			}
			else if(id.hasOwnProperty('erreur')){
		  		this.errorDetected(id.erreur, "getIdChampion", [this.parameter.nameChampionToStart, this.parameter.region, this]);
			}
		}

		// GET TIER
		this.gatherPlayerTier = function(id) {
			this.currentId = id;
			this.requestAPI.getTierChampion(id, this.parameter.region, this);
		}

		this.callback_championTierFound = function(tier) {

			if(tier.hasOwnProperty('tier')){
//		  		this.socket.emit("log", "Champion Tier : "+ tier.tier);

		  		// Check if we already have player enough for this tier
		  		var needMoreChampionInThisTier = this.listChampions.checkNeedChampionInThisTier(tier.tier);
		  		if(needMoreChampionInThisTier === true) {

			  		// Create a Champion object
			  		this.currentChampion = new Champion(this.currentId, tier.tier);

			  		// Gather this player mastery data
			  		this.gatherPlayerMastery(this.parameter.region, this);
			  	}
			  	else if(needMoreChampionInThisTier === false){
					this.fillDatabase.playersUsed.push(this.currentId);
			  		this.fillDatabase.switchCursor();
			  	}
			  	else if(needMoreChampionInThisTier === "stop") {
			  		this.fillDatabase.stopLauncher = true;
			  		this.fillDatabase.switchCursor();
			  	}
			}
			else if(tier.hasOwnProperty('erreur')){
		  		this.errorDetected(tier.erreur, "getTierChampion", [this.currentId, this.parameter.region, this]);
			}
		}

		// GET MASTERY
		this.gatherPlayerMastery = function() {
			this.requestAPI.getMastery(this.currentChampion.id, this.parameter.region, this);
		}

		this.callback_gatherPlayerMastery = function(data) {

			if(data.hasOwnProperty('data')) {

		  		// Save data
		  		this.currentChampion.setMastery(data.data);
		  		this.listChampions.sortData(this.currentChampion);
		  		this.socket.emit("logRequest", this.listChampions.getCurrentPlayersGathered());

		  		// Search the other players in the previous game
				this.gatherOtherPlayers();
			}
			else if(data.hasOwnProperty('erreur')) {
		  		this.errorDetected(data.erreur, "getMastery", [this.currentChampion.id, this.parameter.region, this]);
			}
		}

		// GET OTHER PLAYERS
		this.gatherOtherPlayers = function() {
			this.requestAPI.gatherOtherPlayers(this.currentChampion.id, this.parameter.region, this);
		}

		this.callback_gatherOtherPlayers = function(data) {

			if(data.hasOwnProperty('data')) {
//		  		this.socket.emit("log", "List of other players gathered"); // Will be deleted - just for production

		  		// Save data - Search from the other players
		  		var otherPlayers = [];
		  		for(var i=0; i<9; i++) {
		  			if(typeof data.data.games[i] != "undefined")
		  				otherPlayers = otherPlayers.concat(data.data.games[i].fellowPlayers);
		  		}		  		
		  		this.fillDatabase.saveListPlayers(otherPlayers, this.currentChampion.id);
			}
			else if(data.hasOwnProperty('erreur')) {
		  		this.errorDetected(data.erreur, "gatherOtherPlayers", [this.currentChampion.id, this.parameter.region, this]);
			}
		}

		this.getNbChampionProcessed = function() {
			return this.listChampions.nbChampionProcessed;
		}

		this.errorDetected = function(id, nameFunction, args) {
//	  		this.socket.emit("log", "Erreur : "+ id + " " + this.errorType[id] + " -> " + nameFunction);
if(id != 404)	  		console.log("Erreur : "+ id + " " + this.errorType[id] + " -> " + nameFunction);

	  		if(id == 400 || id == 401 || id == 403) {
//	  			this.socket.emit("log", "It seems that there is a mistake on the code, check the RequestAPI file");
	  			console.log("It seems that there is a mistake on the code, check the RequestAPI file");
	  		}
	  		else if(id == 404) {
//	  			this.socket.emit("log", "It seems that the league has not be found");
//	  			this.socket.emit("log", "We continue with the next player");
//	  			console.log("It seems that the league has not be found");

				this.fillDatabase.playersUsed.push(this.currentId);
		  		this.fillDatabase.switchCursor();
	  		}
	  		else if(id == 429) {
//	  			this.socket.emit("log", "The limit rate has been exceeded");
//	  			this.socket.emit("log", "We will wait 10 seconds before continue");
	  			console.log("Limit rate exceeded, the RequestAPI.requestManager function may need to be improve");

	  			this.requestAPI.waitTenSeconds(nameFunction, this, args);
	  		}
	  		else if(id == 500) {
//	  			this.socket.emit("log", "The LoL server has encountered an error");
//	  			this.socket.emit("log", "We will wait 1 seconds before trying again");
	  			console.log("LoL server has encountered an error");

	  			var self = this;
	  			var timeout = setTimeout(function() { 

//	  				self.socket.emit("log", "The launcher will continue to gather the data");
	  				nameFunction == "getIdChampion"   ? self.requestAPI.getIdChampion(args[0], args[1], args[2]) 	:
					nameFunction == "getTierChampion" ? self.requestAPI.getTierChampion(args[0], args[1], args[2])  :
					nameFunction == "getMastery" 	  ? self.requestAPI.getMastery(args[0], args[1], args[2]) 		:
														self.requestAPI.gatherOtherPlayers(args[0], args[1], args[2]);
				}, (1000));
	  		}
	  		else if(id == 503) {
//	  			this.socket.emit("log", "The LoL server is actually unavailable");
//	  			this.socket.emit("log", "We will wait 10 seconds before trying again");
	  			console.log("LoL server is unavailable");

	  			this.requestAPI.waitTenSeconds(nameFunction, this, args);
	  		}
		}

		this.fillListChampions = function(getGameData) {

		}

		this.insertDatabase = function(id, championsMatery) {
			
		}
	}
};