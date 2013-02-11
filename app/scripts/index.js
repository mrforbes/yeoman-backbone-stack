define(['app','text!../templates/index.html','i18n!../nls/index'],function(app,template,i18n){

	'use strict'

	var compiled = dust.compile(template, 'index');
	dust.loadSource(compiled);

	var View = Backbone.View.extend({
		initialize: function(){
			
		},
		render: function(){
			dust.render('index', i18n, function(err, out) {
				app.$main.empty().append(out);
			});
		}
	});

	var view = new View();

	var exports = {
		initialize: function(){
			view.render();
		},
		view: view
	};
 
	return exports;

});