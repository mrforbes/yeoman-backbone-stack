var mockjaxDefaults = $.extend({}, $.mockjaxSettings);

function noErrorCallbackExpected() {
    ok( false, 'Error callback executed');
}

// Speed up our tests
$.mockjaxSettings.responseTime = 0;

module('Core');
test('Return XMLHttpRequest object from $.ajax', function() {
    $.mockjax({
        url: '/xmlhttprequest',
        responseText: "Hello Word"
    });

    var xhr = $.ajax({
        url: '/xmlhttprequest',
        complete: function() { }
    });
    xhr && xhr.abort && xhr.abort();

    ok(xhr, "XHR object is not null or undefined");
    if (jQuery.Deferred) {
        ok(xhr.done && xhr.fail, "Got Promise methods");
    }

    $.mockjaxClear();
});
asyncTest('Intercept and proxy (sub-ajax request)', function() {
    $.mockjax({
        url: '/proxy',
        proxy: 'test_proxy.json'
    });

    $.ajax({
        url: '/proxy',
        dataType: 'json',
        success: function(json) {
            ok(json && json.proxy, 'Proxy request succeeded');
        },
        error: noErrorCallbackExpected,
        complete: function() {
            start();
        }
    });

    $.mockjaxClear();
});

asyncTest('Proxy type specification', function() {
    $.mockjax({
        url: '/proxy',
        proxy: 'test_proxy.json',
        proxyType: 'GET'
    });

    $.ajax({
        url: '/proxy',
        error: noErrorCallbackExpected,
        dataType: 'json',
        success: function(json) {
            ok(json && json.proxy, 'Proxy request succeeded');
        },
        complete: function() {
            start();
        }
    });

    $.mockjaxClear();
});

asyncTest('Support 1.5 $.ajax(url, settings) signature.', function() {
    $.mockjax({
        url: '/resource',
        responseText: 'Hello Word'
    });

    $.ajax('/resource', {
        success: function(response) {
            equal(response, 'Hello Word');
        },
        error: noErrorCallbackExpected,
        complete: function() {
            start();
        }
    });

    $.mockjaxClear();
});

asyncTest('Dynamic response callback', function() {
    $.mockjax({
        url: '/response-callback',
        response: function(settings) {
            this.responseText = settings.data.response + ' 2';
        }
    });

    $.ajax({
        url: '/response-callback',
        dataType: 'text',
        data: {
            response: 'Hello world'
        },
        error: noErrorCallbackExpected,
        complete: function(xhr) {
            equals(xhr.responseText, 'Hello world 2', 'Response Text matches');
            start();
        }
    });

    $.mockjaxClear();
});


asyncTest('Dynamic response status callback', function() {
    $.mockjax({
        url: '/response-callback',
        response: function(settings) {
            this.status = 500;
            this.statusText = "Internal Server Error"
        }
    });

    $.ajax({
        url: '/response-callback',
        dataType: 'text',
        data: {
            response: 'Hello world'
        },
        error: function(){ 
            ok(true, "error callback was called"); 
        },
        complete: function(xhr) {
            equals(xhr.status, 500, 'Dynamically set response status matches');

            if( $.fn.jquery !== '1.5.2') {
                // This assertion fails in 1.5.2 due to this bug: http://bugs.jquery.com/ticket/9854
                // The statusText is being modified internally by jQuery in 1.5.2
                equals(xhr.statusText, "Internal Server Error", 'Dynamically set response statusText matches');
            }

            start();
        }
    });

    $.mockjaxClear();
});

asyncTest('Default Response Settings', function() {
    $.mockjax({
        url: '/response-callback'
    });

    $.ajax({
        url: '/response-callback',
        dataType: 'text',
        data: {
            response: ''
        },
        complete: function(xhr) {
            equals(xhr.status, 200, 'Response status matches default');

            if( $.fn.jquery !== '1.5.2') {
                // This assertion fails in 1.5.2 due to this bug: http://bugs.jquery.com/ticket/9854
                // The statusText is being modified internally by jQuery in 1.5.2
                equals(xhr.statusText, "OK", 'Response statusText matches default');
            }

            equals(xhr.responseText.length, 0, 'responseText length should be 0');
            equals(xhr.responseXml === undefined, true, 'responseXml should be undefined');
            start();
        }
    });

    $.mockjaxClear();
});

