window.isTest = true;
require({
  // !! Testacular serves files from '/base'
  baseUrl: '/base/app/scripts'
}, [
/* test runners go in here */
'../../test/spec/i18n'
], function() {
  window.__testacular__.start();
});