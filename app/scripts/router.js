define([
    // Application.
    'app', 'views/index'
],

function(app, index) {

    'use strict';

    // Defining the application router, you can attach sub routers here.
    var Router = Backbone.Router.extend({
        routes: {
            '': 'index'
        },
        initialize: function() {

        },
        index: function() {
            index.initialize();
        }

    });


    return Router;

});