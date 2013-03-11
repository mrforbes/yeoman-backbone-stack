// Testacular configuration
// Generated on Tue Feb 05 2013 15:36:30 GMT-0800 (PST)


// base path, that will be used to resolve files and exclude
basePath = '';


// list of files / patterns to load in the browser
files = [
  MOCHA,
  MOCHA_ADAPTER,
  REQUIRE,
  REQUIRE_ADAPTER,
  'app/scripts/plugins/dust.core.1.2.0.js', 
  'app/scripts/templates.js',
  'app/scripts/config.js',
  {pattern: 'test/lib/chai.js', included: false},
  {pattern: 'test/lib/sinon.js', included: false},
  {pattern: 'app/nls/*', included: false},
  {pattern: 'app/nls/**/*', included: false},
  {pattern: 'app/templates/*', included: false},
  {pattern: 'app/scripts/*.js', included: false},
  {pattern: 'app/scripts/views/*.js', included: false},
  {pattern: 'app/scripts/libs/*.js', included: false},
  {pattern: 'app/scripts/plugins/*.js', included: false},
  {pattern: 'test/spec/*.js', included: false},
  {pattern: 'test/spec/**/*.js', included: false},
  {pattern: 'test/lib/mockjax/*.js', included: false},
  'test/test-main.js'
];


// list of files to exclude
exclude = [
  
];


// test results reporter to use
// possible values: 'dots', 'progress', 'junit'
reporters = ['progress'];


// web server port
port = 9876;


// cli runner port
runnerPort = 9100;


// enable / disable colors in the output (reporters and logs)
colors = true;


// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;


// enable / disable watching file and executing tests whenever any file changes
autoWatch = false;


// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
browsers = ['Chrome'];


// If browser does not capture in given timeout [ms], kill it
captureTimeout = 60000;


// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = false;
