require([
  // Application.
  "app",

  // Main Router.
  "router",

  //Main template
  'text!../templates/main.html',

  //Main strings
  'i18n!../nls/main'
],

function(app, Router, template, i18n) {

var compiled = dust.compile(template, 'main');
dust.loadSource(compiled);


//create a document fragment to hold everything before the document is done loading and the full DOM is available.
var $main = $('<div class="container" />',{
  role:"main",
  id:"main"
});



dust.render('main', i18n, function(err, out) {
    var $divs;
    $main.append(out);

    $divs = $main[0].getElementsByTagName('div');
    _.each($divs,function(value,index){
        if($(value).attr('id') === 'viewmaster'){
            app.$main = $(value);
        }
    });
    
});

 
// once the document is ready, append the fragment to the body
$(function(){
  $('body').append(app.$main);
});

  // Define your master router on the application namespace and trigger all
  // navigation from this instance.
  app.router = new Router();

  // Trigger the initial route and enable HTML5 History API support, set the
  // root folder to '/' by default.  Change in app.js.
  Backbone.history.stop();
  Backbone.history.start({ pushState: true, root: app.root });

  // All navigation that is relative should be passed through the navigate
  // method, to be processed by the router. If the link has a `data-bypass`
  // attribute, bypass the delegation completely.
  $(document).on("click", "a:not([data-bypass])", function(evt) {
    // Get the absolute anchor href.
    var href = $(this).attr("href");

    // If the href exists and is a hash route, run it through Backbone.
    if (href && href.indexOf("#") === 0) {
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