test('Remove mockjax definition by id', function() {
    var id = $.mockjax({
        url: '/test',
        contentType: 'text/plain',
        responseText: 'test'
    });

    $.mockjax({
        url: '*',
        contentType: 'text/plain',
        responseText: 'default'
    });

    stop();
    $.ajax({
        url: '/test',
        success: function(text) {
            equals(text, 'test', 'Test handler responded');
        },
        error: noErrorCallbackExpected,
        complete: function() {
            $.mockjaxClear(id);

            // Reissue the request expecting the default handler
            $.ajax({
                url: '/test',
                success: function(text) {
                    equals(text, 'default', 'Default handler responded');
                },
                error: noErrorCallbackExpected,
                complete: function(xhr) {
                    equals(xhr.responseText, 'default', 'Default handler responded');

                    $.mockjaxClear();
                    start();
                }
            });
        }
    });
});
// asyncTest('Intercept log messages', function() {
//     var msg = null;
//     $.mockjaxSettings.log = function(inMsg, settings) {
//         msg = inMsg;
//     };
//     $.mockjax({
//         url: '*'
//     });
//     $.ajax({
//         url: '/console',
//         type: 'GET',
//         complete: function() {
//             equals(msg, 'MOCK GET: /console', 'Mock request logged to console');
//             $.mockjaxClear();
//             start();
//         }
//     });
// });
asyncTest('Disable console logging', function() {
    var msg = null;
    $.mockjaxSettings.console = false;
    $.mockjax({
        url: '*'
    });
    $.ajax({
        url: '/console',
        complete: function() {
            equals(msg, null, 'Mock request not logged');
            $.mockjaxClear();
            start();
        }
    });
});

// These tests is only relevant in 1.5.2 and higher
if( jQuery.Deferred ) {
    asyncTest('Preserve context when set in jsonp ajax requet', function(){
            $.mockjax({
                    url: '/jsonp*',
                    contentType: 'text/json',
                    proxy: 'test_jsonp.js'
            });

            window.abcdef123456 = function(json) {};
            var cxt = {context: 'context'};

            $.ajax({
                    url: '/jsonp?callback=?',
                    jsonpCallback: 'abcdef123456',
                    dataType: 'jsonp',
                    error: noErrorCallbackExpected,
                    context: cxt})
                .done(function(){
                    deepEqual(this, cxt, 'this is equal to context object');
                    start();
                });
            $.mockjaxClear();
    });
    
    asyncTest('Validate this is the $.ajax object if context is not set', function(){
            $.mockjax({
                    url: '/jsonp*',
                    contentType: 'text/json',
                    proxy: 'test_jsonp.js'
            });

            window.abcdef123456 = function(json) {};

            var ret = $.ajax({
                    url: '/jsonp?callback=?',
                    jsonpCallback: 'abcdef123456',
                    dataType: 'jsonp',
                    error: noErrorCallbackExpected
                })
                .done(function(){
                    ok(this.jsonp, '\'this\' is the $.ajax object for this request.');
                    start();
                });
            var settings = $.ajaxSettings;
            $.mockjaxClear();
    });
}

module('Request Property Inspection');
test('Inspecting $.mockjax.handler(id) after request has fired', function() {
  var ID = $.mockjax({
    url: '/mockjax_properties',
    responseText: "Hello Word"
  });

  var xhr = $.ajax({
      url: '/mockjax_properties',
      complete: function() {}
  });

  ok($.mockjax.handler(ID).fired, "Sets the mock's fired property to true");

  $.mockjaxClear();
});

module('Type Matching');
asyncTest('Case-insensitive matching for request types', function() {
    $.mockjax({
        url: '/case_insensitive_match',
        type: 'GET',
        responseText: 'uppercase type response'
    });

    $.ajax({
        url: '/case_insensitive_match',
        type: 'get',
        error: noErrorCallbackExpected,
        complete: function(xhr) {
            equals(xhr.responseText, 'uppercase type response', 'Request matched regardless of case');
            start();
        }
    });

    $.mockjaxClear();
});

