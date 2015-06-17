Libraries = new Mongo.Collection("libraries");

Meteor.methods({
	newLibrary: function (cb){
		if(!Meteor.userId()){
			throw new Meteor.Error("not-authorized");
		}
		Libraries.insert({
			user: Meteor.user()._id,
			created: new Date().valueOf(),
			filters: [],
			types: [],
		}, cb);
	},
	updateLibrary: function (id, selected){
		var library = Libraries.findOne(id);
		if(library.user != Meteor.user()._id){
			throw new Meteor.Error("not-authorized");
		}
		library.selected = selected;
		Libraries.update(id, library);
	},
	delLibrary: function (id){
		var library = Libraries.findOne(id);
		if(library.user != Meteor.user()._id){
			throw new Meteor.Error("not-authorized");
		}
		Libraries.remove(id);
	},
});
