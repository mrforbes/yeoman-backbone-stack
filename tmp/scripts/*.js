define([
  // Libraries.
  "jquery",
  "lodash",
  "DeepModel",

    //model error handling.
  'linksys/backbone.error.callbacks',

  // Plugins.
  "plugins/jquery.cookie",

  "plugins/Backbone.ModelBinder",
  "plugins/backbone.validation",
  "plugins/base64",
  
  //Bootstrap.
  "plugins/bootstrap-modal",
  
  // dust templates
  "templates",
],
 
function($, _, Backbone, errorCallbacks) {



  _.extend(Backbone.DeepModel.prototype, errorCallbacks);
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
  return _.extend(app,Backbone.Events);

});
 
// Set the require.js configuration for your application.
require.config({

  // Initialize the application with the main application file.
  deps: ['main','dust','jquery','modernizr'],
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
    DeepModel: 'plugins/backbone.deep-model',
    customValidation: '../scripts/linksys/backbone.validation.callbacks'
  },
  shim: {
    // Backbone library depends on lodash and jQuery.
    main:{
      deps: ['jquery','dust']
    },
    backbone: {
      deps: ['lodash', 'jquery'],
      exports: 'Backbone'
    },
    DeepModel:{
      deps:['backbone','lodash','plugins/underscore.mixin.deepExtend']
    },
    customValidation:{
      deps:['backbone','lodash','plugins/backbone.validation']
    },
    'plugins/backbone.layoutmanager': ['backbone'],
    'plugins/backbone.validation': ['backbone'],
    'plugins/Backbone.ModelBinder': ['backbone'],
    'plugins/Backbone.CollectionBinder': ['backbone','Backbone.ModelBinder'],
    'plugins/underscore.mixin.deepExtend':['lodash'],
  }

});
 

/**
 * @license RequireJS i18n 2.0.1 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/i18n for details
 */
/*jslint regexp: true */
/*global require: false, navigator: false, define: false */

/**
 * This plugin handles i18n! prefixed modules. It does the following:
 *
 * 1) A regular module can have a dependency on an i18n bundle, but the regular
 * module does not want to specify what locale to load. So it just specifies
 * the top-level bundle, like "i18n!nls/colors".
 *
 * This plugin will load the i18n bundle at nls/colors, see that it is a root/master
 * bundle since it does not have a locale in its name. It will then try to find
 * the best match locale available in that master bundle, then request all the
 * locale pieces for that best match locale. For instance, if the locale is "en-us",
 * then the plugin will ask for the "en-us", "en" and "root" bundles to be loaded
 * (but only if they are specified on the master bundle).
 *
 * Once all the bundles for the locale pieces load, then it mixes in all those
 * locale pieces into each other, then finally sets the context.defined value
 * for the nls/colors bundle to be that mixed in locale.
 *
 * 2) A regular module specifies a specific locale to load. For instance,
 * i18n!nls/fr-fr/colors. In this case, the plugin needs to load the master bundle
 * first, at nls/colors, then figure out what the best match locale is for fr-fr,
 * since maybe only fr or just root is defined for that locale. Once that best
 * fit is found, all of its locale pieces need to have their bundles loaded.
 *
 * Once all the bundles for the locale pieces load, then it mixes in all those
 * locale pieces into each other, then finally sets the context.defined value
 * for the nls/fr-fr/colors bundle to be that mixed in locale.
 */
