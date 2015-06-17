Meteor.publish("filters", function(library){
	return Filters.find({
		"library": library,
	}, {
		sort: {name: 1},
	});
});
