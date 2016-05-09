module.exports = function() {

	this.Parameter = function() {

		this.limitByTier;
		this.tiersAllowed; // Array
		this.dataToGather; // Array
		this.nameChampionToStart;
		this.region;
		this.keyAPI;
		this.keyRequestLimitByTenMinutes;
		this.keyRequestLimitByTenSeconds;

		this.setParameters = function(form) {
			this.limitByTier = form.limitByTier;
			this.tiersAllowed = form.tiersAllowed;
			this.dataToGather = form.dataToGather;
			this.nameChampionToStart = form.nameChampionToStart;
			this.region = form.region;
			this.keyAPI = form.keyAPI;
			this.keyRequestLimitByTenMinutes = form.keyRequestLimitByTenMinutes;
			this.keyRequestLimitByTenSeconds = form.keyRequestLimitByTenSeconds;
		}
	}
};