module('URL Matching');
asyncTest('Exact string', function() {
    $.mockjax({
        url: '/exact/string',
        responseText: 'exact string'
    });
    $.mockjax({
        url: '*',
        responseText: 'catch all'
    });

    $.ajax({
        url: '/exact/string',
        error: noErrorCallbackExpected,
        complete: function(xhr) {
            equals(xhr.responseText, 'exact string', 'Exact string url match');
            start();
        }
    });

    $.mockjaxClear();
});
test('Wildcard match', 4, function() {
    function mock(mockUrl, url, response) {
        $.mockjax({
            url: mockUrl,
            responseText: response
        });
        $.ajax({
            async: false,
            url: url,
            error: noErrorCallbackExpected,
            complete: function(xhr) {
                equals(xhr.responseText, response);
            }
        });
    }
    mock('/wildcard*w', '/wildcard/123456/w', 'w');
    mock('/wildcard*x', '/wildcard/123456/x', 'x');
    mock('*y', '/wildcard/123456/y', 'y');
    mock('z*', 'z/wildcard/123456', 'z');

    $.mockjaxClear();
});
asyncTest('RegEx match', 1, function() {
    $.mockjax({
        url: /^\/regex-([0-9]+)/i,
        responseText: 'regex match'
    });
    $.mockjax({
        url: '*',
        responseText: 'catch all'
    });

    $.ajax({
        url: '/regex-123456',
        error: noErrorCallbackExpected,
        complete: function(xhr) {
            equals(xhr.responseText, 'regex match', 'RegEx match');
            start();
        }
    });

    $.mockjaxClear();
});

module('Request Data Matching');
asyncTest('Incorrect data matching on request', 1, function() {
    $.mockjax({
        url: '/response-callback',
        data: {
            foo: 'bar'
        }
    });

    $.ajax({
        url: '/response-callback',
        error: function() { ok(true, "Error called on bad mock/data matching"); },
        data: {
            bar: 'baz'
        },
        success: function(json) {
            ok( false, "Success should not be called" );
        },
        complete: function(xhr) {
            start();
        }
    });

    $.mockjaxClear();
});
asyncTest('Correct data matching on request', 1, function() {
    $.mockjax({
        url: '/response-callback',
        contentType: 'text/json',
        data: {
            foo: 'bar'
        }
    });

    $.ajax({
        url: '/response-callback',
        error: noErrorCallbackExpected,
        data: {
            foo: 'bar'
        },
        success: function(json) {
            ok( true, "Successfully matched data" );
        },
        complete: function(xhr) {
            start();
        }
    });

    $.mockjaxClear();
});
asyncTest('Multiple data matching requests', function() {
    $.mockjax({
        url: '/response-callback',
        contentType: 'text/json',
        data: {
            remote: {
                test: function(data) {
                    return data !== "hello";
                }
            }
        },
        responseText: { "yes?": "no" }
    });
    $.mockjax({
        url: '/response-callback',
        contentType: 'text/json',
        data: {
            remote: {
                test: function(data) {
                    return data == "hello";
                }
            }
        },
        responseText: { "yes?": "yes" }
    });

    $.ajax({
        url: '/response-callback',
        error: function(resp) { ok(true, "Expected error"); },
        dataType: 'json',
        data: {
            remote: "h"
        },
        success: function(resp) {
            deepEqual( resp, {"yes?": "no"}, "correct mock hander" );
        },
        complete: function(xhr) {
            start();
        }
    });
    stop();
    $.ajax({
        url: '/response-callback',
        error: function(resp) {
            noErrorCallbackExpected();
        },
        data: {
            remote: "hello"
        },
        dataType: 'json',
        success: function(resp) {
            deepEqual( resp, {"yes?": "yes"}, "correct mock hander" );
        },
        complete: function(xhr) {
            start();
        }
    });

    $.mockjaxClear();
});

