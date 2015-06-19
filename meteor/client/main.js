Template.body.helpers({
	currentLibrary: function() {
		return Libraries.find(Session.get('currentLibrary'));
	}
});