(function () {
    'use strict';

    //regexp for reconstructing the master bundle name from parts of the regexp match
    //nlsRegExp.exec("foo/bar/baz/nls/en-ca/foo") gives:
    //["foo/bar/baz/nls/en-ca/foo", "foo/bar/baz/nls/", "/", "/", "en-ca", "foo"]
    //nlsRegExp.exec("foo/bar/baz/nls/foo") gives:
    //["foo/bar/baz/nls/foo", "foo/bar/baz/nls/", "/", "/", "foo", ""]
    //so, if match[5] is blank, it means this is the top bundle definition.
    var nlsRegExp = /(^.*(^|\/)nls(\/|$))([^\/]*)\/?([^\/]*)/;

    //Helper function to avoid repeating code. Lots of arguments in the
    //desire to stay functional and support RequireJS contexts without having
    //to know about the RequireJS contexts.
    function addPart(locale, master, needed, toLoad, prefix, suffix) {
        if (master[locale]) {
            needed.push(locale);
            if (master[locale] === true || master[locale] === 1) {
                toLoad.push(prefix + locale + '/' + suffix);
            }
        }
    }

    function addIfExists(req, locale, toLoad, prefix, suffix) {
        var fullName = prefix + locale + '/' + suffix;
        if (require._fileExists(req.toUrl(fullName))) {
            toLoad.push(fullName);
        }
    }

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     * This is not robust in IE for transferring methods that match
     * Object.prototype names, but the uses of mixin here seem unlikely to
     * trigger a problem related to that.
     */
    function mixin(target, source, force) {
        var prop;
        for (prop in source) {
            if (source.hasOwnProperty(prop) && (!target.hasOwnProperty(prop) || force)) {
                target[prop] = source[prop];
            } else if (typeof source[prop] === 'object') {
                mixin(target[prop], source[prop], force);
            }
        }
    }

    define(['module'], function (module) {
        var masterConfig = module.config();

        return {
            version: '2.0.1',
            /**
             * Called when a dependency needs to be loaded.
             */
            load: function (name, req, onLoad, config) {
                config = config || {};

                if (config.locale) {
                    masterConfig.locale = config.locale;
                }

                var masterName,
                    match = nlsRegExp.exec(name),
                    prefix = match[1],
                    locale = match[4],
                    suffix = match[5],
                    parts = locale.split("-"),
                    toLoad = [],
                    value = {},
                    i, part, current = "";

                //If match[5] is blank, it means this is the top bundle definition,
                //so it does not have to be handled. Locale-specific requests
                //will have a match[4] value but no match[5]
                if (match[5]) {
                    //locale-specific bundle
                    prefix = match[1];
                    masterName = prefix + suffix;
                } else {
                    //Top-level bundle.
                    masterName = name;
                    suffix = match[4];
                    locale = masterConfig.locale;
                    if (!locale) {
                        locale = masterConfig.locale =
                            typeof navigator === "undefined" ? "root" :
                            (navigator.language ||
                             navigator.userLanguage || "root").toLowerCase();
                    }
                    parts = locale.split("-");
                }

                if (config.isBuild) {
                    //Check for existence of all locale possible files and
                    //require them if exist.
                    toLoad.push(masterName);
                    addIfExists(req, "root", toLoad, prefix, suffix);
                    for (i = 0; i < parts.length; i++) {
                        part = parts[i];
                        current += (current ? "-" : "") + part;
                        addIfExists(req, current, toLoad, prefix, suffix);
                    }

                    req(toLoad, function () {
                        onLoad();
                    });
                } else {
                    //First, fetch the master bundle, it knows what locales are available.
                    req([masterName], function (master) {
                        //Figure out the best fit
                        var needed = [],
                            part;

                        //Always allow for root, then do the rest of the locale parts.
                        addPart("root", master, needed, toLoad, prefix, suffix);
                        for (i = 0; i < parts.length; i++) {
                            part = parts[i];
                            current += (current ? "-" : "") + part;
                            addPart(current, master, needed, toLoad, prefix, suffix);
                        }

                        //Load all the parts missing.
                        req(toLoad, function () {
                            var i, partBundle, part;
                            for (i = needed.length - 1; i > -1 && needed[i]; i--) {
                                part = needed[i];
                                partBundle = master[part];
                                if (partBundle === true || partBundle === 1) {
                                    partBundle = req(prefix + part + '/' + suffix);
                                }
                                mixin(value, partBundle);
                            }

                            //All done, notify the loader.
                            onLoad(value);
                        });
                    });
                }
            }
        };
    });
}());
require([
  // Application.
  'app',

  // Main Router.
  'router',
  'linksys/env',

  //Main strings
  'i18n!nls/main',

  'DeepModel'
],

function(app, Router, env, i18n, Backbone) {

var pageHistory = [];
//create a document fragment to hold everything before the document is done loading and the full DOM is available.
var $main = $('<div class="container" />',{
  role:'main',
  id:'main'
});


dust.render('main', i18n, function(err, out) {
    var $divs;

    $main.append(out);
    $divs = $main[0].getElementsByTagName('div');
    _.each($divs,function(value){
        if($(value).attr('id') === 'viewmaster'){
            app.$main = $(value);

        }
    });
});

// once the document is ready, append the fragment to the body
$(function(){
  $('body').append($main);
});

  // Define your master router on the application namespace and trigger all
  // navigation from this instance.
  if(!window.isTest){
    app.router = new Router();
    //listen to the route event, fire an event to alert views when to teardown / remove
    app.router.on('route',function(route){
      pageHistory.push(route);
      if(pageHistory.length === 2){
        app.trigger('teardown:'+pageHistory[0]);
        pageHistory = pageHistory.slice(1,2);
      }
    });

  // Trigger the initial route and enable HTML5 History API support, set the
  // root folder to '/' by default.  Change in app.js. 
  Backbone.history.stop();
  Backbone.history.start({ pushState: false, root: app.root });
  }

  // All navigation that is relative should be passed through the navigate
  // method, to be processed by the router. If the link has a `data-bypass`
  // attribute, bypass the delegation completely.
  $(document).on('click', 'a:not([data-bypass])', function(evt) {
    // Get the absolute anchor href.
    var href = $(this).attr('href');

    // If the href exists and is a hash route, run it through Backbone.
    if (href && href.indexOf('#') === 0) {
      // Stop the default event to ensure the link will not cause a page
      // refresh.
      evt.preventDefault();

      // `Backbone.history.navigate` is sufficient for all Routers and will
      // trigger the correct events. The Router's internal `navigate` method
      // calls this anyways.  The fragment is sliced from the root.
      Backbone.history.navigate(href, true);
    }
  });

});

