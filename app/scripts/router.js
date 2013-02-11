define([
  // Application.
  "app", "index", "error","selection","create","enterId","feed"
],

function(app, index, error, selection, create, enterId, feed) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({
    routes: {
      "": "index",
      "error": "error",
      "selection":"selection",
      "create":"create",
      "enterId":"enterId",
      "feed":"feed"
    },
    initialize: function(){

    },
    index: function() {
        index.initialize();
    },
    error: function(){
        error.initialize();
    },
    selection: function(){
        selection.initialize();
    },
    create: function(){
        create.initialize();
    },
    enterId: function(){
        enterId.initialize();
    },
    feed: function(){
        feed.initialize();
    }

  });

  return Router;

});
