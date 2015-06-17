Meteor.publish("types", function(library){
	return Types.find({
		"library": library,
	}, {
		sort: {name: 1},
	});
});
