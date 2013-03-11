define([
    // Libraries.
    'jquery',
    'lodash',
    'DeepModel',

    // Plugins.
    'plugins/jquery.cookie',

    'plugins/Backbone.ModelBinder',
    'plugins/backbone.validation',
    'plugins/base64',
    'plugins/jquery.inputmask',
    'plugins/jquery.io',
    //Bootstrap.
    'plugins/bootstrap-modal',

    // dust templates
    'templates'
],

function($, _, Backbone) {

    'use strict';

    //Add Backbone.Model validation:
    _.extend(Backbone.DeepModel.prototype, Backbone.Validation.mixin);

    // Provide a global location to place configuration settings and module
    // creation.
    var app = {
        // The root path to run the application.
        root: '/',
        oldView: null
    };

  // Mix Backbone.Events, modules, and layout management into the app object.
    return _.extend(app, Backbone.Events);
});