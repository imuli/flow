Types = new Mongo.Collection("type");

Meteor.methods({
	newType: function (cb){
		if(!Meteor.userId()){
			throw new Meteor.Error("not-authorized");
		}
		Types.insert({
			user: Meteor.user()._id,
			created: new Date().valueOf(),
			name: "",
			spec: undefined,
		}, cb);
	},
	updateType: function(id, changes){
		var type = Types.findOne(id);
		if(type === undefined || type.user != Meteor.user()._id){
			throw new Meteor.Error("not-authorized");
		}
		delete(changes._id);
		Types.update(id, {$set: changes});
	},
	removeType: function (id){
		var type = Types.findOne(id);
		if(type === undefined || type.user != Meteor.user()._id){
			throw new Meteor.Error("not-authorized");
		}
		Types.remove(id);
	},
});
