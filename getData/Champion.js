module.exports = function() {

	this.Champion = function(id, tier) {

		this.id = id;
		this.tier = tier;
		this.mastery = {}; // this.mastery[championId: 1][championPoints: 75000, championHighestGrade: 12]

		this.setMastery = function(data) {

			for(var i= 0; i < data.length; i++)
			{
			    var championPoints = data[i].championPoints;
			    var championId = data[i].championId;
			    var highestGrade = typeof data[i].highestGrade == "undefined" ? 0 : this.convertGrade(data[i].highestGrade);

			    var oldChampionPoints = typeof this.mastery[championId] == "undefined" ? 0 : this.mastery[championId][oldChampionPoints];
			    var oldHighestGrade = typeof this.mastery[championId] == "undefined" ? 0 : this.mastery[championId][highestGrade];
			    this.mastery[championId] = [championPoints+oldChampionPoints, highestGrade+oldHighestGrade];
			}
		}

		this.convertGrade = function(grade) {
			return {
				"D-" : 0,
				"D" : 1,
				"D+" : 2,
				"C-" : 3,
				"C" : 4,
				"C+" : 5,
				"B-" : 6,
				"B" : 7,
				"B+" : 8,
				"A-" : 9,
				"A" : 10,
				"A+" : 11,
				"S-" : 12,
				"S" : 13,
				"S+" : 14
			}[grade];
		}
	}
};