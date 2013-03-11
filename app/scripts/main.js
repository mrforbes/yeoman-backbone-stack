require([
    // Application.
    'app',

    // Main Router.
    'router',
   

    //Main strings
    'i18n!nls/main',

    'DeepModel'
],
function(app, Router, i18n, Backbone) {

    'use strict';

    var pageHistory = [];
    //create a document fragment to hold everything before the document is done loading and the full DOM is available.
    var $main = $('<div class="container" />', {
        role: 'main',
        id: 'main'
    });


    dust.render('main', i18n, function(err, out) {
        var $divs;

        $main.append(out);
        $divs = $main[0].getElementsByTagName('div');
        _.each($divs, function(value) {
            if ($(value).attr('id') === 'viewmaster') {
                app.$main = $(value);
                //<debug>
                
                //</debug>
            }
        });
    });

    // once the document is ready, append the fragment to the body
    $(function() {
        $('body').append($main);

        function setOrientation() {
            if (window.orientation === -90 || window.orientation === 90) {
                $('body').addClass('landscape').removeClass('portrait');
            }
            else {
                $('body').addClass('portrait').removeClass('landscape');
            }
        }

        if ($('html').hasClass('touch')) { //Modernizr class
            setOrientation();
            window.onorientationchange = setOrientation;
        }
    });

    // Define your master router on the application namespace and trigger all
    // navigation from this instance.
    if (!window.isTest) {
        app.router = new Router();
        //listen to the route event, fire an event to alert views when to teardown / remove
        app.router.on('route', function(route) {
            pageHistory.push(route);
            if (pageHistory.length === 2) {
                app.trigger('teardown:' + pageHistory[0]);
                pageHistory = pageHistory.slice(1, 2);
            }
        });

        // Trigger the initial route and enable HTML5 History API support, set the
        // root folder to '/' by default.  Change in app.js.
        Backbone.history.stop();
        Backbone.history.start({
            pushState: false,
            root: app.root
        });
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