define([
  // Application.
  "app", "views/index", "views/error","views/selectsetup","views/smartwifi","views/enterId","views/feed",
  "views/createaccount","views/showAll","views/changePassword", "views/passwordreset","views/validateaccount",
  "views/setupsuccess"
],

function(app, index, error, selectsetup, smartwifi, enterId, feed, 
  createaccount, showAll, changePassword, passwordReset, validateAccount,setupsuccess) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({
    routes: {
      "": "index",
      "error": "error",
      "selectsetup":"selectsetup",
      "smartwifi":"smartwifi",
      "createaccount":"createaccount",
      "enterId/:path":"enterId",
      "changePassword":"changePassword",
      "showAll":"showAll",
      "feed":"feed",
      "passwordreset":"passwordreset",
      "validateaccount/:token":"validateaccount",
      "setupsuccess" : "setupsuccess"
    },
    initialize: function(){

    },
    index: function() {
        index.initialize();
    },
    error: function(){
        error.initialize();
    },
    selectsetup: function(){
        selectsetup.initialize();
    },
    smartwifi: function(){
        smartwifi.initialize();
    },
    createaccount: function(){
        createaccount.initialize();
    },
    passwordreset: function(){
      passwordReset.initialize();
    },
    enterId: function(path){
        enterId.initialize(path);
    },
    changePassword: function(){
        changePassword.initialize();
    },
    showAll: function() {
        showAll.initialize();
    },
    feed: function(){
        feed.initialize();
    },
    validateaccount: function(token){
      
        validateAccount.initialize(token);
    },
    setupsuccess : function(){
    	setupsuccess.initialize();
    }

  });


  return Router;

});

