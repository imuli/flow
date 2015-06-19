Meteor.subscribe("types", Session.get('currentLibrary'));

Template.types.helpers({
	types: function() {
		return Types.find({}, {});
	}
});

