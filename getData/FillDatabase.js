require("./Parameter.js")();
require("./ChampionsDataManager.js")();

module.exports = function() {

	this.FillDatabase = function(socket) {

		this.socket = socket;
		this.form;
		this.stopLauncher = false;
		this.playersUsed = [];
		this.cursors = [22750254, 72371021, 32228856, 40288383, 35772954, 81537363, 52012839, 81407223, 77876979, 66390797, 24155571, 47309458, 48727643, 31308064, 57079903];
		this.cursorActuel = -1;
		this.parameter = new Parameter();
		this.championsDataManager = new ChampionsDataManager(socket, this.parameter, this);

		this.gatherPlayer = function(id) {
			return [];
		}

		this.switchCursor = function() {

			if(!this.stopLauncher) {
				var newID = this.cursors[this.cursors.length-1];				
				while(this.cursors.length > 0 && this.playersUsed.indexOf(newID) != -1) {
					this.cursors.pop();
					newID = this.cursors[this.cursors.length-1];
				}

				if(this.cursors.length == 0) {
//					socket.emit('log', "Not enough players gathered to found all tiers");
					console.log("Not enough players gathered to found all tiers");
					this.stopLauncher = true;
//					socket.emit('action', "switchSubmitTextButton");
					this.launcherStopped();
				}
				else {

					// Search the player data
//					socket.emit('log', "New cursor : " + newID);
					this.championsDataManager.gatherPlayerTier(newID);
				}
			}
			else {
//				socket.emit('log', "Application finished");
				console.log("Application finished");
				this.stopLauncher = true;
//				socket.emit('action', "switchSubmitTextButton");
				this.launcherStopped();
			}
		}

		this.saveListPlayers = function(otherPlayers, id) {

			if(typeof otherPlayers == "undefined") {

				console.log("otherPlayers is undefined for the id : " + id);
				console.log("The launcher still continue");
				this.playersUsed.push(id);
				this.switchCursor();
	  		}
	  		else {

				for(var i=0; i<otherPlayers.length; i++) {

					if(typeof otherPlayers[i] == "undefined") {delete otherPlayers[i]; i--;}
					else
					{
						var idPlayer = otherPlayers[i].summonerId;

						if(this.cursors.length < 5000 && this.cursors.indexOf(idPlayer) == -1) {
							this.cursors.push(idPlayer);
						}
					}
				}

//				console.log("Nb players used : " + this.playersUsed.length);
				this.playersUsed.push(id);
				this.switchCursor();
			}
		}

		this.start = function(form) {

			console.log("start");
			socket.emit('log', "Start");


			/** Not verified during development
			if(this.checkParameters(form) == true){*/


			// Only during development
			this.form = {
				"limitByTier" : 10000,
				"tiersAllowed" : ["Bronze", "Silver", "Gold", "Platinum", "Diamond"],
				"dataToGather" : ["Mastery"],
				"nameChampionToStart" : "EC LE ROI BISOU",
				"region" : "EUW",
				"keyAPI" : "d5d87927-a51b-4cb8-811d-eb7e345f2fa0",
				"keyRequestLimitByTenMinutes" : 90000,
				"keyRequestLimitByTenSeconds" : 1500
			}

			this.parameter.setParameters(this.form);
			this.championsDataManager.listChampions.initListChampions();

// Nixart
// pf2012
			// Set API values
			this.championsDataManager.setAPIValues(this.parameter.keyAPI, this.parameter.keyRequestLimitByTenMinutes, this.parameter.keyRequestLimitByTenSeconds);

			// Get data of the champion - will return to switchCursor
			this.championsDataManager.getIdChampion();

			/** Not verified during development
			}
			else {
				
				return false;
			}
			*/
		}

		this.checkParameters = function(form) {

			var returnValue = true;
			testLimitByTier = /^[1-9][0-9]*$/.test(form.limitByTier) && form.limitByTier>0;
			testTiersAllowed = form.tiersAllowed != null;
			testDataToGather = form.dataToGather != null;
			testNameChampionToStart = /^[0-9a-zA-Z]*$/.test(form.nameChampionToStart);
			testRegion = /^[0-9a-zA-Z]*$/.test(form.region);
			testIdChampionToStart = /^[0-9]*$/.test(form.idChampionToStart) && form.idChampionToStart>0;
			testKeyAPI = /^[0-9a-zA-Z]*$/.test(form.keyAPI);
			testKeyRequestLimitByTenMinutes = /[1-9][0-9]*/.test(form.keyRequestLimitByTenMinutes);
			testKeyRequestLimitByTenSeconds = /[1-9][0-9]*/.test(form.keyRequestLimitByTenSeconds);

			if(!testLimitByTier) {returnValue = false; socket.emit('log', "Limit by tier - invalid");}
			if(!testTiersAllowed) {returnValue = false; socket.emit('log', "Tiers allowed - invalid");}
			if(!testDataToGather) {returnValue = false; socket.emit('log', "Data to gather - invalid");}
			if(!testNameChampionToStart) {returnValue = false; socket.emit('log', "Champion name - invalid");}
			if(!testRegion) {returnValue = false; socket.emit('log', "Champion region - invalid");}
			if(!testKeyAPI) {returnValue = false; socket.emit('log', "Key API - invalid");}
			if(!testKeyRequestLimitByTenMinutes) {returnValue = false; socket.emit('log', "Key request limit - ten minutes - invalid");}
			if(!testKeyRequestLimitByTenSeconds) {returnValue = false; socket.emit('log', "Key request limit - ten seconds - invalid");}

			return returnValue;
		}

		this.checkScriptFinished = function() {

			var nbChampionProcessed = this.championsDataManager.getNbChampionProcessed();
			for(var prop in nbChampionProcessed) {
				if(nbChampionProcessed[prop] < this.parameter.limitByTier) return false
			}

			return true;
		}

		this.launcherStopped = function () {

			// Display with emit
			for(var prop in this.parameter.tiersAllowed) {
				var tier = this.parameter.tiersAllowed[prop];
				socket.emit('log', tier + " gathered : " + this.championsDataManager.listChampions.nbChampionProcessed[tier]);
				socket.emit('log', "Generate the Json file if needed");
			}
		}

		this.createJsonFile = function() {

			// Generate the Json file
			socket.emit('log', "Json file creation ongoing");
			socket.emit('log', "Please wait...");

			var data = this.championsDataManager.listChampions.data;
			var dataJson = JSON.stringify(data);
			var dir = __dirname + "\\..\\generate";
			var file = __dirname + "\\..\\generate\\jsonMasteries.js";

			var fs = require('fs');
			if (!fs.existsSync(dir)){
			    fs.mkdirSync(dir);
			}

			var self = this;
			fs.writeFile(file, dataJson, function(err) {
			    if(err) {
					socket.emit('log', "jsonMasteries.js Json file has not been created :");
					socket.emit('log', err);
					console.log(err);
			    }
			    else {
				    if(self.stopLauncher) 
						socket.emit('log', "The Json file has been created in file /generate/jsonMasteries.js");
					else 
						socket.emit('log', "The Json file has been created in file /generate/jsonMasteries.js although the launcher is still in running");

			    	console.log("Json file created");
			    	self.calculMasteryAverage(fs, dir);
				}
			}); 
		}

		this.calculMasteryAverage = function(fs, dir) {

			// Generate the Json file
			var data = this.championsDataManager.listChampions.calculMasteryAverage();
			var dataJson = JSON.stringify(data);

			var self = this;
			fs.writeFile(dir + "\\jsonAverageMasteries.js", dataJson, function(err) {
			    if(err) {
					socket.emit('log', "jsonAverageMasteries.js Json file has not been created :");
					socket.emit('log', err);
					console.log(err);
			    }
			    else {
				    if(self.stopLauncher) 
						socket.emit('log', "The Json file has been created in file /generate/jsonAverageMasteries.js");
					else 
						socket.emit('log', "The Json file has been created in file /generate/jsonAverageMasteries.js although the launcher is still in running");

			    	console.log("Json average file created");
				}
			}); 
		}
	}
};