// Test Data Types [Text, HTML, JSON, JSONP, Script and XML]
module('Data Types');
// Text
asyncTest('Response returns text', function() {
    $.mockjax({
        url: '/text',
        contentType:  'text/plain',
        responseText: 'just text'
    });
    $.ajax({
        url: '/text',
        dataType: 'text',
        error: noErrorCallbackExpected,
        complete: function(xhr) {
            equals(xhr.getResponseHeader('Content-Type'), 'text/plain', 'Content type of text/plain');

            start();
        }
    });
    $.mockjaxClear();
});
asyncTest('Response returns html', function() {
    $.mockjax({
        url: '/html',
        contentType:  'text/html',
        responseText: '<div>String</div>'
    });
    $.ajax({
        url: '/html',
        dataType: 'html',
        success: function(data) {
            equals(data, '<div>String</div>', 'HTML String matches');
        },
        error: noErrorCallbackExpected,
        complete: function(xhr) {
            equals(xhr.getResponseHeader('Content-Type'), 'text/html', 'Content type of text/html');
            start();
        }
    });
    $.mockjaxClear();
});
asyncTest('Response returns json', function() {
    $.mockjax({
        url: '/json',
        contentType:  'text/json',
        responseText: { "foo" : "bar", "baz" : { "car" : "far" } }
    });
    $.ajax({
        url: '/json',
        dataType: 'json',
        success: function(json) {
            deepEqual(json, { "foo" : "bar", "baz" : { "car" : "far" } }, 'JSON Object matches');
        },
        error: noErrorCallbackExpected,
        complete: function(xhr) {
            equals(xhr.getResponseHeader('Content-Type'), 'text/json', 'Content type of text/json');
            start();
        }
    });
    $.mockjaxClear();
});

asyncTest('Response returns jsonp', 3, function() {
    $.mockjax({
        url: '/jsonp*',
        contentType: 'text/json',
        proxy: 'test_jsonp.js'
    });
    window.abcdef123456 = function(json) {
        ok( true, 'JSONP Callback executed');
        deepEqual(json, { "data" : "JSONP is cool" });
    };

    var ret = $.ajax({
        url: '/jsonp?callback=?',
        jsonpCallback: 'abcdef123456',
        dataType: 'jsonp',
        error: noErrorCallbackExpected,
        complete: function(xhr) {
            equals(xhr.getResponseHeader('Content-Type'), 'text/json', 'Content type of text/json');
            start();
        }
    });
    $.mockjaxClear();
});


asyncTest('Response returns jsonp and return value from ajax is a promise if supported', function() {
    window.rquery =  /\?/;

    $.mockjax({
        url:"http://api*",
        responseText:{
            success:true,
            ids:[21327211]
        },
        dataType:"jsonp",
        contentType: 'text/json'
    });

    var promiseObject = $.ajax({
        url:"http://api.twitter.com/1/followers/ids.json?screen_name=test_twitter_user",
        dataType:"jsonp"
    });

    if (jQuery.Deferred) {
        ok(promiseObject.done && promiseObject.fail, "Got Promise methods");
        promiseObject.then(function(){
            ok(true, "promise object then is executed");
        });
    } else {
        ok(true, "No deferred support, passing as succesful");
    }

    start();
});

asyncTest('Response executes script', function() {
    $.mockjax({
        url: '/script',
        contentType: 'text/plain',
        proxy: 'test_script.js'
    });

    window.TEST_SCRIPT_VAR = 0;
    $.ajax({
        url: '/script',
        dataType: 'script',
        error: noErrorCallbackExpected,
        complete: function(xhr) {
            equals(window.TEST_SCRIPT_VAR, 1, 'Script executed');
            equals(xhr.getResponseHeader('Content-Type'), 'text/plain', 'Content type of text/plain');

            start();
        }
    });
    $.mockjaxClear();
});
asyncTest('Grouping deferred responses, if supported', function() {
    window.rquery =  /\?/;

    $.mockjax({
        url:"http://api*",
        responseText:{
            success:true,
            ids:[21327211]
        },
        dataType:"jsonp",
        contentType: 'text/json'
    });

    var req1 = $.ajax({
        url:"http://api.twitter.com/1/followers/ids.json?screen_name=test_twitter_user",
        dataType:"jsonp"
    });
    var req2 = $.ajax({
        url:"http://api.twitter.com/1/followers/ids.json?screen_name=test_twitter_user",
        dataType:"jsonp"
    });
    var req3 = $.ajax({
        url:"http://api.twitter.com/1/followers/ids.json?screen_name=test_twitter_user",
        dataType:"jsonp"
    });

    if (jQuery.Deferred) {
        $.when(req1, req2, req3).done(function(a, b, c) {
            ok(true, "Successfully grouped deferred responses");
        });
    } else {
        ok(true, "No deferred support, passing as succesful");
    }

    start();
});
asyncTest('Response returns parsed XML', function() {
    $.mockjax({
        url: '/xml',
        contentType:  'text/xml',
        responseXML: '<document>String</document>'
    });
    $.ajax({
        url: '/xml',
        dataType: 'xml',
        success: function(xmlDom) {
            ok( jQuery.isXMLDoc( xmlDom ), 'Data returned is an XML DOM');
        },
        error: noErrorCallbackExpected,
        complete: function(xhr, error) {
            ok(true, 'Error: ' + error);
            equals(xhr.getResponseHeader('Content-Type'), 'text/xml', 'Content type of text/xml');
            start();
        }
    });
    $.mockjaxClear();
});

