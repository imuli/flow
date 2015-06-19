Meteor.subscribe("libraries");

Template.picklibrary.helpers({
	libraries: function() {
		return Libraries.find({});
	}
});

Template.picklibrary.events({
	"click .picklibrary": function(event) {
		var list = $(".libraries.dropdown");
		list.toggle();
		console.log(list);
	},
	"click li": function(event) {
		$(".libraries.dropdown").toggle();
	},
});

