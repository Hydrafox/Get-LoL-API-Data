module.exports = function() {

	this.ListChampions = function(socket, parameter) {

		this.socket = socket;
		this.parameter = parameter;
		this.data = {}; // this.data[Tier: "Silver"][championId: 1][championPoints: 75000, championHighestGrade: 12]
		this.nbChampionProcessed = {}; // this.nbChampionProcessed[Tier: "Silver"][nbChampionProcessed: 10]

		// Init Mastery
		this.initListChampions = function() {
			for(var i= 0; i < parameter.tiersAllowed.length; i++) {
				this.data[parameter.tiersAllowed[i]] = {};
				this.nbChampionProcessed[parameter.tiersAllowed[i]] = 0;
			}
		}

		this.empty = function() {

		}

		this.sortData = function(champion) {
			for(var prop in champion.mastery) {
				if(this.data[champion.tier].hasOwnProperty(prop)) {
					this.data[champion.tier][prop][0] += champion.mastery[prop][0];
					this.data[champion.tier][prop][1] += champion.mastery[prop][1];
				}
				else {
					this.data[champion.tier][prop] = champion.mastery[prop];
				}
			}

			this.nbChampionProcessed[champion.tier] ++;
		}

		this.checkNeedChampionInThisTier = function(tier) {
			var needMoreChampionInThisTier = this.nbChampionProcessed[tier] < this.parameter.limitByTier;
			if(!needMoreChampionInThisTier) {

				// Check if the other tiers are full too
				for(var prop in this.parameter.tiersAllowed) {
					var tierLoop = this.parameter.tiersAllowed[prop];
					if(this.nbChampionProcessed[tierLoop] < this.parameter.limitByTier) {
						return false;
					}
				}
				return "stop";
			}
			return needMoreChampionInThisTier;
		}

		this.getCurrentPlayersGathered = function() {
			return this.nbChampionProcessed;
		}

		this.calculMasteryAverage = function() {

			var newData = {};
			for(var tier in this.data)
			{
				newData[tier] = {};
				for(var champion in this.data[tier])
				{
					var averageChampionPoints = this.data[tier][champion][0] / this.nbChampionProcessed[tier];
					var averageHighestGrade =  this.data[tier][champion][1] / this.nbChampionProcessed[tier];

					newData[tier][champion] = [averageChampionPoints, averageHighestGrade];
				}
			}

			return newData;
		}
	}
};