(function(){dust.register("captcha",body_0);function body_0(chk,ctx){return chk.write("<ul><li><img class=\"captcha-image\" src=\"\"></li><li><label>").reference(ctx.getPath(false,["captcha","label"]),ctx,"h").write("</label><input type=\"text\" name=\"challengeResponse\" data-validate=\"captcha.challengeResponse\" data-bind=\"captcha.challengeResponse\"><div class=\"errorBalloon\"><p class=\"errorMsg\"></p><span class=\"arrow\"></span></div><a title=\"").reference(ctx.getPath(false,["captcha","refresh"]),ctx,"h").write("\" class=\"captcha-refresh\">refresh</a></li></ul>");}return body_0;})();
(function(){dust.register("changePassword",body_0);function body_0(chk,ctx){return chk.write("<div id=\"template-change-password\" class=\"default-view\"><header id=\"headerSection\"><div class=\"headerSectWrapper\"><h1>").reference(ctx.get("cameraSetup"),ctx,"h").write("</h1></div></header><div class=\"wrapper\"><header class=\"templateHeader\"><h2>").reference(ctx.getPath(false,["changePassword","default"]),ctx,"h").write("</h2><p>").reference(ctx.getPath(false,["changePassword","subtitle"]),ctx,"h").write("</p></header><div class=\"templateContent\"><div class=\"contentLeft\"><p>").reference(ctx.getPath(false,["changePassword","description"]),ctx,"h").write("</p><h3>").reference(ctx.getPath(false,["changePassword","cameraAdminLabel"]),ctx,"h").write("</h3><ul class=\"form\"><li><label for=\"cameraPassword\">").reference(ctx.getPath(false,["changePassword","cameraPasswordLabel"]),ctx,"h").write("</label></li><li class=\"placeholder\"><label for=\"cameraPassword\">").reference(ctx.getPath(false,["changePassword","passwordPlaceholder"]),ctx,"h").write("</label><input id=\"cameraPassword\" type=\"password\" data-bind=\"password\" data-validate=\"password\" maxlength=\"64\" /><div class=\"errorBalloon\"><p class=\"errorMsg\"></p><span class=\"arrow\"></span></div></li><li><span class=\"validationHint\">").reference(ctx.getPath(false,["changePassword","validationHint"]),ctx,"h").write("</span></li></ul></div><div class=\"contentRight\"><img src=\"\" alt=\"Camera Icon\" /></div></div><footer><div class=\"leftButtons\"><button type=\"button\" class=\"cancel\">").reference(ctx.getPath(false,["buttonTitles","btnCancel"]),ctx,"h").write("</button></div><div class=\"rightButtons\"><button type=\"button\" class=\"next\">").reference(ctx.getPath(false,["buttonTitles","btnNext"]),ctx,"h").write("</button><button type=\"button\" class=\"back\">").reference(ctx.getPath(false,["buttonTitles","btnBack"]),ctx,"h").write("</button></div></footer></div></div>");}return body_0;})();
(function(){dust.register("color",body_0);function body_0(chk,ctx){return chk.write("The color is ").reference(ctx.get("red"),ctx,"h");}return body_0;})();
(function(){dust.register("createaccount-success",body_0);function body_0(chk,ctx){return chk.write("<div id=\"template-createaccount-success\"><h2 class=\"checkmark\">").reference(ctx.getPath(false,["createAccount","success","header"]),ctx,"h").write("</h2><p>").reference(ctx.getPath(false,["createAccount","success","message1"]),ctx,"h").write("</p><p>").reference(ctx.getPath(false,["createAccount","success","message2"]),ctx,"h").write("</p></div>");}return body_0;})();
(function(){dust.register("createaccount",body_0);function body_0(chk,ctx){return chk.write("<div id=\"template-createaccount\" class=\"default-view\"><header id=\"headerSection\"><div class=\"headerSectWrapper\"><h1>").reference(ctx.get("cameraSetup"),ctx,"h").write("</h1></div></header><div class=\"wrapper\"><header class=\"templateHeader\"><h2>").reference(ctx.getPath(false,["createAccount","default"]),ctx,"h").write("</h2><p>").reference(ctx.getPath(false,["createAccount","description"]),ctx,"h").write("</p></header><div class=\"templateContent\"><div class=\"contentLeft\"><p>").reference(ctx.getPath(false,["createAccount","advantages"]),ctx,"h").write("</p><ul class=\"form\"><li class=\"placeholder\"><label>").reference(ctx.getPath(false,["createAccount","firstName"]),ctx,"h").write("</label><input type=\"text\" name=\"firstName\" data-validate=\"account.firstName\" data-bind=\"account.firstName\"><div class=\"errorBalloon\"><p class=\"errorMsg\"></p><span class=\"arrow\"></span></div></li><li class=\"placeholder\"><label>").reference(ctx.getPath(false,["createAccount","lastName"]),ctx,"h").write("</label><input type=\"text\" name=\"lastName\" data-validate=\"account.lastName\" data-bind=\"account.lastName\"><div class=\"errorBalloon\"><p class=\"errorMsg\"></p><span class=\"arrow\"></span></div></li><li class=\"placeholder\"><label>").reference(ctx.getPath(false,["createAccount","password"]),ctx,"h").write("</label><input type=\"password\" name=\"password\" data-validate=\"account.password\" data-bind=\"account.password\"><div class=\"errorBalloon\"><p class=\"errorMsg\"></p><span class=\"arrow\"></span></div></li><li class=\"placeholder\"><label>").reference(ctx.getPath(false,["createAccount","passwordConfirm"]),ctx,"h").write("</label><input type=\"password\" name=\"passwordConfirm\" data-validate=\"verification.passwordConfirm\" data-bind=\"verification.passwordConfirm\"><div class=\"errorBalloon\"><p class=\"errorMsg\"></p><span class=\"arrow\"></span></div></li><li class=\"placeholder\"><label>").reference(ctx.getPath(false,["createAccount","email"]),ctx,"h").write("</label><input type=\"text\" name=\"username\" data-validate=\"account.username\" data-bind=\"account.username\"><div class=\"errorBalloon\"><p class=\"errorMsg\"></p><span class=\"arrow\"></span></div></li><li class=\"placeholder\"><label>").reference(ctx.getPath(false,["createAccount","emailConfirm"]),ctx,"h").write("</label><input type=\"text\" name=\"usernameConfirm\" data-validate=\"verification.usernameConfirm\" data-bind=\"verification.usernameConfirm\"><div class=\"errorBalloon\"><p class=\"errorMsg\"></p><span class=\"arrow\"></span></div></li><li class=\"checkbox\"><input type=\"checkbox\" name=\"acceptTerms\" data-validate=\"verification.acceptTerms\" data-bind=\"verification.acceptTerms\"><label>").reference(ctx.getPath(false,["acceptTerms","haveRead"]),ctx,"h").write(" <a href=\"#\">").reference(ctx.getPath(false,["acceptTerms","EULA"]),ctx,"h").write("</a>").reference(ctx.getPath(false,["acceptTerms","and"]),ctx,"h").write(" <a href=\"#\">").reference(ctx.getPath(false,["acceptTerms","privacyStatement"]),ctx,"h").write("</a></label></li><li class=\"checkbox\"><input type=\"checkbox\" name=\"acceptPromotions\" data-validate=\"preferences.newsletterOptIn\" data-bind=\"preferences.newsletterOptIn\"><label>").reference(ctx.get("acceptPromotions"),ctx,"h").write("</label></li></ul><div class=\"captcha\"></div></div></div><footer><div class=\"language-select leftButtons\"><select id=\"language-select\" dir=\"ltr\" data-bind=\"verification.locale\"><option value=\"id\">Bahasa Indonesia</option><option value=\"da\">Dansk</option><option value=\"de\">Deutsch</option><option value=\"en-US\">English (United States)</option><option value=\"es-ar\">Español (Argentina)</option><option value=\"es\">Español (España)</option><option value=\"fr\">Français (France)</option><option value=\"fr-CA\">Français (Canada)</option><option value=\"it\">Italiano</option><option value=\"nl\">Nederlands</option><option value=\"nb\">Norsk (bokmål)</option><option value=\"pl\">Polski</option><option value=\"pt\">Português (Brasil)</option><option value=\"pt-PT\">Português (Portugal)</option><option value=\"fi\">Suomi</option><option value=\"sv\">Svenska</option><option value=\"vi\">Tiếng Việt Nam</option><option value=\"tr\">Türkçe</option><option value=\"el\">Ελληνικά</option><option value=\"ru\">Русский</option><option value=\"ar\" dir=\"rtl\">العربية</option><option value=\"th\">ไทย</option></select></div><div class=\"rightButtons\"><button type=\"submit\" class=\"save\">").reference(ctx.getPath(false,["buttonTitles","btnAccount"]),ctx,"h").write("</button></div></footer></div></div>");}return body_0;})();
(function(){dust.register("enterId",body_0);function body_0(chk,ctx){return chk.write("<div id=\"template-enterId\" class=\"default-view\"><header id=\"headerSection\"><div class=\"headerSectWrapper\"><h1>").reference(ctx.get("cameraSetup"),ctx,"h").write("</h1></div></header><div class=\"wrapper\"><header class=\"templateHeader\"><h2>").reference(ctx.getPath(false,["enterId","default"]),ctx,"h").write("</h2></header><div class=\"templateContent\"><div class=\"contentLeft\"><p>").reference(ctx.getPath(false,["enterId","description"]),ctx,"h").write("</p><div class=\"contentBox\"><ul class=\"form\"><li class=\"cameraIdInput\"><label>").reference(ctx.getPath(false,["enterId","enterIdLabel"]),ctx,"h").write("</label><input type=\"text\" id=\"cameraId\" name=\"cameraId\" data-validate=\"camera.cameraId\" data-bind=\"camera.cameraId\" /><div class=\"errorBalloon\"><p class=\"errorMsg\"></p><span class=\"arrow\"></span></div><div class=\"validateCameraID\"></div></li><li><span class=\"validationHint\">").reference(ctx.getPath(false,["enterId","enterIdExample"]),ctx,"h").write("</span></li></ul></div></div><div class=\"contentRight\"><img src=\"\" alt=\"Camera Image\" class=\"cameraImage\" /></div></div><footer><div class=\"leftButtons\"><button type=\"button\" class=\"cancel\">").reference(ctx.getPath(false,["buttonTitles","btnCancel"]),ctx,"h").write("</button></div><div class=\"rightButtons\"><button type=\"button\" class=\"next\">").reference(ctx.getPath(false,["buttonTitles","btnNext"]),ctx,"h").write("</button><button type=\"button\" class=\"back\">").reference(ctx.getPath(false,["buttonTitles","btnBack"]),ctx,"h").write("</button></div></footer></div></div>");}return body_0;})();
(function(){dust.register("index",body_0);function body_0(chk,ctx){return chk.write("<header id=\"headerSection\"><div class=\"headerSectWrapper\"><h1>").reference(ctx.get("cameraTitle"),ctx,"h").write("</h1></div></header><div class=\"wrapper\"><div class=\"viewHeader\"><h2>").reference(ctx.get("cameraTitle"),ctx,"h").write("</h2></div><div class=\"viewContent\">EULA STUFF GOES HERE</div></div>");}return body_0;})();
(function(){dust.register("main",body_0);function body_0(chk,ctx){return chk.write("<!-- put the outer template here, everything will load into viewmaster --><div id=\"viewmaster\"></div><fieldset class=\"debugInputs\"><legend>Debug Only</legend><label>Session Token</label><input id=\"sessionToken\" type=\"text\" /><br/><label>Camera IP (xx.xx.xx.xx)</label><input id=\"cameraIp\" type=\"text\" /></fieldset><!-- put the outer template here, everything will load into viewmaster -->");}return body_0;})();
(function(){dust.register("modal",body_0);function body_0(chk,ctx){return chk.write("<div class=\"modal hide fade ").reference(ctx.get("type"),ctx,"h").write("\" id=\"").reference(ctx.get("id"),ctx,"h").write("\"><div class=\"modal-header ").reference(ctx.get("showHeader"),ctx,"h").write("\"><button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\"></button><h2>").reference(ctx.getPath(false,["header","title"]),ctx,"h").write("</h2></div><div class=\"modal-body\"><h3>").reference(ctx.getPath(false,["body","title"]),ctx,"h").write("</h3><p>").reference(ctx.getPath(false,["body","message"]),ctx,"h").write("</p></div><div class=\"modal-footer\"><button class=\"btn\" data-dismiss=\"modal\" aria-hidden=\"true\">").reference(ctx.getPath(false,["footer","btnTitle"]),ctx,"h").write("</button></div></div>");}return body_0;})();
(function(){dust.register("passwordreset",body_0);function body_0(chk,ctx){return chk.write("<div id=\"template-passwordreset\" class=\"default-view\"><header id=\"headerSection\"><div class=\"headerSectWrapper\"><h1>").reference(ctx.get("cameraSetup"),ctx,"h").write("</h1></div></header><div class=\"wrapper\"><header class=\"templateHeader\"><h2>").reference(ctx.getPath(false,["createAccount","default"]),ctx,"h").write("</h2><p>").reference(ctx.getPath(false,["createAccount","description"]),ctx,"h").write("</p></header><div class=\"templateContent\"><div class=\"contentLeft\"><p>").reference(ctx.getPath(false,["createAccount","advantages"]),ctx,"h").write("</p><ul class=\"form\"><li class=\"placeholder\"><label>").reference(ctx.getPath(false,["createAccount","email"]),ctx,"h").write("</label><input type=\"text\" name=\"username\" data-validate=\"username\" data-bind=\"username\"><div class=\"errorBalloon\"><p class=\"errorMsg\"></p><span class=\"arrow\"></span></div></li></ul><div class=\"captcha\"></div></div></div><footer><div class=\"rightButtons\"><button type=\"submit\" class=\"save\">").reference(ctx.getPath(false,["buttonTitles","btnAccount"]),ctx,"h").write("</button></div></footer></div></div>");}return body_0;})();
(function(){dust.register("selectsetup",body_0);function body_0(chk,ctx){return chk.write("<header id=\"headerSection\"><div class=\"headerSectWrapper\"><h1>").reference(ctx.get("cameraTitle"),ctx,"h").write("</h1></div></header><div class=\"wrapper\"><div class=\"viewHeader\"><h2>").reference(ctx.get("cameraTitle"),ctx,"h").write("</h2><p>").reference(ctx.get("optionsDescription"),ctx,"h").write("</p><span class=\"closeView\">X</span></div><div class=\"viewContent\"><div class=\"viewBox\"><div class=\"viewColumn\"><p>").reference(ctx.getPath(false,["setupOptions","smartwifi"]),ctx,"h").write("</p><h3>").reference(ctx.getPath(false,["setupOptions","benefits","default"]),ctx,"h").write("</h3><ul class=\"default-list\"><li>").reference(ctx.getPath(false,["setupOptions","benefits","benefit1"]),ctx,"h").write("</li><li>").reference(ctx.getPath(false,["setupOptions","benefits","benefit2"]),ctx,"h").write("</li><li>").reference(ctx.getPath(false,["setupOptions","benefits","benefit3"]),ctx,"h").write("</li></ul></div><img class=\"cameraIcon\" src=\"\" alt=\"\" /><a class=\"button\" href=\"#smartwifi\">").reference(ctx.getPath(false,["buttonTitles","btnOption"]),ctx,"h").write("</a></div><div class=\"viewBox hasColumns\"><div class=\"column\"><p>").reference(ctx.getPath(false,["setupOptions","local","default"]),ctx,"h").write(" <span>").reference(ctx.getPath(false,["setupOptions","local","smallMsj"]),ctx,"h").write("</span></p><a class=\"button\" href=\"#enterId/local\">").reference(ctx.getPath(false,["buttonTitles","btnOption"]),ctx,"h").write("</a></div><div class=\"column\"><p>").reference(ctx.getPath(false,["setupOptions","thirdParty","default"]),ctx,"h").write(" <span>").reference(ctx.getPath(false,["setupOptions","thirdParty","smallMsj"]),ctx,"h").write("</span></p><a class=\"button\" href=\"#enterId/thirdParty\">").reference(ctx.getPath(false,["buttonTitles","btnOption"]),ctx,"h").write("</a></div></div></div></div>");}return body_0;})();
(function(){dust.register("setupsuccess",body_0);function body_0(chk,ctx){return chk.write("<div id=\"template-setupsuccess\" class=\"default-view\"><header id=\"headerSection\"><div class=\"headerSectWrapper\"><h1>").reference(ctx.get("cameraSetup"),ctx,"h").write("</h1></div></header> <div class=\"wrapper\"><header class=\"templateHeader\"><h2>").reference(ctx.getPath(false,["setupSuccess","default"]),ctx,"h").write("</h2></header><div class=\"templateContent\"><p>").reference(ctx.getPath(false,["setupSuccess","description"]),ctx,"h").write("</p><div class=\"contentLeft\"><div class=\"contentBox\"><ul class=\"form\"><li class=\"cameraIdInput\"><label>").reference(ctx.getPath(false,["setupSuccess","cameraIDLabel"]),ctx,"h").write("</label><span class=\"cameraID\"></span></li><li><label>").reference(ctx.getPath(false,["setupSuccess","cameraPasswordLabel"]),ctx,"h").write("</label><span class=\"cameraPassword\"></span></li></ul></div></div><div class=\"contentRight\"><img src=\"\" alt=\"Camera Image\" class=\"cameraImage\" /></div><div class=\"contentBottom\"><h3>").reference(ctx.getPath(false,["setupSuccess","notesTitle"]),ctx,"h").write("</h3><p>").reference(ctx.getPath(false,["setupSuccess","notes"]),ctx,"h").write("</p></div></div><footer><div class=\"leftButtons\"></div><div class=\"rightButtons\"><button type=\"button\" class=\"viewCameraFeed\">").reference(ctx.getPath(false,["buttonTitles","viewCameraFeed"]),ctx,"h").write("</button></div></footer></div></div>");}return body_0;})();
(function(){dust.register("showAll",body_0);function body_0(chk,ctx){return chk.write("<div class=\"wrapper\"><div class=\"viewHeader\"><h2>Show all pages - DEBUG only</h2></div><div class=\"viewContent\"><ul id=\"pages\"></ul></div></div>");}return body_0;})();
(function(){dust.register("smartwifi",body_0);function body_0(chk,ctx){return chk.write("<div id=\"template-smartwifi\" class=\"default-view\"><header id=\"headerSection\"><div class=\"headerSectWrapper\"><h1>").reference(ctx.get("cameraSetup"),ctx,"h").write("</h1></div></header><div class=\"wrapper\"><header class=\"templateHeader\"><h2>").reference(ctx.getPath(false,["createAccount","default"]),ctx,"h").write("</h2></header><div class=\"templateContent\"><div class=\"templateBox\"><h3>").reference(ctx.getPath(false,["createAccount","newUser"]),ctx,"h").write("</h3><div class=\"contentBox tableCell\"><p>").reference(ctx.getPath(false,["createAccount","noAccount"]),ctx,"h").write(" <a href=\"#createaccount\">").reference(ctx.getPath(false,["linkTitles","clickHere"]),ctx,"h").write("</a></p></div></div><span class=\"boxSeparator\"></span><div class=\"templateBox\"><h3>").reference(ctx.getPath(false,["createAccount","sigInTitle"]),ctx,"h").write("</h3><div class=\"contentBox\"><form><fieldset><ul><li class=\"placeholder\"><label>").reference(ctx.getPath(false,["createAccount","email"]),ctx,"h").write("</label><input type=\"text\" name=\"username\" data-validate=\"session.account.username\" data-bind=\"session.account.username\"><div class=\"errorBalloon\"><p class=\"errorMsg\"></p><span class=\"arrow\"></span></div></li><li class=\"placeholder\"><label>").reference(ctx.getPath(false,["createAccount","password"]),ctx,"h").write("</label><input type=\"password\" name=\"password\" data-validate=\"session.account.password\" data-bind=\"session.account.password\"><div class=\"errorBalloon\"><p class=\"errorMsg\"></p><span class=\"arrow\"></span></div></li><li><a href=\"#passwordreset\">").reference(ctx.getPath(false,["linkTitles","forgot"]),ctx,"h").write("</a></li><li><button type=\"submit\" class=\"save\">").reference(ctx.getPath(false,["buttonTitles","btnSignIn"]),ctx,"h").write("</button></li></ul></fieldset></form></div></div></div><footer></footer></div></div>");}return body_0;})();
(function(){dust.register("validateaccount",body_0);function body_0(chk,ctx){return chk.write("<div id=\"template-validateaccount\" class=\"default-view\"><header id=\"headerSection\"><div class=\"headerSectWrapper\"><h1>").reference(ctx.get("cameraSetup"),ctx,"h").write("</h1></div></header><div class=\"wrapper\"><button type=\"submit\" class=\"btnAccept\">accept</button></div></div>");}return body_0;})();
/**
 * @license RequireJS text 2.0.5 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/text for details
 */
