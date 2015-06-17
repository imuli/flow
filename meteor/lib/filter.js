Filters = new Mongo.Collection("filter");

Meteor.methods({
	newFilter: function (cb){
		if(!Meteor.userId()){
			throw new Meteor.Error("not-authorized");
		}
		Filters.insert({
			user: Meteor.user()._id,
			created: new Date().valueOf(),
			name: "",
			library: undefined,
			i: [],
			f: [],
			o: [],
			map: [],
		}, cb);
	},
	updateFilter: function(id, changes){
		var filter = Filters.findOne(id);
		if(filter === undefined || filter.user != Meteor.user()._id){
			throw new Meteor.Error("not-authorized");
		}
		delete(changes._id);
		Filters.update(id, {$set: changes});
	},
	removeFilter: function (id){
		var filter = Filters.findOne(id);
		if(filter === undefined || filter.user != Meteor.user()._id){
			throw new Meteor.Error("not-authorized");
		}
		Filters.remove(id);
	},
});
