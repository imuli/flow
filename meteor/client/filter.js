Meteor.subscribe("filters", Session.get('currentLibrary'));

Template.filters.helpers({
	filters: function() {
		return Filters.find({}, {});
	}
});

