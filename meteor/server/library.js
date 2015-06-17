Meteor.publish("libraries", function(){
	return Libraries.find({
	}, {
		sort: {name: 1},
	});
});
