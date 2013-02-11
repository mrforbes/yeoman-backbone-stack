require({
  // !! Testacular serves files from '/base'
  deps: ['app','main'],
  baseUrl: '/base/app/scripts'
}, [
/* test runners go in here */
'../../test/spec/example',
'../../test/spec/i18n',
'../../test/spec/router',
'../../test/spec/index'
], function() {
  window.__testacular__.start();
});