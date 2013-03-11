define(['app','i18n!nls/colors'],function(app,i18n){

	'use strict';

	var view;
	var View = Backbone.View.extend({
		/* listen for the apps rendered event */
		tagName:'section',
		events: {
			'click .cancel':'cancel'
		},
		initialize: function(){
			var self = this;
			_.bindAll(this);
			app.on('teardown:index',this.teardown);

			dust.render('index', i18n, function(err, out) {
				self.$el.append(out);
			});

		},
		/** when navigating to this screen take the view element and put it into the viewable DOM */
		toScreen: function(){
			app.$main.empty().append(this.el);
		},
		teardown: function(){
			this.remove();
		},
		cancel: function(e) {
			e.preventDefault();
			alert('Are you sure you want to Quit?');
		}
	});

	var exports = {
		initialize: function(){
			if(!view){
				view = new View();
			}
			view.toScreen();
		},
		View: View
	};

	return exports;

});