module('Connection Simulation', {
    setup: function() {
        $.mockjax({
            url: '/delay',
            responseTime: 150
        });
        $.mockjax({
            url: '*',
            responseText: '',
            responseTime: 50
        });
    },
    teardown: function() {
        $.mockjaxClear();
    }
});
asyncTest('Async test', function() {
    var order = [];
    $.ajax({
        async: true,
        url: '/',
        success: function() {
            order.push('b');
        },
        error: noErrorCallbackExpected,
        complete: function() {
            deepEqual(order, ['a', 'b'], 'Order of execution correct, 2');
            start();
        }
    });
    order.push('a');
    deepEqual(order, ['a'], 'Order of execution correct, 1');
});
test('Sync test', function() {
    var order = [];
    $.ajax({
        async: false,
        url: '/',
        success: function() {
            order.push('b');
            deepEqual(order, ['b'], 'Order of execution correct, 1');
        },
        error: noErrorCallbackExpected
    });
    order.push('a');
    deepEqual(order, ['b', 'a'], 'Order of execution correct, 2');
});
asyncTest('Response time simulation and latency', function() {
    var executed = 0, ts = new Date();
    $.ajax({
        url: '/delay',
        complete: function() {
            var delay = ((new Date()) - ts);
            ok( delay >= 150, 'Correct delay simulation (' + delay + ')' );
            equals( executed, 1, 'Callback execution order correct');
            start();
        }
    });
    setTimeout(function() {
        ok( executed == 0, 'No premature callback execution');
        executed++;
    }, 30);
});

module('Headers');
asyncTest('headers can be inspected via setRequestHeader()', function() {
    var mock;
    $('html').ajaxSend(function(event, xhr, ajaxSettings) {
        xhr.setRequestHeader('X-CSRFToken', '<this is a token>');
    });
    mock = $.mockjax({
        url: '/inspect-headers',
        response: function(settings) {
            var key;
            if (typeof this.headers['X-Csrftoken'] !== 'undefined') {
                key = 'X-Csrftoken';  // bugs in jquery 1.5
            } else {
                key = 'X-CSRFToken';
            }
            equals(this.headers[key], '<this is a token>');
            $.mockjaxClear(mock);
            start();
        }
    });
    $.ajax({
        url: '/inspect-headers',
        complete: function() {}
    });
});


// SIMULATING HTTP RESPONSE STATUSES
asyncTest('Response status callback', function() {
    $.mockjax({
        url: '/response-callback',
        status: 403
    });

    $.ajax({
        url: '/response-callback',
        error: function(){ ok(true, "error callback was called"); },
        complete: function(xhr) {
            equals(xhr.status, 403, 'response status matches');
            start();
        }
    });

    $.mockjaxClear();
});
// SETTING THE CONTENT-TYPE
asyncTest('Setting the content-type', function() {
    $.mockjax({
        url: '/response-callback',
        contentType: 'text/json',
        responseText: {
            foo: 'bar'
        }
    });

    $.ajax({
        url: '/response-callback',
        dataType: 'json',
        error: function(){ ok(false, "error callback was called"); },
        success: function(json) {
            deepEqual(json, { "foo" : "bar" }, 'JSON Object matches');
        },
        complete: function(xhr) {
            equals(xhr.getResponseHeader('Content-Type'), 'text/json', 'Content type of json');
            start();
        }
    });

    $.mockjaxClear();
});
// SETTING ADDITIONAL HTTP RESPONSE HEADERS
asyncTest('Setting additional HTTP response headers', function() {
    $.mockjax({
        url: '/response-callback',
        headers: {
            'X-Must-Exist': 'yes'
        },
        responseText: 'done'
    });

    $.ajax({
        url: '/response-callback',
        error: function(){ ok(false, "error callback was called"); },
        success: function(response) {
            equals( response, "done", "Response text matches" );
        },
        complete: function(xhr) {
            equals( xhr.getResponseHeader( "X-Must-Exist" ), "yes", "Header matches" );
            start();
        }
    });

    $.mockjaxClear();
});
// FORCE SIMULATION OF SERVER TIMEOUTS
asyncTest('Forcing timeout', function() {
    $.mockjax({
        url: '/response-callback',
        responseText: 'done',
        isTimeout: true
    });

    $.ajax({
        url: '/response-callback',
        error: function(xhr) {
            ok(true, "error callback was called");
        },
        success: function(response) {
            ok(false, "should not be be successful");
        },
        complete: function(xhr) {
            start();
        }
    });

    $.mockjaxClear();
});
// FORCE SIMULATION OF SERVER TIMEOUTS WITH PROMISES