/*jslint regexp: true */
/*global require: false, XMLHttpRequest: false, ActiveXObject: false,
  define: false, window: false, process: false, Packages: false,
  java: false, location: false */

define(['module'], function (module) {
    'use strict';

    var text, fs,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,
        bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,
        hasLocation = typeof location !== 'undefined' && location.href,
        defaultProtocol = hasLocation && location.protocol && location.protocol.replace(/\:/, ''),
        defaultHostName = hasLocation && location.hostname,
        defaultPort = hasLocation && (location.port || undefined),
        buildMap = [],
        masterConfig = (module.config && module.config()) || {};

    text = {
        version: '2.0.5',

        strip: function (content) {
            //Strips <?xml ...?> declarations so that external SVG and XML
            //documents can be added to a document without worry. Also, if the string
            //is an HTML document, only the part inside the body tag is returned.
            if (content) {
                content = content.replace(xmlRegExp, "");
                var matches = content.match(bodyRegExp);
                if (matches) {
                    content = matches[1];
                }
            } else {
                content = "";
            }
            return content;
        },

        jsEscape: function (content) {
            return content.replace(/(['\\])/g, '\\$1')
                .replace(/[\f]/g, "\\f")
                .replace(/[\b]/g, "\\b")
                .replace(/[\n]/g, "\\n")
                .replace(/[\t]/g, "\\t")
                .replace(/[\r]/g, "\\r")
                .replace(/[\u2028]/g, "\\u2028")
                .replace(/[\u2029]/g, "\\u2029");
        },

        createXhr: masterConfig.createXhr || function () {
            //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
            var xhr, i, progId;
            if (typeof XMLHttpRequest !== "undefined") {
                return new XMLHttpRequest();
            } else if (typeof ActiveXObject !== "undefined") {
                for (i = 0; i < 3; i += 1) {
                    progId = progIds[i];
                    try {
                        xhr = new ActiveXObject(progId);
                    } catch (e) {}

                    if (xhr) {
                        progIds = [progId];  // so faster next time
                        break;
                    }
                }
            }

            return xhr;
        },

        /**
         * Parses a resource name into its component parts. Resource names
         * look like: module/name.ext!strip, where the !strip part is
         * optional.
         * @param {String} name the resource name
         * @returns {Object} with properties "moduleName", "ext" and "strip"
         * where strip is a boolean.
         */
        parseName: function (name) {
            var modName, ext, temp,
                strip = false,
                index = name.indexOf("."),
                isRelative = name.indexOf('./') === 0 ||
                             name.indexOf('../') === 0;

            if (index !== -1 && (!isRelative || index > 1)) {
                modName = name.substring(0, index);
                ext = name.substring(index + 1, name.length);
            } else {
                modName = name;
            }

            temp = ext || modName;
            index = temp.indexOf("!");
            if (index !== -1) {
                //Pull off the strip arg.
                strip = temp.substring(index + 1) === "strip";
                temp = temp.substring(0, index);
                if (ext) {
                    ext = temp;
                } else {
                    modName = temp;
                }
            }

            return {
                moduleName: modName,
                ext: ext,
                strip: strip
            };
        },

        xdRegExp: /^((\w+)\:)?\/\/([^\/\\]+)/,

        /**
         * Is an URL on another domain. Only works for browser use, returns
         * false in non-browser environments. Only used to know if an
         * optimized .js version of a text resource should be loaded
         * instead.
         * @param {String} url
         * @returns Boolean
         */
        useXhr: function (url, protocol, hostname, port) {
            var uProtocol, uHostName, uPort,
                match = text.xdRegExp.exec(url);
            if (!match) {
                return true;
            }
            uProtocol = match[2];
            uHostName = match[3];

            uHostName = uHostName.split(':');
            uPort = uHostName[1];
            uHostName = uHostName[0];

            return (!uProtocol || uProtocol === protocol) &&
                   (!uHostName || uHostName.toLowerCase() === hostname.toLowerCase()) &&
                   ((!uPort && !uHostName) || uPort === port);
        },

        finishLoad: function (name, strip, content, onLoad) {
            content = strip ? text.strip(content) : content;
            if (masterConfig.isBuild) {
                buildMap[name] = content;
            }
            onLoad(content);
        },

        load: function (name, req, onLoad, config) {
            //Name has format: some.module.filext!strip
            //The strip part is optional.
            //if strip is present, then that means only get the string contents
            //inside a body tag in an HTML string. For XML/SVG content it means
            //removing the <?xml ...?> declarations so the content can be inserted
            //into the current doc without problems.

            // Do not bother with the work if a build and text will
            // not be inlined.
            if (config.isBuild && !config.inlineText) {
                onLoad();
                return;
            }

            masterConfig.isBuild = config.isBuild;

            var parsed = text.parseName(name),
                nonStripName = parsed.moduleName +
                    (parsed.ext ? '.' + parsed.ext : ''),
                url = req.toUrl(nonStripName),
                useXhr = (masterConfig.useXhr) ||
                         text.useXhr;

            //Load the text. Use XHR if possible and in a browser.
            if (!hasLocation || useXhr(url, defaultProtocol, defaultHostName, defaultPort)) {
                text.get(url, function (content) {
                    text.finishLoad(name, parsed.strip, content, onLoad);
                }, function (err) {
                    if (onLoad.error) {
                        onLoad.error(err);
                    }
                });
            } else {
                //Need to fetch the resource across domains. Assume
                //the resource has been optimized into a JS module. Fetch
                //by the module name + extension, but do not include the
                //!strip part to avoid file system issues.
                req([nonStripName], function (content) {
                    text.finishLoad(parsed.moduleName + '.' + parsed.ext,
                                    parsed.strip, content, onLoad);
                });
            }
        },

        write: function (pluginName, moduleName, write, config) {
            if (buildMap.hasOwnProperty(moduleName)) {
                var content = text.jsEscape(buildMap[moduleName]);
                write.asModule(pluginName + "!" + moduleName,
                               "define(function () { return '" +
                                   content +
                               "';});\n");
            }
        },

        writeFile: function (pluginName, moduleName, req, write, config) {
            var parsed = text.parseName(moduleName),
                extPart = parsed.ext ? '.' + parsed.ext : '',
                nonStripName = parsed.moduleName + extPart,
                //Use a '.js' file name so that it indicates it is a
                //script that can be loaded across domains.
                fileName = req.toUrl(parsed.moduleName + extPart) + '.js';

            //Leverage own load() method to load plugin value, but only
            //write out values that do not have the strip argument,
            //to avoid any potential issues with ! in file names.
            text.load(nonStripName, req, function (value) {
                //Use own write() method to construct full module value.
                //But need to create shell that translates writeFile's
                //write() to the right interface.
                var textWrite = function (contents) {
                    return write(fileName, contents);
                };
                textWrite.asModule = function (moduleName, contents) {
                    return write.asModule(moduleName, fileName, contents);
                };

                text.write(pluginName, nonStripName, textWrite, config);
            }, config);
        }
    };

    if (masterConfig.env === 'node' || (!masterConfig.env &&
            typeof process !== "undefined" &&
            process.versions &&
            !!process.versions.node)) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');

        text.get = function (url, callback) {
            var file = fs.readFileSync(url, 'utf8');
            //Remove BOM (Byte Mark Order) from utf8 files if it is there.
            if (file.indexOf('\uFEFF') === 0) {
                file = file.substring(1);
            }
            callback(file);
        };
    } else if (masterConfig.env === 'xhr' || (!masterConfig.env &&
            text.createXhr())) {
        text.get = function (url, callback, errback, headers) {
            var xhr = text.createXhr(), header;
            xhr.open('GET', url, true);

            //Allow plugins direct access to xhr headers
            if (headers) {
                for (header in headers) {
                    if (headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header.toLowerCase(), headers[header]);
                    }
                }
            }

            //Allow overrides specified in config
            if (masterConfig.onXhr) {
                masterConfig.onXhr(xhr, url);
            }

            xhr.onreadystatechange = function (evt) {
                var status, err;
                //Do not explicitly handle errors, those should be
                //visible via console output in the browser.
                if (xhr.readyState === 4) {
                    status = xhr.status;
                    if (status > 399 && status < 600) {
                        //An http 4xx or 5xx error. Signal an error.
                        err = new Error(url + ' HTTP status: ' + status);
                        err.xhr = xhr;
                        errback(err);
                    } else {
                        callback(xhr.responseText);
                    }
                }
            };
            xhr.send(null);
        };
    } else if (masterConfig.env === 'rhino' || (!masterConfig.env &&
            typeof Packages !== 'undefined' && typeof java !== 'undefined')) {
        //Why Java, why is this so awkward?
        text.get = function (url, callback) {
            var stringBuffer, line,
                encoding = "utf-8",
                file = new java.io.File(url),
                lineSeparator = java.lang.System.getProperty("line.separator"),
                input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
                content = '';
            try {
                stringBuffer = new java.lang.StringBuffer();
                line = input.readLine();

                // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
                // http://www.unicode.org/faq/utf_bom.html

                // Note that when we use utf-8, the BOM should appear as "EF BB BF", but it doesn't due to this bug in the JDK:
                // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
                if (line && line.length() && line.charAt(0) === 0xfeff) {
                    // Eat the BOM, since we've already found the encoding on this file,
                    // and we plan to concatenating this buffer with others; the BOM should
                    // only appear at the top of a file.
                    line = line.substring(1);
                }

                stringBuffer.append(line);

                while ((line = input.readLine()) !== null) {
                    stringBuffer.append(lineSeparator);
                    stringBuffer.append(line);
                }
                //Make sure we return a JavaScript string and not a Java string.
                content = String(stringBuffer.toString()); //String
            } finally {
                input.close();
            }
            callback(content);
        };
    }

    return text;
});