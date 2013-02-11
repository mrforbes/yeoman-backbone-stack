// Set the require.js configuration for your application.
require.config({

  // Initialize the application with the main application file.
  deps: ["main",'dust'],
  
  paths: {
    // JavaScript folders.
    libs: "../scripts/libs",
    plugins: "../scripts/plugins",

    // Libraries.
    jquery: "../scripts/libs/jquery",
    lodash: "../scripts/libs/lodash",
    backbone: "../scripts/libs/backbone",
    dust: "../scripts/plugins/dust-full-1.1.1"
  },

  shim: {
    // Backbone library depends on lodash and jQuery.
    backbone: {
      deps: ["lodash", "jquery"],
      exports: "Backbone"
    },

    // Backbone.LayoutManager depends on Backbone.
    "plugins/backbone.layoutmanager": ["backbone"],
    "plugins/backbone.validation": ["backbone"],
    "plugins/Backbone.ModelBinder": ["backbone"]
  }

});