if(jQuery.Deferred) {
    asyncTest('Forcing timeout with Promises', function() {
        $.mockjax({
            url: '/response-callback',
            isTimeout: true,
        });

        var request = $.ajax({
            url: '/response-callback'
        });

        request.done(function(xhr) {
            ok(false, "Should not be successful");
        });

        request.fail(function(response) {
            ok(true, "error callback was called");
        });

        request.complete(function(xhr) {
            start();
        });

        $.mockjaxClear();
    });
}
// DYNAMICALLY GENERATING MOCK DEFINITIONS
asyncTest('Dynamic mock definition', function() {
    $.mockjax( function( settings ) {
        var service = settings.url.match(/\/users\/(.*)$/);
        if ( service ) {
            return { 
                proxy: 'test_proxy.json'
            }
        }
    });

    $.ajax({
        url: '/users/test',
        dataType: 'json',
        error: noErrorCallbackExpected,
        success: function(json) {
            ok(json && json.proxy, 'Proxy request succeeded');
        },
        complete: function(xhr) {
            start();
        }
    });

    $.mockjaxClear();
});
// DYNAMICALLY GENERATING MOCK RESPONSES
asyncTest('Dynamic mock response generation', function() {
    $.mockjax({
        url: '/response-callback',
        response: function( settings ) {
            this.responseText = { currentTime: 'now: ' + new Date() };
        }
    });

    $.ajax({
        url: '/response-callback',
        dataType: 'json',
        error: noErrorCallbackExpected,
        success: function(json) {
            equals( typeof json.currentTime, 'string', 'Dynamic response succeeded');
        },
        complete: function(xhr) {
            start();
        }
    });

    $.mockjaxClear();
});


module( 'BugFixes' );
asyncTest( 'Test bug fix for $.mockjaxSettings', function() {
    $.mockjaxSettings.headers = {
        "content-type": "text/plain",
        etag: "IJF@H#@923uf8023hFO@I#H#"
    };

    $.mockjax({
      url: '/get/property',
      type: 'GET',
      response: function(settings) {
        this.responseText = { foo: "bar" };
      }
    });

    $.ajax({
        url: '/get/property',
        success: function(data) {
            deepEqual( $.mockjaxSettings.headers, {
                "content-type": "text/plain",
                etag: "IJF@H#@923uf8023hFO@I#H#"
            }, "Should not change the default headers.");
        },
        complete: function() {
            start();
        }
    });

    $.mockjaxClear();
});
/*
var id = $.mockjax({
   ...
});
$.mockjaxClear(id);
*/

/*
(function($) {
    $(function() {
        $.ajax({
            url: 'test.json',
            success: function(data) {
                $('ul').append('<li>test.json: completed (' + data.test + ')</li>');
            }
        });

        $.mockjax({
            url: 'test.json',
            contentType: 'text/json',
            responseText: { "test": "mock message" }
        });

        $.ajax({
            url: 'test.json',
            dataType: 'json',
            success: function(data) {
                $('ul').append('<li>test.json: completed (' + data.test + ')</li>');
            },
            error: function(xhr, status, error) {
                alert('error: ' + status + ' ' + error);
            },
            complete: function() {
            }
        });

        $.mockjax({
            url: 'http://google.com',
            responseText: 'alert("Hello world");'
        });

        $.mockjax({
            url: 'http://another-cross-domain.com',
            responseText: function() {
                alert("Get script mock");
            }
        });

        $.ajax({
            url: 'http://google.com',
            dataType: 'script',
            success: function(data) {
                $('ul').append('<li>script: completed (' + data.test + ')</li>');
            },
            error: function(xhr, status, error) {
                alert('error: ' + status + ' ' + error);
            },
            complete: function() {
            }
        });
    });
})(jQuery);
*/
