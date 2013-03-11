// Set the require.js configuration for your application.
require.config({

    // Initialize the application with the main application file.
    deps: ['main', 'dust', 'jquery', 'modernizr'],
    paths: {
        // JavaScript folders.
        libs: '../scripts/libs',
        plugins: '../scripts/plugins',
        nls: '../nls',
        // Libraries.
        jquery: '../scripts/libs/jquery',
        modernizr: '../scripts/libs/modernizr',
        lodash: '../scripts/libs/lodash',
        backbone: '../scripts/libs/backbone',
        dust: '../scripts/plugins/dust.core.1.2.0',
        DeepModel: 'plugins/backbone.deep-model'
    },
    shim: {
        // Backbone library depends on lodash and jQuery.
        main: {
            deps: ['jquery', 'dust']
        },
        backbone: {
            deps: ['lodash', 'jquery'],
            exports: 'Backbone'
        },
        DeepModel: {
            deps: ['backbone', 'lodash', 'plugins/underscore.mixin.deepExtend']
        },
        customValidation: {
            deps: ['backbone', 'lodash', 'plugins/backbone.validation']
        },
        'plugins/backbone.layoutmanager': ['backbone'],
        'plugins/backbone.validation': ['backbone'],
        'plugins/Backbone.ModelBinder': ['backbone'],
        'plugins/Backbone.CollectionBinder': ['backbone', 'Backbone.ModelBinder'],
        'plugins/underscore.mixin.deepExtend': ['lodash']
    }

});