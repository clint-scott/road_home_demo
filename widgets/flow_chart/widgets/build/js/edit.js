(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/node_modules/inkling-widget-config/editor.js":[function(require,module,exports){
var ConfigLoader = require('./index');

var configurationAPI = require('@inkling/widget-api/widget/configuration')(window);

/**
 * @param {Object} options
 *      @param {Object} options.defaults An object containing default JSON to use for local dev.
 *      @param {Function} options.parseParams A function to parse <param> values into JSON.
 *      @param {Function} options.parseJSON A function to parse widget JSON into the widget-internal data format.
 *      @param {Function} options.buildParams A function to build <param> key/value pairs from JSON.
 *          If this function is present, then the widget will attempt to preserve key/value pairs
 *          if they were originally stored in <param> values.
 *      @param {Function} options.buildJSON A function to build widget JSON from the widget-internal data format.
 */
module.exports = function ConfigEditor(options, callback){
    ConfigLoader(options, function(err, config){
        if (err) return callback(err, null);

        var buildParams = options.buildParams || null;
        var buildJSON = options.buildJSON || function(data){ return data; };

        config.set = function(data){
            var json = buildJSON(data);

            if (buildParams){
                configurationAPI.set(buildParams(json));
            } else {
                // Store the config as JSON.
                configurationAPI.setJSON(json);

                // Clear any other params that may have been used.
                configurationAPI.set({});
            }
        };

        callback(null, config);
    });
}

},{"./index":"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/node_modules/inkling-widget-config/index.js","@inkling/widget-api/widget/configuration":"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/node_modules/inkling-widget-config/node_modules/@inkling/widget-api/widget/configuration/index.js"}],"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/node_modules/inkling-widget-config/index.js":[function(require,module,exports){
var paramsAPI = require('@inkling/widget-api/widget/params')(window);


/**
 * @param {Object} options
 *      @param {Object} options.defaults An object containing default JSON to use for local dev.
 *      @param {Function} options.parseParams A function to parse <param> values into JSON.
 *      @param {Function} options.parseJSON A function to parse widget JSON into the widget-internal data format.
 */
module.exports = function ConfigLoader(options, callback){
    var isLocal = ['localhost', 'svn.inkling.com'].indexOf(document.location.hostname) !== -1;

    var parseParams = options.parseParams;
    var parseJSON = options.parseJSON || function(json){ return json; };
    var defaults = isLocal ? options.defaults : null;

    paramsAPI.getJSON(function(err, data) {
        // Use the defaults if there are any.
        var json = null;

        if (!err){
            var params = paramsAPI.get();

            if (data){
                // Use the JSON config if possible.
                json = data;
            } else if (Object.keys(params).length !== 0){
                // Use the <param> values if there is no JSON.
                json = parseParams(params);
            } else {
                json = defaults || {};
            }

            // Add any extra stuff this widget may need.
            json = parseJSON(json);
        }

        callback(err, err ? null : {
            get: function(){
                return clone(json);
            }
        });
    });
}

// Quick deep-copy implementation.
function clone(obj){
    if (Array.isArray(obj)){
        return obj.map(function(item){
            return clone(item);
        });
    } else if (typeof obj === 'object'){
        return Object.keys(obj).reduce(function(copy, key){
            copy[key] = obj[key];
            return copy;
        }, {});
    } else {
        return obj;
    }
}

},{"@inkling/widget-api/widget/params":"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/node_modules/inkling-widget-config/node_modules/@inkling/widget-api/widget/params/index.js"}],"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/node_modules/inkling-widget-config/node_modules/@inkling/widget-api/lib/api.js":[function(require,module,exports){
// Copyright 2016 Inkling Systems, Inc.
//
// Your use of this software is governed by your customer agreement with Inkling Systems, Inc.
// (e.g., the Master Subscription and Professional Services Agreement).  If you are acting as a
// subcontractor of an Inkling customer, than that customer's agreement shall apply to your use of
// the software.  In the case where no such agreement applies, then Inkling's Developer Rules,
// which can be found at https://www.inkling.com/terms/developer-rules-february-2016/, shall
// apply to your use of the software.

/**
 * Responds to a message event by invoking the callback if the event matches the
 * specified type and method.
 *
 * @param {string} listenerType The message event type.
 * @param {string} listenerMethod The message event method.
 * @param {function} listenerCallback The callback to invoke.
 * @param {Event} evt The event object to process.
 */
function onMessage(listenerType, listenerMethod, listenerCallback, evt){
    if (!evt.data.type) return;

    var type = evt.data.type;
    var method = evt.data.method || null;

    // Fall back to 'data' if it is present to support older clients.
    var payload = evt.data.payload || evt.data.data;

    if (type !== listenerType) return;
    if (method !== listenerMethod) return;

    listenerCallback(payload, evt.source);
}

/**
 * Sends a message to the target window.
 *
 * @param {Window} target The window to send the message to.
 * @param {string} type The main type of message to send.
 * @param {string} method The RPC method to trigger.
 * @param {object|undefined} payload The data payload to send.
 */
exports.send = function(target, type, method, payload){
    target.postMessage({
        type: type,
        method: method,
        // Some older clients expect 'data' instead of 'payload'.
        data: payload,
        payload: payload
    }, '*');
};

/**
 * Attaches an event handler for the given message type.
 *
 * @param {Window} target The window receiving messages.
 * @param {string} type The main type of message to send.
 * @param {string} method The RPC method to trigger.
 * @param {apiCallback} callback The callback to call when a message arrives.
 *
 * @return {Object} An object containing the 'target' window and the added
 *      'handler', which can be used to remove the listener later.
 */
exports.listen = function(target, type, method, callback){
    var handler = onMessage.bind(null, type, method, callback);

    target.addEventListener('message', handler, false);

    return {
        target: target,
        handler: handler
    };
};

/**
 * Detaches an event handler created by #listen.
 *
 * @param {Object} listener object returned by #listen.
 *      @param {Window} listener.target The window receiving messages.
 *      @param {function} listener.handler The event handler to remove.
 */
exports.stop = function(listener){
    listener.target.removeEventListener('message', listener.handler, false);
};

/**
 * This callback is called when an API message arrives.
 * @callback apiCallback
 * @param {Object|undefined} payload The data payload of the message.
 * @param {Window} widgetWindow The Window of the widget that sent the message.
 */

},{}],"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/node_modules/inkling-widget-config/node_modules/@inkling/widget-api/lib/widget.js":[function(require,module,exports){
// Copyright 2016 Inkling Systems, Inc.
//
// Your use of this software is governed by your customer agreement with Inkling Systems, Inc.
// (e.g., the Master Subscription and Professional Services Agreement).  If you are acting as a
// subcontractor of an Inkling customer, than that customer's agreement shall apply to your use of
// the software.  In the case where no such agreement applies, then Inkling's Developer Rules,
// which can be found at https://www.inkling.com/terms/developer-rules-february-2016/, shall
// apply to your use of the software.

var api = require('./api');

module.exports = function(window){
    return new Widget(window);
};

/**
 * Widget API helper with methods for sending and listening to post messages
 * following the widget API format from the parent window.
 *
 * @param {Window} window The widget iframe window.
 */
function Widget(window){
    this.win_ = window;
    this.listeners_ = [];
}

/**
 * Removes this implementation of the API from the window.
 */
Widget.prototype.remove = function(){
    this.stop();
};

Widget.prototype.send = function(type, method, payload){
    api.send(this.win_.parent, type, method, payload);
};

Widget.prototype.listen = function(type, method, callback){
    var listener = api.listen(this.win_, type, method, callback);
    this.listeners_.push(listener);
    return listener;
};

Widget.prototype.stop = function(singleListener){
    this.listeners_ = this.listeners_.filter(function(listener){
        if (singleListener && singleListener !== listener) return true;

        api.stop(listener);
        return false;
    });
};

},{"./api":"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/node_modules/inkling-widget-config/node_modules/@inkling/widget-api/lib/api.js"}],"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/node_modules/inkling-widget-config/node_modules/@inkling/widget-api/widget/configuration/index.js":[function(require,module,exports){
// Copyright 2016 Inkling Systems, Inc.
//
// Your use of this software is governed by your customer agreement with Inkling Systems, Inc.
// (e.g., the Master Subscription and Professional Services Agreement).  If you are acting as a
// subcontractor of an Inkling customer, than that customer's agreement shall apply to your use of
// the software.  In the case where no such agreement applies, then Inkling's Developer Rules,
// which can be found at https://www.inkling.com/terms/developer-rules-february-2016/, shall
// apply to your use of the software.

var api = require('../../lib/widget');
var params = require('../params/index');
var engagement = require('../engagement');

module.exports = function(window){
    return new WidgetConfigurationAPI(window);
};

/**
 * Widget Editor API for setting configruation URL parameters and storing configuration data in a
 * JSON configuration file.
 */
function WidgetConfigurationAPI(window){
    this.api_ = api(window);
    this.params_ = params(window);
    this.engagement_ = engagement(window);
}

/**
 * Removes this implementation of the API from the window.
 */
WidgetConfigurationAPI.prototype.remove = function(){
    this.api_.remove();
    this.params_.remove();
    this.engagement_.remove();
};

/**
 * Gets the URL parameters.
 *
 * @return {Object.<string, string>} The URL key/value pairs.
 */
WidgetConfigurationAPI.prototype.get = function(){
    return this.params_.get();
};

/**
 * Sets the URL params.
 *
 * @param {Object.<string, string>} The URL key/value pairs.
 */
WidgetConfigurationAPI.prototype.set = function(params){
    this.api_.send('configuration', 'set', params);
};

/**
 * Gets the JSON configuration.
 *
 * @param {configurationCallback} callback The callback to call when the configuration is fetched.
 */
WidgetConfigurationAPI.prototype.getJSON = function(callback){
    this.params_.getJSON(callback);
};

/**
 * Sets the JSON configuration for the widget.
 *
 * @param {Object.<string, *>} The widget configuration blob.
 */
WidgetConfigurationAPI.prototype.setJSON = function(params){
    this.api_.send('configuration', 'file', params);
};

/**
 * A callback to call with a configuration object.
 * @callback configurationCallback
 * @param {Object.<string, *>} The widget configuration blob.
 */

},{"../../lib/widget":"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/node_modules/inkling-widget-config/node_modules/@inkling/widget-api/lib/widget.js","../engagement":"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/node_modules/inkling-widget-config/node_modules/@inkling/widget-api/widget/engagement/index.js","../params/index":"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/node_modules/inkling-widget-config/node_modules/@inkling/widget-api/widget/params/index.js"}],"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/node_modules/inkling-widget-config/node_modules/@inkling/widget-api/widget/engagement/index.js":[function(require,module,exports){
// Copyright 2016 Inkling Systems, Inc.
//
// Your use of this software is governed by your customer agreement with Inkling Systems, Inc.
// (e.g., the Master Subscription and Professional Services Agreement).  If you are acting as a
// subcontractor of an Inkling customer, than that customer's agreement shall apply to your use of
// the software.  In the case where no such agreement applies, then Inkling's Developer Rules,
// which can be found at https://www.inkling.com/terms/developer-rules-february-2016/, shall
// apply to your use of the software.

var api = require('../../lib/widget');

module.exports = function(window){
    return retrieveInstance(window);
};

/**
 * Setup automatic event reporting that will track the duration of an engagement
 * and all engagement events in any widget using this library.
 *
 * @param {Window} window The window to which to add the automatic engagement reporting.
 * @constructor
 */
function EngagementReporting(window){
    // Check if the widget is running inside the native app. We are in native if we're on an
    // iOS device and not in Safari.
    this.iOSNative_ = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/.test(window.navigator.userAgent);

    this.api_ = api(window);

    this.win_ = window;
    this.doc_ = window.document;

    this.engagementFinishedHandlerBound_ = this.engagementFinishedHandler_.bind(this);
    this.engagementHandlerBound_ = this.engagementHandler_.bind(this);

    if (!this.iOSNative_){
        this.win_.addEventListener('blur', this.engagementFinishedHandlerBound_);
        this.doc_.addEventListener('mousedown', this.engagementHandlerBound_);
    } else{
        // When widgets are run inside the native iOS app they run in a UIWebView. This view
        // doesn't correctly handle iframe focus or mousedown events so widgets must listen for
        // a different set of events to track engagement.
        this.api_.listen('engagement', 'blur', this.engagementFinishedHandlerBound_);
        this.doc_.addEventListener('touchstart', this.engagementHandlerBound_);
    }
    this.win_.addEventListener('unload', this.engagementFinishedHandlerBound_);
    this.doc_.addEventListener('keypress', this.engagementHandlerBound_);

    /**
     * The last time engagement occurred within the widget.
     * @type {Date}
     */
    this.lastEngagement_ = null;
    /**
     * The time associated with when the first engagement within the widget occurred.
     * @type {Date}
     */
    this.engagementStartTime_ = null;
    /**
     * ID of the inactivity timeout to be used for canceling timeouts.
     * @type {number}
     */
    this.inactivityTimeout_ = null;
}

/**
 * Minimum time between sending events.
 * @type {number}
 */

EngagementReporting.prototype.ENGAGEMENT_THROTTLE_MS_ = 500;
/**
 * Time after which no engagement we consider the user to have left.
 * @type {number}
 */
EngagementReporting.prototype.INACTIVITY_TIMEOUT_DURATION_MS_ = 10 * 60 * 1000;

/**
 * Removes this implementation of the API from the window.
 */
EngagementReporting.prototype.remove = function(){
    // If this is the last removal of the instance we can remove our event listeners.
    if (getReferenceCount(this) == 1){
        this.api_.remove();

        if (!this.iOSNative_){
            this.win_.removeEventListener('blur', this.engagementFinishedHandlerBound_, false);
            this.doc_.removeEventListener('mousedown', this.engagementHandlerBound_, false);
        } else{
            this.doc_.removeEventListener('touchstart', this.engagementHandlerBound_, false);
        }
        this.doc_.removeEventListener('keypress', this.engagementHandlerBound_, false);
        this.win_.removeEventListener('unload', this.engagementFinishedHandlerBound_, false);

        if (this.inactivityTimeout_){
            clearTimeout(this.inactivityTimeout_);
        }
    }
    removeInstance(this, this.win_);
};

/**
 * Sends a request to log an engagement event.
 *
 * @param {Object} engagementData The engagement data.
 */
EngagementReporting.prototype.sendEngagement = function(engagementData){
    this.api_.send('analytics', 'interaction', engagementData);
};

/**
 * Track that engagement has ended.
 */
EngagementReporting.prototype.engagementFinishedHandler_ = function(){
    this.sendEngagementEnd_(new Date());
};

/**
 * Track that an engagement has occurred.
 */
EngagementReporting.prototype.engagementHandler_ = function(){
    var now = new Date();
    if (this.engagementStartTime_ === null){
        this.engagementStartTime_ = now;
    }

    var event = {
        category: 'automatic',
        action: 'engagement',
        value: now.getTime() - this.engagementStartTime_.getTime()
    };

    this.sendEngagementThrottled_(event);
};

/**
 * Send throttled engagement events.
 * @param {object} engagementData The event data to send.
 */
EngagementReporting.prototype.sendEngagementThrottled_ = function(engagementData){
    var now = new Date();
    if (!this.lastEngagement_ || (this.lastEngagement_ &&
            (now.getTime() - this.lastEngagement_.getTime()) > this.ENGAGEMENT_THROTTLE_MS_)){
        this.sendEngagement(engagementData);
        this.lastEngagement_ = now;
    }

    // In order to gracefully handle users who may leave a book mid-engagement with a widget we
    // want to set a timer that will end the engagement duration even if we don't receive
    // the typical engagement ended events.
    if (this.inactivityTimeout_){
        clearTimeout(this.inactivityTimeout_);
    }
    this.inactivityTimeout_ = setTimeout(function(){
        this.sendEngagementEnd_(this.lastEngagement_);
    }.bind(this), this.INACTIVITY_TIMEOUT_DURATION_MS_);
};

/**
 * Send the engagement end event based off of the incoming date.
 * @param {Date} endDate The date to be used for calculating the duration.
 */
EngagementReporting.prototype.sendEngagementEnd_ = function(endDate){
    if (this.engagementStartTime_ != null){
        var duration = endDate.getTime() - this.engagementStartTime_.getTime();
        this.sendEngagement({
            category: 'automatic',
            action: 'engagement_end',
            value: duration
        });
        this.engagementStartTime_ = null;
    }
};

/**
 * Retrieve an instance of EngagementReporting associated with the given window. This will create a
 * new instance if necessary.
 *
 * @param {Window} window The window with which to associate the instance.
 * @returns {EngagementReporting}
 */
function retrieveInstance(window){
    var instance;
    if (window.__S9EngagementHandler) {
        instance = window.__S9EngagementHandler;
        instance.count++;
    } else {
        instance = new EngagementReporting(window);
        instance.count = 1;
        window.__S9EngagementHandler = instance;
    }
    return instance;
}

/**
 * Retrieve the number of references to this instance.
 *
 * @param {EngagementReporting} instance The window to associate the instance with.
 * @returns {number}
 */
function getReferenceCount(instance){
    return instance.count;
}

/**
 * Track removal of an instance of EngagementReporting. If this is the last removal possible we will
 * also remove all stored references from our instance lookup.
 *
 * @param {EngagementReporting} instance The instance to remove.
 * @param {Window} window The current window to which the instance is attached.
 */
function removeInstance(instance, window){
    instance.count--;
    if (instance.count == 0) {
        window.__S9EngagementHandler = undefined;
    }
}

},{"../../lib/widget":"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/node_modules/inkling-widget-config/node_modules/@inkling/widget-api/lib/widget.js"}],"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/node_modules/inkling-widget-config/node_modules/@inkling/widget-api/widget/params/index.js":[function(require,module,exports){
// Copyright 2016 Inkling Systems, Inc.
//
// Your use of this software is governed by your customer agreement with Inkling Systems, Inc.
// (e.g., the Master Subscription and Professional Services Agreement).  If you are acting as a
// subcontractor of an Inkling customer, than that customer's agreement shall apply to your use of
// the software.  In the case where no such agreement applies, then Inkling's Developer Rules,
// which can be found at https://www.inkling.com/terms/developer-rules-february-2016/, shall
// apply to your use of the software.

var CONFIG_PARAM = 'configFile';
var engagement = require('../engagement');

module.exports = function(window){
    return new WidgetParamAPI(window);
};

/**
 * Widget API for getting widget configuration parameters out of the iframe URL.
 */
function WidgetParamAPI(window){
    this.win_ = window;
    this.engagement_ = engagement(window);
}

/**
 * Removes this implementation of the API from the window.
 */
WidgetParamAPI.prototype.remove = function(){
    this.engagement_.remove();
};

/**
 * Gets the URL parameters.
 *
 * @return {Object.<string, string>} The URL key/value pairs.
 */
WidgetParamAPI.prototype.get = function(){
    var allParams = parseParams(this.win_.location.search);
    return Object.keys(allParams).reduce(function(params, paramName){
        // Exclude the config file from the params since we should really be reading it directly.
        if (paramName !== CONFIG_PARAM){
            params[paramName] = allParams[paramName];
        }
        return params;
    }, {});
};

/**
 * Gets the JSON configuration.
 *
 * @param {configurationCallback} callback(err, config) The callback to call when the configuration
 *        is fetched.
 * @param {Callback} progress(event) The optional callback to call on progress timestep.
 */
WidgetParamAPI.prototype.getJSON = function(callback){
    // If the following inklingInlineWidgetConfig is defined, assume that it references 
    // a stringified JSON object representing the widget configuration data.
    if (this.win_.inklingInlineWidgetConfig) {
      callback(null, JSON.parse(this.win_.inklingInlineWidgetConfig));
      return;
    }
    
    var configFile = parseParams(this.win_.location.search)[CONFIG_PARAM];
    if (!configFile){
        callback(null, null);
        return;
    }

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function(){
        if (xmlhttp.readyState === 4){
            if (xmlhttp.status === 200 || xmlhttp.status === 0){
                var data = null;
                try {
                    data = JSON.parse(xmlhttp.responseText);
                } catch(e){}
                callback(data ? null : new Error('Failed to parse the JSON config file.'), data);
            } else {
                callback(new Error('Failed to load config file.'), null);
            }
        }
    };
    xmlhttp.open('GET', configFile, true);
    xmlhttp.send();
};

function parseParams(search){
    return search.slice(1).split('&').reduce(function(params, pair){
        var parts = pair.split('=');
        var key = decodeURIComponent(parts[0]);
        var value = parts.length > 1 ? decodeURIComponent(parts[1]) : null;

        if (key){
            params[key] = value;
        }
        return params;
    }, {});
}

},{"../engagement":"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/node_modules/inkling-widget-config/node_modules/@inkling/widget-api/widget/engagement/index.js"}],"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/src/config.js":[function(require,module,exports){
/**
 * This file defines the interfaces for accessing and processing our standard JSON configuration
 * for use within the widget, an for use as a data storage format. Below we document the supported
 * formats for this widget.
 *
 * ## Params
 *
 * This widget accepts the following key/value pairs for <param> nodes.
 *
 * * 'paramName' - The name of a parameter value.
 *
 * ## JSON
 *
 * This widget accepts the following JSON object format.
 *
 *  {
 *      "paramName": ""  // The name of a parameter value.
 *  }
 *
 */

/**
 * Export the default JSON for local dev. If you are loading the widget through SVN or locally
 * and it has no params, this file will be loaded to demonstrate the functionality of the widget.
 */
exports.defaults = require('./defaults');

/**
 * Parse the params into standard JSON.
 */
exports.parseParams = function(params){
    return {
        paramName: params.paramName
    }
};

/**
 * Parse the standard JSON into widget-specific structure. If the widget expects any defaults
 * or assumes that any particular JSON structure will be present, this function should massage
 * the JSON and provide an necessary defaults if values are not present. So it should work
 * fine if 'json' were just an empty object.
 */
exports.parseJSON = function(json){
    return {
        // Set some defaults if not present.
        paramName: json.paramName || '',
    };
};

/**
 * If any instance-specific values were added to the JSON structure in parseJSON, use this
 * method as an opportunity to strip them out so that only valid JSON will be saved.
 * If not present, the data will be passed straight through.
 */
exports.buildJSON = function(data){
    return data;
};

/**
 * If you don't want your widget to have a JSON config file, and instead want it to use params,
 * this method may be specified to serialize the JSON back into a set of key/value pairs for
 * storage as <param> nodes.
 */
exports.buildParams = function(json){
    return json;
};

},{"./defaults":"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/src/defaults.js"}],"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/src/defaults.js":[function(require,module,exports){
{}

},{}],"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/src/edit.js":[function(require,module,exports){
require('inkling-widget-config/editor')(require('./config'), function(err, config){
    var data = config.get();

    $(function() {
        // Render the widget using the config data.

        // Do something and update the config.
        data.paramName = 'newvalue';
        config.set(data);
    });
});

},{"./config":"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/src/config.js","inkling-widget-config/editor":"/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/node_modules/inkling-widget-config/editor.js"}]},{},["/Users/clintonscott/web/widgets/widgets/cgs_demo_flow_chart_01/src/edit.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9jbGludG9uc2NvdHQvd2ViL3dpZGdldHMvaGVscGVycy9pbmtsaW5nLXdpZGdldC1idWlsZC10b29scy9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2NsaW50b25zY290dC93ZWIvd2lkZ2V0cy93aWRnZXRzL2Nnc19kZW1vX2Zsb3dfY2hhcnRfMDEvbm9kZV9tb2R1bGVzL2lua2xpbmctd2lkZ2V0LWNvbmZpZy9lZGl0b3IuanMiLCIvVXNlcnMvY2xpbnRvbnNjb3R0L3dlYi93aWRnZXRzL3dpZGdldHMvY2dzX2RlbW9fZmxvd19jaGFydF8wMS9ub2RlX21vZHVsZXMvaW5rbGluZy13aWRnZXQtY29uZmlnL2luZGV4LmpzIiwiL1VzZXJzL2NsaW50b25zY290dC93ZWIvd2lkZ2V0cy93aWRnZXRzL2Nnc19kZW1vX2Zsb3dfY2hhcnRfMDEvbm9kZV9tb2R1bGVzL2lua2xpbmctd2lkZ2V0LWNvbmZpZy9ub2RlX21vZHVsZXMvQGlua2xpbmcvd2lkZ2V0LWFwaS9saWIvYXBpLmpzIiwiL1VzZXJzL2NsaW50b25zY290dC93ZWIvd2lkZ2V0cy93aWRnZXRzL2Nnc19kZW1vX2Zsb3dfY2hhcnRfMDEvbm9kZV9tb2R1bGVzL2lua2xpbmctd2lkZ2V0LWNvbmZpZy9ub2RlX21vZHVsZXMvQGlua2xpbmcvd2lkZ2V0LWFwaS9saWIvd2lkZ2V0LmpzIiwiL1VzZXJzL2NsaW50b25zY290dC93ZWIvd2lkZ2V0cy93aWRnZXRzL2Nnc19kZW1vX2Zsb3dfY2hhcnRfMDEvbm9kZV9tb2R1bGVzL2lua2xpbmctd2lkZ2V0LWNvbmZpZy9ub2RlX21vZHVsZXMvQGlua2xpbmcvd2lkZ2V0LWFwaS93aWRnZXQvY29uZmlndXJhdGlvbi9pbmRleC5qcyIsIi9Vc2Vycy9jbGludG9uc2NvdHQvd2ViL3dpZGdldHMvd2lkZ2V0cy9jZ3NfZGVtb19mbG93X2NoYXJ0XzAxL25vZGVfbW9kdWxlcy9pbmtsaW5nLXdpZGdldC1jb25maWcvbm9kZV9tb2R1bGVzL0BpbmtsaW5nL3dpZGdldC1hcGkvd2lkZ2V0L2VuZ2FnZW1lbnQvaW5kZXguanMiLCIvVXNlcnMvY2xpbnRvbnNjb3R0L3dlYi93aWRnZXRzL3dpZGdldHMvY2dzX2RlbW9fZmxvd19jaGFydF8wMS9ub2RlX21vZHVsZXMvaW5rbGluZy13aWRnZXQtY29uZmlnL25vZGVfbW9kdWxlcy9AaW5rbGluZy93aWRnZXQtYXBpL3dpZGdldC9wYXJhbXMvaW5kZXguanMiLCIvVXNlcnMvY2xpbnRvbnNjb3R0L3dlYi93aWRnZXRzL3dpZGdldHMvY2dzX2RlbW9fZmxvd19jaGFydF8wMS9zcmMvY29uZmlnLmpzIiwiL1VzZXJzL2NsaW50b25zY290dC93ZWIvd2lkZ2V0cy93aWRnZXRzL2Nnc19kZW1vX2Zsb3dfY2hhcnRfMDEvc3JjL2RlZmF1bHRzLmpzIiwiL1VzZXJzL2NsaW50b25zY290dC93ZWIvd2lkZ2V0cy93aWRnZXRzL2Nnc19kZW1vX2Zsb3dfY2hhcnRfMDEvc3JjL2VkaXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgQ29uZmlnTG9hZGVyID0gcmVxdWlyZSgnLi9pbmRleCcpO1xuXG52YXIgY29uZmlndXJhdGlvbkFQSSA9IHJlcXVpcmUoJ0BpbmtsaW5nL3dpZGdldC1hcGkvd2lkZ2V0L2NvbmZpZ3VyYXRpb24nKSh3aW5kb3cpO1xuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiAgICAgIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLmRlZmF1bHRzIEFuIG9iamVjdCBjb250YWluaW5nIGRlZmF1bHQgSlNPTiB0byB1c2UgZm9yIGxvY2FsIGRldi5cbiAqICAgICAgQHBhcmFtIHtGdW5jdGlvbn0gb3B0aW9ucy5wYXJzZVBhcmFtcyBBIGZ1bmN0aW9uIHRvIHBhcnNlIDxwYXJhbT4gdmFsdWVzIGludG8gSlNPTi5cbiAqICAgICAgQHBhcmFtIHtGdW5jdGlvbn0gb3B0aW9ucy5wYXJzZUpTT04gQSBmdW5jdGlvbiB0byBwYXJzZSB3aWRnZXQgSlNPTiBpbnRvIHRoZSB3aWRnZXQtaW50ZXJuYWwgZGF0YSBmb3JtYXQuXG4gKiAgICAgIEBwYXJhbSB7RnVuY3Rpb259IG9wdGlvbnMuYnVpbGRQYXJhbXMgQSBmdW5jdGlvbiB0byBidWlsZCA8cGFyYW0+IGtleS92YWx1ZSBwYWlycyBmcm9tIEpTT04uXG4gKiAgICAgICAgICBJZiB0aGlzIGZ1bmN0aW9uIGlzIHByZXNlbnQsIHRoZW4gdGhlIHdpZGdldCB3aWxsIGF0dGVtcHQgdG8gcHJlc2VydmUga2V5L3ZhbHVlIHBhaXJzXG4gKiAgICAgICAgICBpZiB0aGV5IHdlcmUgb3JpZ2luYWxseSBzdG9yZWQgaW4gPHBhcmFtPiB2YWx1ZXMuXG4gKiAgICAgIEBwYXJhbSB7RnVuY3Rpb259IG9wdGlvbnMuYnVpbGRKU09OIEEgZnVuY3Rpb24gdG8gYnVpbGQgd2lkZ2V0IEpTT04gZnJvbSB0aGUgd2lkZ2V0LWludGVybmFsIGRhdGEgZm9ybWF0LlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIENvbmZpZ0VkaXRvcihvcHRpb25zLCBjYWxsYmFjayl7XG4gICAgQ29uZmlnTG9hZGVyKG9wdGlvbnMsIGZ1bmN0aW9uKGVyciwgY29uZmlnKXtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIGNhbGxiYWNrKGVyciwgbnVsbCk7XG5cbiAgICAgICAgdmFyIGJ1aWxkUGFyYW1zID0gb3B0aW9ucy5idWlsZFBhcmFtcyB8fCBudWxsO1xuICAgICAgICB2YXIgYnVpbGRKU09OID0gb3B0aW9ucy5idWlsZEpTT04gfHwgZnVuY3Rpb24oZGF0YSl7IHJldHVybiBkYXRhOyB9O1xuXG4gICAgICAgIGNvbmZpZy5zZXQgPSBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIHZhciBqc29uID0gYnVpbGRKU09OKGRhdGEpO1xuXG4gICAgICAgICAgICBpZiAoYnVpbGRQYXJhbXMpe1xuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYXRpb25BUEkuc2V0KGJ1aWxkUGFyYW1zKGpzb24pKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlIGNvbmZpZyBhcyBKU09OLlxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYXRpb25BUEkuc2V0SlNPTihqc29uKTtcblxuICAgICAgICAgICAgICAgIC8vIENsZWFyIGFueSBvdGhlciBwYXJhbXMgdGhhdCBtYXkgaGF2ZSBiZWVuIHVzZWQuXG4gICAgICAgICAgICAgICAgY29uZmlndXJhdGlvbkFQSS5zZXQoe30pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIGNvbmZpZyk7XG4gICAgfSk7XG59XG4iLCJ2YXIgcGFyYW1zQVBJID0gcmVxdWlyZSgnQGlua2xpbmcvd2lkZ2V0LWFwaS93aWRnZXQvcGFyYW1zJykod2luZG93KTtcblxuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiAgICAgIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLmRlZmF1bHRzIEFuIG9iamVjdCBjb250YWluaW5nIGRlZmF1bHQgSlNPTiB0byB1c2UgZm9yIGxvY2FsIGRldi5cbiAqICAgICAgQHBhcmFtIHtGdW5jdGlvbn0gb3B0aW9ucy5wYXJzZVBhcmFtcyBBIGZ1bmN0aW9uIHRvIHBhcnNlIDxwYXJhbT4gdmFsdWVzIGludG8gSlNPTi5cbiAqICAgICAgQHBhcmFtIHtGdW5jdGlvbn0gb3B0aW9ucy5wYXJzZUpTT04gQSBmdW5jdGlvbiB0byBwYXJzZSB3aWRnZXQgSlNPTiBpbnRvIHRoZSB3aWRnZXQtaW50ZXJuYWwgZGF0YSBmb3JtYXQuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ29uZmlnTG9hZGVyKG9wdGlvbnMsIGNhbGxiYWNrKXtcbiAgICB2YXIgaXNMb2NhbCA9IFsnbG9jYWxob3N0JywgJ3N2bi5pbmtsaW5nLmNvbSddLmluZGV4T2YoZG9jdW1lbnQubG9jYXRpb24uaG9zdG5hbWUpICE9PSAtMTtcblxuICAgIHZhciBwYXJzZVBhcmFtcyA9IG9wdGlvbnMucGFyc2VQYXJhbXM7XG4gICAgdmFyIHBhcnNlSlNPTiA9IG9wdGlvbnMucGFyc2VKU09OIHx8IGZ1bmN0aW9uKGpzb24peyByZXR1cm4ganNvbjsgfTtcbiAgICB2YXIgZGVmYXVsdHMgPSBpc0xvY2FsID8gb3B0aW9ucy5kZWZhdWx0cyA6IG51bGw7XG5cbiAgICBwYXJhbXNBUEkuZ2V0SlNPTihmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgICAgLy8gVXNlIHRoZSBkZWZhdWx0cyBpZiB0aGVyZSBhcmUgYW55LlxuICAgICAgICB2YXIganNvbiA9IG51bGw7XG5cbiAgICAgICAgaWYgKCFlcnIpe1xuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHBhcmFtc0FQSS5nZXQoKTtcblxuICAgICAgICAgICAgaWYgKGRhdGEpe1xuICAgICAgICAgICAgICAgIC8vIFVzZSB0aGUgSlNPTiBjb25maWcgaWYgcG9zc2libGUuXG4gICAgICAgICAgICAgICAganNvbiA9IGRhdGE7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKE9iamVjdC5rZXlzKHBhcmFtcykubGVuZ3RoICE9PSAwKXtcbiAgICAgICAgICAgICAgICAvLyBVc2UgdGhlIDxwYXJhbT4gdmFsdWVzIGlmIHRoZXJlIGlzIG5vIEpTT04uXG4gICAgICAgICAgICAgICAganNvbiA9IHBhcnNlUGFyYW1zKHBhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGpzb24gPSBkZWZhdWx0cyB8fCB7fTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQWRkIGFueSBleHRyYSBzdHVmZiB0aGlzIHdpZGdldCBtYXkgbmVlZC5cbiAgICAgICAgICAgIGpzb24gPSBwYXJzZUpTT04oanNvbik7XG4gICAgICAgIH1cblxuICAgICAgICBjYWxsYmFjayhlcnIsIGVyciA/IG51bGwgOiB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNsb25lKGpzb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuLy8gUXVpY2sgZGVlcC1jb3B5IGltcGxlbWVudGF0aW9uLlxuZnVuY3Rpb24gY2xvbmUob2JqKXtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShvYmopKXtcbiAgICAgICAgcmV0dXJuIG9iai5tYXAoZnVuY3Rpb24oaXRlbSl7XG4gICAgICAgICAgICByZXR1cm4gY2xvbmUoaXRlbSk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpe1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKS5yZWR1Y2UoZnVuY3Rpb24oY29weSwga2V5KXtcbiAgICAgICAgICAgIGNvcHlba2V5XSA9IG9ialtrZXldO1xuICAgICAgICAgICAgcmV0dXJuIGNvcHk7XG4gICAgICAgIH0sIHt9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH1cbn1cbiIsIi8vIENvcHlyaWdodCAyMDE2IElua2xpbmcgU3lzdGVtcywgSW5jLlxuLy9cbi8vIFlvdXIgdXNlIG9mIHRoaXMgc29mdHdhcmUgaXMgZ292ZXJuZWQgYnkgeW91ciBjdXN0b21lciBhZ3JlZW1lbnQgd2l0aCBJbmtsaW5nIFN5c3RlbXMsIEluYy5cbi8vIChlLmcuLCB0aGUgTWFzdGVyIFN1YnNjcmlwdGlvbiBhbmQgUHJvZmVzc2lvbmFsIFNlcnZpY2VzIEFncmVlbWVudCkuICBJZiB5b3UgYXJlIGFjdGluZyBhcyBhXG4vLyBzdWJjb250cmFjdG9yIG9mIGFuIElua2xpbmcgY3VzdG9tZXIsIHRoYW4gdGhhdCBjdXN0b21lcidzIGFncmVlbWVudCBzaGFsbCBhcHBseSB0byB5b3VyIHVzZSBvZlxuLy8gdGhlIHNvZnR3YXJlLiAgSW4gdGhlIGNhc2Ugd2hlcmUgbm8gc3VjaCBhZ3JlZW1lbnQgYXBwbGllcywgdGhlbiBJbmtsaW5nJ3MgRGV2ZWxvcGVyIFJ1bGVzLFxuLy8gd2hpY2ggY2FuIGJlIGZvdW5kIGF0IGh0dHBzOi8vd3d3Lmlua2xpbmcuY29tL3Rlcm1zL2RldmVsb3Blci1ydWxlcy1mZWJydWFyeS0yMDE2Lywgc2hhbGxcbi8vIGFwcGx5IHRvIHlvdXIgdXNlIG9mIHRoZSBzb2Z0d2FyZS5cblxuLyoqXG4gKiBSZXNwb25kcyB0byBhIG1lc3NhZ2UgZXZlbnQgYnkgaW52b2tpbmcgdGhlIGNhbGxiYWNrIGlmIHRoZSBldmVudCBtYXRjaGVzIHRoZVxuICogc3BlY2lmaWVkIHR5cGUgYW5kIG1ldGhvZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbGlzdGVuZXJUeXBlIFRoZSBtZXNzYWdlIGV2ZW50IHR5cGUuXG4gKiBAcGFyYW0ge3N0cmluZ30gbGlzdGVuZXJNZXRob2QgVGhlIG1lc3NhZ2UgZXZlbnQgbWV0aG9kLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gbGlzdGVuZXJDYWxsYmFjayBUaGUgY2FsbGJhY2sgdG8gaW52b2tlLlxuICogQHBhcmFtIHtFdmVudH0gZXZ0IFRoZSBldmVudCBvYmplY3QgdG8gcHJvY2Vzcy5cbiAqL1xuZnVuY3Rpb24gb25NZXNzYWdlKGxpc3RlbmVyVHlwZSwgbGlzdGVuZXJNZXRob2QsIGxpc3RlbmVyQ2FsbGJhY2ssIGV2dCl7XG4gICAgaWYgKCFldnQuZGF0YS50eXBlKSByZXR1cm47XG5cbiAgICB2YXIgdHlwZSA9IGV2dC5kYXRhLnR5cGU7XG4gICAgdmFyIG1ldGhvZCA9IGV2dC5kYXRhLm1ldGhvZCB8fCBudWxsO1xuXG4gICAgLy8gRmFsbCBiYWNrIHRvICdkYXRhJyBpZiBpdCBpcyBwcmVzZW50IHRvIHN1cHBvcnQgb2xkZXIgY2xpZW50cy5cbiAgICB2YXIgcGF5bG9hZCA9IGV2dC5kYXRhLnBheWxvYWQgfHwgZXZ0LmRhdGEuZGF0YTtcblxuICAgIGlmICh0eXBlICE9PSBsaXN0ZW5lclR5cGUpIHJldHVybjtcbiAgICBpZiAobWV0aG9kICE9PSBsaXN0ZW5lck1ldGhvZCkgcmV0dXJuO1xuXG4gICAgbGlzdGVuZXJDYWxsYmFjayhwYXlsb2FkLCBldnQuc291cmNlKTtcbn1cblxuLyoqXG4gKiBTZW5kcyBhIG1lc3NhZ2UgdG8gdGhlIHRhcmdldCB3aW5kb3cuXG4gKlxuICogQHBhcmFtIHtXaW5kb3d9IHRhcmdldCBUaGUgd2luZG93IHRvIHNlbmQgdGhlIG1lc3NhZ2UgdG8uXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBUaGUgbWFpbiB0eXBlIG9mIG1lc3NhZ2UgdG8gc2VuZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2QgVGhlIFJQQyBtZXRob2QgdG8gdHJpZ2dlci5cbiAqIEBwYXJhbSB7b2JqZWN0fHVuZGVmaW5lZH0gcGF5bG9hZCBUaGUgZGF0YSBwYXlsb2FkIHRvIHNlbmQuXG4gKi9cbmV4cG9ydHMuc2VuZCA9IGZ1bmN0aW9uKHRhcmdldCwgdHlwZSwgbWV0aG9kLCBwYXlsb2FkKXtcbiAgICB0YXJnZXQucG9zdE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgICAgLy8gU29tZSBvbGRlciBjbGllbnRzIGV4cGVjdCAnZGF0YScgaW5zdGVhZCBvZiAncGF5bG9hZCcuXG4gICAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgICAgIHBheWxvYWQ6IHBheWxvYWRcbiAgICB9LCAnKicpO1xufTtcblxuLyoqXG4gKiBBdHRhY2hlcyBhbiBldmVudCBoYW5kbGVyIGZvciB0aGUgZ2l2ZW4gbWVzc2FnZSB0eXBlLlxuICpcbiAqIEBwYXJhbSB7V2luZG93fSB0YXJnZXQgVGhlIHdpbmRvdyByZWNlaXZpbmcgbWVzc2FnZXMuXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBUaGUgbWFpbiB0eXBlIG9mIG1lc3NhZ2UgdG8gc2VuZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2QgVGhlIFJQQyBtZXRob2QgdG8gdHJpZ2dlci5cbiAqIEBwYXJhbSB7YXBpQ2FsbGJhY2t9IGNhbGxiYWNrIFRoZSBjYWxsYmFjayB0byBjYWxsIHdoZW4gYSBtZXNzYWdlIGFycml2ZXMuXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSBBbiBvYmplY3QgY29udGFpbmluZyB0aGUgJ3RhcmdldCcgd2luZG93IGFuZCB0aGUgYWRkZWRcbiAqICAgICAgJ2hhbmRsZXInLCB3aGljaCBjYW4gYmUgdXNlZCB0byByZW1vdmUgdGhlIGxpc3RlbmVyIGxhdGVyLlxuICovXG5leHBvcnRzLmxpc3RlbiA9IGZ1bmN0aW9uKHRhcmdldCwgdHlwZSwgbWV0aG9kLCBjYWxsYmFjayl7XG4gICAgdmFyIGhhbmRsZXIgPSBvbk1lc3NhZ2UuYmluZChudWxsLCB0eXBlLCBtZXRob2QsIGNhbGxiYWNrKTtcblxuICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgaGFuZGxlciwgZmFsc2UpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGFyZ2V0OiB0YXJnZXQsXG4gICAgICAgIGhhbmRsZXI6IGhhbmRsZXJcbiAgICB9O1xufTtcblxuLyoqXG4gKiBEZXRhY2hlcyBhbiBldmVudCBoYW5kbGVyIGNyZWF0ZWQgYnkgI2xpc3Rlbi5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gbGlzdGVuZXIgb2JqZWN0IHJldHVybmVkIGJ5ICNsaXN0ZW4uXG4gKiAgICAgIEBwYXJhbSB7V2luZG93fSBsaXN0ZW5lci50YXJnZXQgVGhlIHdpbmRvdyByZWNlaXZpbmcgbWVzc2FnZXMuXG4gKiAgICAgIEBwYXJhbSB7ZnVuY3Rpb259IGxpc3RlbmVyLmhhbmRsZXIgVGhlIGV2ZW50IGhhbmRsZXIgdG8gcmVtb3ZlLlxuICovXG5leHBvcnRzLnN0b3AgPSBmdW5jdGlvbihsaXN0ZW5lcil7XG4gICAgbGlzdGVuZXIudGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBsaXN0ZW5lci5oYW5kbGVyLCBmYWxzZSk7XG59O1xuXG4vKipcbiAqIFRoaXMgY2FsbGJhY2sgaXMgY2FsbGVkIHdoZW4gYW4gQVBJIG1lc3NhZ2UgYXJyaXZlcy5cbiAqIEBjYWxsYmFjayBhcGlDYWxsYmFja1xuICogQHBhcmFtIHtPYmplY3R8dW5kZWZpbmVkfSBwYXlsb2FkIFRoZSBkYXRhIHBheWxvYWQgb2YgdGhlIG1lc3NhZ2UuXG4gKiBAcGFyYW0ge1dpbmRvd30gd2lkZ2V0V2luZG93IFRoZSBXaW5kb3cgb2YgdGhlIHdpZGdldCB0aGF0IHNlbnQgdGhlIG1lc3NhZ2UuXG4gKi9cbiIsIi8vIENvcHlyaWdodCAyMDE2IElua2xpbmcgU3lzdGVtcywgSW5jLlxuLy9cbi8vIFlvdXIgdXNlIG9mIHRoaXMgc29mdHdhcmUgaXMgZ292ZXJuZWQgYnkgeW91ciBjdXN0b21lciBhZ3JlZW1lbnQgd2l0aCBJbmtsaW5nIFN5c3RlbXMsIEluYy5cbi8vIChlLmcuLCB0aGUgTWFzdGVyIFN1YnNjcmlwdGlvbiBhbmQgUHJvZmVzc2lvbmFsIFNlcnZpY2VzIEFncmVlbWVudCkuICBJZiB5b3UgYXJlIGFjdGluZyBhcyBhXG4vLyBzdWJjb250cmFjdG9yIG9mIGFuIElua2xpbmcgY3VzdG9tZXIsIHRoYW4gdGhhdCBjdXN0b21lcidzIGFncmVlbWVudCBzaGFsbCBhcHBseSB0byB5b3VyIHVzZSBvZlxuLy8gdGhlIHNvZnR3YXJlLiAgSW4gdGhlIGNhc2Ugd2hlcmUgbm8gc3VjaCBhZ3JlZW1lbnQgYXBwbGllcywgdGhlbiBJbmtsaW5nJ3MgRGV2ZWxvcGVyIFJ1bGVzLFxuLy8gd2hpY2ggY2FuIGJlIGZvdW5kIGF0IGh0dHBzOi8vd3d3Lmlua2xpbmcuY29tL3Rlcm1zL2RldmVsb3Blci1ydWxlcy1mZWJydWFyeS0yMDE2Lywgc2hhbGxcbi8vIGFwcGx5IHRvIHlvdXIgdXNlIG9mIHRoZSBzb2Z0d2FyZS5cblxudmFyIGFwaSA9IHJlcXVpcmUoJy4vYXBpJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24od2luZG93KXtcbiAgICByZXR1cm4gbmV3IFdpZGdldCh3aW5kb3cpO1xufTtcblxuLyoqXG4gKiBXaWRnZXQgQVBJIGhlbHBlciB3aXRoIG1ldGhvZHMgZm9yIHNlbmRpbmcgYW5kIGxpc3RlbmluZyB0byBwb3N0IG1lc3NhZ2VzXG4gKiBmb2xsb3dpbmcgdGhlIHdpZGdldCBBUEkgZm9ybWF0IGZyb20gdGhlIHBhcmVudCB3aW5kb3cuXG4gKlxuICogQHBhcmFtIHtXaW5kb3d9IHdpbmRvdyBUaGUgd2lkZ2V0IGlmcmFtZSB3aW5kb3cuXG4gKi9cbmZ1bmN0aW9uIFdpZGdldCh3aW5kb3cpe1xuICAgIHRoaXMud2luXyA9IHdpbmRvdztcbiAgICB0aGlzLmxpc3RlbmVyc18gPSBbXTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIHRoaXMgaW1wbGVtZW50YXRpb24gb2YgdGhlIEFQSSBmcm9tIHRoZSB3aW5kb3cuXG4gKi9cbldpZGdldC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLnN0b3AoKTtcbn07XG5cbldpZGdldC5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKHR5cGUsIG1ldGhvZCwgcGF5bG9hZCl7XG4gICAgYXBpLnNlbmQodGhpcy53aW5fLnBhcmVudCwgdHlwZSwgbWV0aG9kLCBwYXlsb2FkKTtcbn07XG5cbldpZGdldC5wcm90b3R5cGUubGlzdGVuID0gZnVuY3Rpb24odHlwZSwgbWV0aG9kLCBjYWxsYmFjayl7XG4gICAgdmFyIGxpc3RlbmVyID0gYXBpLmxpc3Rlbih0aGlzLndpbl8sIHR5cGUsIG1ldGhvZCwgY2FsbGJhY2spO1xuICAgIHRoaXMubGlzdGVuZXJzXy5wdXNoKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gbGlzdGVuZXI7XG59O1xuXG5XaWRnZXQucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbihzaW5nbGVMaXN0ZW5lcil7XG4gICAgdGhpcy5saXN0ZW5lcnNfID0gdGhpcy5saXN0ZW5lcnNfLmZpbHRlcihmdW5jdGlvbihsaXN0ZW5lcil7XG4gICAgICAgIGlmIChzaW5nbGVMaXN0ZW5lciAmJiBzaW5nbGVMaXN0ZW5lciAhPT0gbGlzdGVuZXIpIHJldHVybiB0cnVlO1xuXG4gICAgICAgIGFwaS5zdG9wKGxpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xufTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IElua2xpbmcgU3lzdGVtcywgSW5jLlxuLy9cbi8vIFlvdXIgdXNlIG9mIHRoaXMgc29mdHdhcmUgaXMgZ292ZXJuZWQgYnkgeW91ciBjdXN0b21lciBhZ3JlZW1lbnQgd2l0aCBJbmtsaW5nIFN5c3RlbXMsIEluYy5cbi8vIChlLmcuLCB0aGUgTWFzdGVyIFN1YnNjcmlwdGlvbiBhbmQgUHJvZmVzc2lvbmFsIFNlcnZpY2VzIEFncmVlbWVudCkuICBJZiB5b3UgYXJlIGFjdGluZyBhcyBhXG4vLyBzdWJjb250cmFjdG9yIG9mIGFuIElua2xpbmcgY3VzdG9tZXIsIHRoYW4gdGhhdCBjdXN0b21lcidzIGFncmVlbWVudCBzaGFsbCBhcHBseSB0byB5b3VyIHVzZSBvZlxuLy8gdGhlIHNvZnR3YXJlLiAgSW4gdGhlIGNhc2Ugd2hlcmUgbm8gc3VjaCBhZ3JlZW1lbnQgYXBwbGllcywgdGhlbiBJbmtsaW5nJ3MgRGV2ZWxvcGVyIFJ1bGVzLFxuLy8gd2hpY2ggY2FuIGJlIGZvdW5kIGF0IGh0dHBzOi8vd3d3Lmlua2xpbmcuY29tL3Rlcm1zL2RldmVsb3Blci1ydWxlcy1mZWJydWFyeS0yMDE2Lywgc2hhbGxcbi8vIGFwcGx5IHRvIHlvdXIgdXNlIG9mIHRoZSBzb2Z0d2FyZS5cblxudmFyIGFwaSA9IHJlcXVpcmUoJy4uLy4uL2xpYi93aWRnZXQnKTtcbnZhciBwYXJhbXMgPSByZXF1aXJlKCcuLi9wYXJhbXMvaW5kZXgnKTtcbnZhciBlbmdhZ2VtZW50ID0gcmVxdWlyZSgnLi4vZW5nYWdlbWVudCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHdpbmRvdyl7XG4gICAgcmV0dXJuIG5ldyBXaWRnZXRDb25maWd1cmF0aW9uQVBJKHdpbmRvdyk7XG59O1xuXG4vKipcbiAqIFdpZGdldCBFZGl0b3IgQVBJIGZvciBzZXR0aW5nIGNvbmZpZ3J1YXRpb24gVVJMIHBhcmFtZXRlcnMgYW5kIHN0b3JpbmcgY29uZmlndXJhdGlvbiBkYXRhIGluIGFcbiAqIEpTT04gY29uZmlndXJhdGlvbiBmaWxlLlxuICovXG5mdW5jdGlvbiBXaWRnZXRDb25maWd1cmF0aW9uQVBJKHdpbmRvdyl7XG4gICAgdGhpcy5hcGlfID0gYXBpKHdpbmRvdyk7XG4gICAgdGhpcy5wYXJhbXNfID0gcGFyYW1zKHdpbmRvdyk7XG4gICAgdGhpcy5lbmdhZ2VtZW50XyA9IGVuZ2FnZW1lbnQod2luZG93KTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIHRoaXMgaW1wbGVtZW50YXRpb24gb2YgdGhlIEFQSSBmcm9tIHRoZSB3aW5kb3cuXG4gKi9cbldpZGdldENvbmZpZ3VyYXRpb25BUEkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKCl7XG4gICAgdGhpcy5hcGlfLnJlbW92ZSgpO1xuICAgIHRoaXMucGFyYW1zXy5yZW1vdmUoKTtcbiAgICB0aGlzLmVuZ2FnZW1lbnRfLnJlbW92ZSgpO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSBVUkwgcGFyYW1ldGVycy5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3QuPHN0cmluZywgc3RyaW5nPn0gVGhlIFVSTCBrZXkvdmFsdWUgcGFpcnMuXG4gKi9cbldpZGdldENvbmZpZ3VyYXRpb25BUEkucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHRoaXMucGFyYW1zXy5nZXQoKTtcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgVVJMIHBhcmFtcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCBzdHJpbmc+fSBUaGUgVVJMIGtleS92YWx1ZSBwYWlycy5cbiAqL1xuV2lkZ2V0Q29uZmlndXJhdGlvbkFQSS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24ocGFyYW1zKXtcbiAgICB0aGlzLmFwaV8uc2VuZCgnY29uZmlndXJhdGlvbicsICdzZXQnLCBwYXJhbXMpO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSBKU09OIGNvbmZpZ3VyYXRpb24uXG4gKlxuICogQHBhcmFtIHtjb25maWd1cmF0aW9uQ2FsbGJhY2t9IGNhbGxiYWNrIFRoZSBjYWxsYmFjayB0byBjYWxsIHdoZW4gdGhlIGNvbmZpZ3VyYXRpb24gaXMgZmV0Y2hlZC5cbiAqL1xuV2lkZ2V0Q29uZmlndXJhdGlvbkFQSS5wcm90b3R5cGUuZ2V0SlNPTiA9IGZ1bmN0aW9uKGNhbGxiYWNrKXtcbiAgICB0aGlzLnBhcmFtc18uZ2V0SlNPTihjYWxsYmFjayk7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIEpTT04gY29uZmlndXJhdGlvbiBmb3IgdGhlIHdpZGdldC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCAqPn0gVGhlIHdpZGdldCBjb25maWd1cmF0aW9uIGJsb2IuXG4gKi9cbldpZGdldENvbmZpZ3VyYXRpb25BUEkucHJvdG90eXBlLnNldEpTT04gPSBmdW5jdGlvbihwYXJhbXMpe1xuICAgIHRoaXMuYXBpXy5zZW5kKCdjb25maWd1cmF0aW9uJywgJ2ZpbGUnLCBwYXJhbXMpO1xufTtcblxuLyoqXG4gKiBBIGNhbGxiYWNrIHRvIGNhbGwgd2l0aCBhIGNvbmZpZ3VyYXRpb24gb2JqZWN0LlxuICogQGNhbGxiYWNrIGNvbmZpZ3VyYXRpb25DYWxsYmFja1xuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywgKj59IFRoZSB3aWRnZXQgY29uZmlndXJhdGlvbiBibG9iLlxuICovXG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBJbmtsaW5nIFN5c3RlbXMsIEluYy5cbi8vXG4vLyBZb3VyIHVzZSBvZiB0aGlzIHNvZnR3YXJlIGlzIGdvdmVybmVkIGJ5IHlvdXIgY3VzdG9tZXIgYWdyZWVtZW50IHdpdGggSW5rbGluZyBTeXN0ZW1zLCBJbmMuXG4vLyAoZS5nLiwgdGhlIE1hc3RlciBTdWJzY3JpcHRpb24gYW5kIFByb2Zlc3Npb25hbCBTZXJ2aWNlcyBBZ3JlZW1lbnQpLiAgSWYgeW91IGFyZSBhY3RpbmcgYXMgYVxuLy8gc3ViY29udHJhY3RvciBvZiBhbiBJbmtsaW5nIGN1c3RvbWVyLCB0aGFuIHRoYXQgY3VzdG9tZXIncyBhZ3JlZW1lbnQgc2hhbGwgYXBwbHkgdG8geW91ciB1c2Ugb2Zcbi8vIHRoZSBzb2Z0d2FyZS4gIEluIHRoZSBjYXNlIHdoZXJlIG5vIHN1Y2ggYWdyZWVtZW50IGFwcGxpZXMsIHRoZW4gSW5rbGluZydzIERldmVsb3BlciBSdWxlcyxcbi8vIHdoaWNoIGNhbiBiZSBmb3VuZCBhdCBodHRwczovL3d3dy5pbmtsaW5nLmNvbS90ZXJtcy9kZXZlbG9wZXItcnVsZXMtZmVicnVhcnktMjAxNi8sIHNoYWxsXG4vLyBhcHBseSB0byB5b3VyIHVzZSBvZiB0aGUgc29mdHdhcmUuXG5cbnZhciBhcGkgPSByZXF1aXJlKCcuLi8uLi9saWIvd2lkZ2V0Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24od2luZG93KXtcbiAgICByZXR1cm4gcmV0cmlldmVJbnN0YW5jZSh3aW5kb3cpO1xufTtcblxuLyoqXG4gKiBTZXR1cCBhdXRvbWF0aWMgZXZlbnQgcmVwb3J0aW5nIHRoYXQgd2lsbCB0cmFjayB0aGUgZHVyYXRpb24gb2YgYW4gZW5nYWdlbWVudFxuICogYW5kIGFsbCBlbmdhZ2VtZW50IGV2ZW50cyBpbiBhbnkgd2lkZ2V0IHVzaW5nIHRoaXMgbGlicmFyeS5cbiAqXG4gKiBAcGFyYW0ge1dpbmRvd30gd2luZG93IFRoZSB3aW5kb3cgdG8gd2hpY2ggdG8gYWRkIHRoZSBhdXRvbWF0aWMgZW5nYWdlbWVudCByZXBvcnRpbmcuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gRW5nYWdlbWVudFJlcG9ydGluZyh3aW5kb3cpe1xuICAgIC8vIENoZWNrIGlmIHRoZSB3aWRnZXQgaXMgcnVubmluZyBpbnNpZGUgdGhlIG5hdGl2ZSBhcHAuIFdlIGFyZSBpbiBuYXRpdmUgaWYgd2UncmUgb24gYW5cbiAgICAvLyBpT1MgZGV2aWNlIGFuZCBub3QgaW4gU2FmYXJpLlxuICAgIHRoaXMuaU9TTmF0aXZlXyA9IC8oaVBob25lfGlQb2R8aVBhZCkuKkFwcGxlV2ViS2l0KD8hLipTYWZhcmkpLy50ZXN0KHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KTtcblxuICAgIHRoaXMuYXBpXyA9IGFwaSh3aW5kb3cpO1xuXG4gICAgdGhpcy53aW5fID0gd2luZG93O1xuICAgIHRoaXMuZG9jXyA9IHdpbmRvdy5kb2N1bWVudDtcblxuICAgIHRoaXMuZW5nYWdlbWVudEZpbmlzaGVkSGFuZGxlckJvdW5kXyA9IHRoaXMuZW5nYWdlbWVudEZpbmlzaGVkSGFuZGxlcl8uYmluZCh0aGlzKTtcbiAgICB0aGlzLmVuZ2FnZW1lbnRIYW5kbGVyQm91bmRfID0gdGhpcy5lbmdhZ2VtZW50SGFuZGxlcl8uYmluZCh0aGlzKTtcblxuICAgIGlmICghdGhpcy5pT1NOYXRpdmVfKXtcbiAgICAgICAgdGhpcy53aW5fLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLmVuZ2FnZW1lbnRGaW5pc2hlZEhhbmRsZXJCb3VuZF8pO1xuICAgICAgICB0aGlzLmRvY18uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5lbmdhZ2VtZW50SGFuZGxlckJvdW5kXyk7XG4gICAgfSBlbHNle1xuICAgICAgICAvLyBXaGVuIHdpZGdldHMgYXJlIHJ1biBpbnNpZGUgdGhlIG5hdGl2ZSBpT1MgYXBwIHRoZXkgcnVuIGluIGEgVUlXZWJWaWV3LiBUaGlzIHZpZXdcbiAgICAgICAgLy8gZG9lc24ndCBjb3JyZWN0bHkgaGFuZGxlIGlmcmFtZSBmb2N1cyBvciBtb3VzZWRvd24gZXZlbnRzIHNvIHdpZGdldHMgbXVzdCBsaXN0ZW4gZm9yXG4gICAgICAgIC8vIGEgZGlmZmVyZW50IHNldCBvZiBldmVudHMgdG8gdHJhY2sgZW5nYWdlbWVudC5cbiAgICAgICAgdGhpcy5hcGlfLmxpc3RlbignZW5nYWdlbWVudCcsICdibHVyJywgdGhpcy5lbmdhZ2VtZW50RmluaXNoZWRIYW5kbGVyQm91bmRfKTtcbiAgICAgICAgdGhpcy5kb2NfLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLmVuZ2FnZW1lbnRIYW5kbGVyQm91bmRfKTtcbiAgICB9XG4gICAgdGhpcy53aW5fLmFkZEV2ZW50TGlzdGVuZXIoJ3VubG9hZCcsIHRoaXMuZW5nYWdlbWVudEZpbmlzaGVkSGFuZGxlckJvdW5kXyk7XG4gICAgdGhpcy5kb2NfLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXByZXNzJywgdGhpcy5lbmdhZ2VtZW50SGFuZGxlckJvdW5kXyk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbGFzdCB0aW1lIGVuZ2FnZW1lbnQgb2NjdXJyZWQgd2l0aGluIHRoZSB3aWRnZXQuXG4gICAgICogQHR5cGUge0RhdGV9XG4gICAgICovXG4gICAgdGhpcy5sYXN0RW5nYWdlbWVudF8gPSBudWxsO1xuICAgIC8qKlxuICAgICAqIFRoZSB0aW1lIGFzc29jaWF0ZWQgd2l0aCB3aGVuIHRoZSBmaXJzdCBlbmdhZ2VtZW50IHdpdGhpbiB0aGUgd2lkZ2V0IG9jY3VycmVkLlxuICAgICAqIEB0eXBlIHtEYXRlfVxuICAgICAqL1xuICAgIHRoaXMuZW5nYWdlbWVudFN0YXJ0VGltZV8gPSBudWxsO1xuICAgIC8qKlxuICAgICAqIElEIG9mIHRoZSBpbmFjdGl2aXR5IHRpbWVvdXQgdG8gYmUgdXNlZCBmb3IgY2FuY2VsaW5nIHRpbWVvdXRzLlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5pbmFjdGl2aXR5VGltZW91dF8gPSBudWxsO1xufVxuXG4vKipcbiAqIE1pbmltdW0gdGltZSBiZXR3ZWVuIHNlbmRpbmcgZXZlbnRzLlxuICogQHR5cGUge251bWJlcn1cbiAqL1xuXG5FbmdhZ2VtZW50UmVwb3J0aW5nLnByb3RvdHlwZS5FTkdBR0VNRU5UX1RIUk9UVExFX01TXyA9IDUwMDtcbi8qKlxuICogVGltZSBhZnRlciB3aGljaCBubyBlbmdhZ2VtZW50IHdlIGNvbnNpZGVyIHRoZSB1c2VyIHRvIGhhdmUgbGVmdC5cbiAqIEB0eXBlIHtudW1iZXJ9XG4gKi9cbkVuZ2FnZW1lbnRSZXBvcnRpbmcucHJvdG90eXBlLklOQUNUSVZJVFlfVElNRU9VVF9EVVJBVElPTl9NU18gPSAxMCAqIDYwICogMTAwMDtcblxuLyoqXG4gKiBSZW1vdmVzIHRoaXMgaW1wbGVtZW50YXRpb24gb2YgdGhlIEFQSSBmcm9tIHRoZSB3aW5kb3cuXG4gKi9cbkVuZ2FnZW1lbnRSZXBvcnRpbmcucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKCl7XG4gICAgLy8gSWYgdGhpcyBpcyB0aGUgbGFzdCByZW1vdmFsIG9mIHRoZSBpbnN0YW5jZSB3ZSBjYW4gcmVtb3ZlIG91ciBldmVudCBsaXN0ZW5lcnMuXG4gICAgaWYgKGdldFJlZmVyZW5jZUNvdW50KHRoaXMpID09IDEpe1xuICAgICAgICB0aGlzLmFwaV8ucmVtb3ZlKCk7XG5cbiAgICAgICAgaWYgKCF0aGlzLmlPU05hdGl2ZV8pe1xuICAgICAgICAgICAgdGhpcy53aW5fLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLmVuZ2FnZW1lbnRGaW5pc2hlZEhhbmRsZXJCb3VuZF8sIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuZG9jXy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLmVuZ2FnZW1lbnRIYW5kbGVyQm91bmRfLCBmYWxzZSk7XG4gICAgICAgIH0gZWxzZXtcbiAgICAgICAgICAgIHRoaXMuZG9jXy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5lbmdhZ2VtZW50SGFuZGxlckJvdW5kXywgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZG9jXy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlwcmVzcycsIHRoaXMuZW5nYWdlbWVudEhhbmRsZXJCb3VuZF8sIGZhbHNlKTtcbiAgICAgICAgdGhpcy53aW5fLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3VubG9hZCcsIHRoaXMuZW5nYWdlbWVudEZpbmlzaGVkSGFuZGxlckJvdW5kXywgZmFsc2UpO1xuXG4gICAgICAgIGlmICh0aGlzLmluYWN0aXZpdHlUaW1lb3V0Xyl7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5pbmFjdGl2aXR5VGltZW91dF8pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJlbW92ZUluc3RhbmNlKHRoaXMsIHRoaXMud2luXyk7XG59O1xuXG4vKipcbiAqIFNlbmRzIGEgcmVxdWVzdCB0byBsb2cgYW4gZW5nYWdlbWVudCBldmVudC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gZW5nYWdlbWVudERhdGEgVGhlIGVuZ2FnZW1lbnQgZGF0YS5cbiAqL1xuRW5nYWdlbWVudFJlcG9ydGluZy5wcm90b3R5cGUuc2VuZEVuZ2FnZW1lbnQgPSBmdW5jdGlvbihlbmdhZ2VtZW50RGF0YSl7XG4gICAgdGhpcy5hcGlfLnNlbmQoJ2FuYWx5dGljcycsICdpbnRlcmFjdGlvbicsIGVuZ2FnZW1lbnREYXRhKTtcbn07XG5cbi8qKlxuICogVHJhY2sgdGhhdCBlbmdhZ2VtZW50IGhhcyBlbmRlZC5cbiAqL1xuRW5nYWdlbWVudFJlcG9ydGluZy5wcm90b3R5cGUuZW5nYWdlbWVudEZpbmlzaGVkSGFuZGxlcl8gPSBmdW5jdGlvbigpe1xuICAgIHRoaXMuc2VuZEVuZ2FnZW1lbnRFbmRfKG5ldyBEYXRlKCkpO1xufTtcblxuLyoqXG4gKiBUcmFjayB0aGF0IGFuIGVuZ2FnZW1lbnQgaGFzIG9jY3VycmVkLlxuICovXG5FbmdhZ2VtZW50UmVwb3J0aW5nLnByb3RvdHlwZS5lbmdhZ2VtZW50SGFuZGxlcl8gPSBmdW5jdGlvbigpe1xuICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIGlmICh0aGlzLmVuZ2FnZW1lbnRTdGFydFRpbWVfID09PSBudWxsKXtcbiAgICAgICAgdGhpcy5lbmdhZ2VtZW50U3RhcnRUaW1lXyA9IG5vdztcbiAgICB9XG5cbiAgICB2YXIgZXZlbnQgPSB7XG4gICAgICAgIGNhdGVnb3J5OiAnYXV0b21hdGljJyxcbiAgICAgICAgYWN0aW9uOiAnZW5nYWdlbWVudCcsXG4gICAgICAgIHZhbHVlOiBub3cuZ2V0VGltZSgpIC0gdGhpcy5lbmdhZ2VtZW50U3RhcnRUaW1lXy5nZXRUaW1lKClcbiAgICB9O1xuXG4gICAgdGhpcy5zZW5kRW5nYWdlbWVudFRocm90dGxlZF8oZXZlbnQpO1xufTtcblxuLyoqXG4gKiBTZW5kIHRocm90dGxlZCBlbmdhZ2VtZW50IGV2ZW50cy5cbiAqIEBwYXJhbSB7b2JqZWN0fSBlbmdhZ2VtZW50RGF0YSBUaGUgZXZlbnQgZGF0YSB0byBzZW5kLlxuICovXG5FbmdhZ2VtZW50UmVwb3J0aW5nLnByb3RvdHlwZS5zZW5kRW5nYWdlbWVudFRocm90dGxlZF8gPSBmdW5jdGlvbihlbmdhZ2VtZW50RGF0YSl7XG4gICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgaWYgKCF0aGlzLmxhc3RFbmdhZ2VtZW50XyB8fCAodGhpcy5sYXN0RW5nYWdlbWVudF8gJiZcbiAgICAgICAgICAgIChub3cuZ2V0VGltZSgpIC0gdGhpcy5sYXN0RW5nYWdlbWVudF8uZ2V0VGltZSgpKSA+IHRoaXMuRU5HQUdFTUVOVF9USFJPVFRMRV9NU18pKXtcbiAgICAgICAgdGhpcy5zZW5kRW5nYWdlbWVudChlbmdhZ2VtZW50RGF0YSk7XG4gICAgICAgIHRoaXMubGFzdEVuZ2FnZW1lbnRfID0gbm93O1xuICAgIH1cblxuICAgIC8vIEluIG9yZGVyIHRvIGdyYWNlZnVsbHkgaGFuZGxlIHVzZXJzIHdobyBtYXkgbGVhdmUgYSBib29rIG1pZC1lbmdhZ2VtZW50IHdpdGggYSB3aWRnZXQgd2VcbiAgICAvLyB3YW50IHRvIHNldCBhIHRpbWVyIHRoYXQgd2lsbCBlbmQgdGhlIGVuZ2FnZW1lbnQgZHVyYXRpb24gZXZlbiBpZiB3ZSBkb24ndCByZWNlaXZlXG4gICAgLy8gdGhlIHR5cGljYWwgZW5nYWdlbWVudCBlbmRlZCBldmVudHMuXG4gICAgaWYgKHRoaXMuaW5hY3Rpdml0eVRpbWVvdXRfKXtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaW5hY3Rpdml0eVRpbWVvdXRfKTtcbiAgICB9XG4gICAgdGhpcy5pbmFjdGl2aXR5VGltZW91dF8gPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMuc2VuZEVuZ2FnZW1lbnRFbmRfKHRoaXMubGFzdEVuZ2FnZW1lbnRfKTtcbiAgICB9LmJpbmQodGhpcyksIHRoaXMuSU5BQ1RJVklUWV9USU1FT1VUX0RVUkFUSU9OX01TXyk7XG59O1xuXG4vKipcbiAqIFNlbmQgdGhlIGVuZ2FnZW1lbnQgZW5kIGV2ZW50IGJhc2VkIG9mZiBvZiB0aGUgaW5jb21pbmcgZGF0ZS5cbiAqIEBwYXJhbSB7RGF0ZX0gZW5kRGF0ZSBUaGUgZGF0ZSB0byBiZSB1c2VkIGZvciBjYWxjdWxhdGluZyB0aGUgZHVyYXRpb24uXG4gKi9cbkVuZ2FnZW1lbnRSZXBvcnRpbmcucHJvdG90eXBlLnNlbmRFbmdhZ2VtZW50RW5kXyA9IGZ1bmN0aW9uKGVuZERhdGUpe1xuICAgIGlmICh0aGlzLmVuZ2FnZW1lbnRTdGFydFRpbWVfICE9IG51bGwpe1xuICAgICAgICB2YXIgZHVyYXRpb24gPSBlbmREYXRlLmdldFRpbWUoKSAtIHRoaXMuZW5nYWdlbWVudFN0YXJ0VGltZV8uZ2V0VGltZSgpO1xuICAgICAgICB0aGlzLnNlbmRFbmdhZ2VtZW50KHtcbiAgICAgICAgICAgIGNhdGVnb3J5OiAnYXV0b21hdGljJyxcbiAgICAgICAgICAgIGFjdGlvbjogJ2VuZ2FnZW1lbnRfZW5kJyxcbiAgICAgICAgICAgIHZhbHVlOiBkdXJhdGlvblxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5lbmdhZ2VtZW50U3RhcnRUaW1lXyA9IG51bGw7XG4gICAgfVxufTtcblxuLyoqXG4gKiBSZXRyaWV2ZSBhbiBpbnN0YW5jZSBvZiBFbmdhZ2VtZW50UmVwb3J0aW5nIGFzc29jaWF0ZWQgd2l0aCB0aGUgZ2l2ZW4gd2luZG93LiBUaGlzIHdpbGwgY3JlYXRlIGFcbiAqIG5ldyBpbnN0YW5jZSBpZiBuZWNlc3NhcnkuXG4gKlxuICogQHBhcmFtIHtXaW5kb3d9IHdpbmRvdyBUaGUgd2luZG93IHdpdGggd2hpY2ggdG8gYXNzb2NpYXRlIHRoZSBpbnN0YW5jZS5cbiAqIEByZXR1cm5zIHtFbmdhZ2VtZW50UmVwb3J0aW5nfVxuICovXG5mdW5jdGlvbiByZXRyaWV2ZUluc3RhbmNlKHdpbmRvdyl7XG4gICAgdmFyIGluc3RhbmNlO1xuICAgIGlmICh3aW5kb3cuX19TOUVuZ2FnZW1lbnRIYW5kbGVyKSB7XG4gICAgICAgIGluc3RhbmNlID0gd2luZG93Ll9fUzlFbmdhZ2VtZW50SGFuZGxlcjtcbiAgICAgICAgaW5zdGFuY2UuY291bnQrKztcbiAgICB9IGVsc2Uge1xuICAgICAgICBpbnN0YW5jZSA9IG5ldyBFbmdhZ2VtZW50UmVwb3J0aW5nKHdpbmRvdyk7XG4gICAgICAgIGluc3RhbmNlLmNvdW50ID0gMTtcbiAgICAgICAgd2luZG93Ll9fUzlFbmdhZ2VtZW50SGFuZGxlciA9IGluc3RhbmNlO1xuICAgIH1cbiAgICByZXR1cm4gaW5zdGFuY2U7XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIG51bWJlciBvZiByZWZlcmVuY2VzIHRvIHRoaXMgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHtFbmdhZ2VtZW50UmVwb3J0aW5nfSBpbnN0YW5jZSBUaGUgd2luZG93IHRvIGFzc29jaWF0ZSB0aGUgaW5zdGFuY2Ugd2l0aC5cbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIGdldFJlZmVyZW5jZUNvdW50KGluc3RhbmNlKXtcbiAgICByZXR1cm4gaW5zdGFuY2UuY291bnQ7XG59XG5cbi8qKlxuICogVHJhY2sgcmVtb3ZhbCBvZiBhbiBpbnN0YW5jZSBvZiBFbmdhZ2VtZW50UmVwb3J0aW5nLiBJZiB0aGlzIGlzIHRoZSBsYXN0IHJlbW92YWwgcG9zc2libGUgd2Ugd2lsbFxuICogYWxzbyByZW1vdmUgYWxsIHN0b3JlZCByZWZlcmVuY2VzIGZyb20gb3VyIGluc3RhbmNlIGxvb2t1cC5cbiAqXG4gKiBAcGFyYW0ge0VuZ2FnZW1lbnRSZXBvcnRpbmd9IGluc3RhbmNlIFRoZSBpbnN0YW5jZSB0byByZW1vdmUuXG4gKiBAcGFyYW0ge1dpbmRvd30gd2luZG93IFRoZSBjdXJyZW50IHdpbmRvdyB0byB3aGljaCB0aGUgaW5zdGFuY2UgaXMgYXR0YWNoZWQuXG4gKi9cbmZ1bmN0aW9uIHJlbW92ZUluc3RhbmNlKGluc3RhbmNlLCB3aW5kb3cpe1xuICAgIGluc3RhbmNlLmNvdW50LS07XG4gICAgaWYgKGluc3RhbmNlLmNvdW50ID09IDApIHtcbiAgICAgICAgd2luZG93Ll9fUzlFbmdhZ2VtZW50SGFuZGxlciA9IHVuZGVmaW5lZDtcbiAgICB9XG59XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBJbmtsaW5nIFN5c3RlbXMsIEluYy5cbi8vXG4vLyBZb3VyIHVzZSBvZiB0aGlzIHNvZnR3YXJlIGlzIGdvdmVybmVkIGJ5IHlvdXIgY3VzdG9tZXIgYWdyZWVtZW50IHdpdGggSW5rbGluZyBTeXN0ZW1zLCBJbmMuXG4vLyAoZS5nLiwgdGhlIE1hc3RlciBTdWJzY3JpcHRpb24gYW5kIFByb2Zlc3Npb25hbCBTZXJ2aWNlcyBBZ3JlZW1lbnQpLiAgSWYgeW91IGFyZSBhY3RpbmcgYXMgYVxuLy8gc3ViY29udHJhY3RvciBvZiBhbiBJbmtsaW5nIGN1c3RvbWVyLCB0aGFuIHRoYXQgY3VzdG9tZXIncyBhZ3JlZW1lbnQgc2hhbGwgYXBwbHkgdG8geW91ciB1c2Ugb2Zcbi8vIHRoZSBzb2Z0d2FyZS4gIEluIHRoZSBjYXNlIHdoZXJlIG5vIHN1Y2ggYWdyZWVtZW50IGFwcGxpZXMsIHRoZW4gSW5rbGluZydzIERldmVsb3BlciBSdWxlcyxcbi8vIHdoaWNoIGNhbiBiZSBmb3VuZCBhdCBodHRwczovL3d3dy5pbmtsaW5nLmNvbS90ZXJtcy9kZXZlbG9wZXItcnVsZXMtZmVicnVhcnktMjAxNi8sIHNoYWxsXG4vLyBhcHBseSB0byB5b3VyIHVzZSBvZiB0aGUgc29mdHdhcmUuXG5cbnZhciBDT05GSUdfUEFSQU0gPSAnY29uZmlnRmlsZSc7XG52YXIgZW5nYWdlbWVudCA9IHJlcXVpcmUoJy4uL2VuZ2FnZW1lbnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih3aW5kb3cpe1xuICAgIHJldHVybiBuZXcgV2lkZ2V0UGFyYW1BUEkod2luZG93KTtcbn07XG5cbi8qKlxuICogV2lkZ2V0IEFQSSBmb3IgZ2V0dGluZyB3aWRnZXQgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzIG91dCBvZiB0aGUgaWZyYW1lIFVSTC5cbiAqL1xuZnVuY3Rpb24gV2lkZ2V0UGFyYW1BUEkod2luZG93KXtcbiAgICB0aGlzLndpbl8gPSB3aW5kb3c7XG4gICAgdGhpcy5lbmdhZ2VtZW50XyA9IGVuZ2FnZW1lbnQod2luZG93KTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIHRoaXMgaW1wbGVtZW50YXRpb24gb2YgdGhlIEFQSSBmcm9tIHRoZSB3aW5kb3cuXG4gKi9cbldpZGdldFBhcmFtQVBJLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMuZW5nYWdlbWVudF8ucmVtb3ZlKCk7XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIFVSTCBwYXJhbWV0ZXJzLlxuICpcbiAqIEByZXR1cm4ge09iamVjdC48c3RyaW5nLCBzdHJpbmc+fSBUaGUgVVJMIGtleS92YWx1ZSBwYWlycy5cbiAqL1xuV2lkZ2V0UGFyYW1BUEkucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGFsbFBhcmFtcyA9IHBhcnNlUGFyYW1zKHRoaXMud2luXy5sb2NhdGlvbi5zZWFyY2gpO1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhhbGxQYXJhbXMpLnJlZHVjZShmdW5jdGlvbihwYXJhbXMsIHBhcmFtTmFtZSl7XG4gICAgICAgIC8vIEV4Y2x1ZGUgdGhlIGNvbmZpZyBmaWxlIGZyb20gdGhlIHBhcmFtcyBzaW5jZSB3ZSBzaG91bGQgcmVhbGx5IGJlIHJlYWRpbmcgaXQgZGlyZWN0bHkuXG4gICAgICAgIGlmIChwYXJhbU5hbWUgIT09IENPTkZJR19QQVJBTSl7XG4gICAgICAgICAgICBwYXJhbXNbcGFyYW1OYW1lXSA9IGFsbFBhcmFtc1twYXJhbU5hbWVdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgfSwge30pO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSBKU09OIGNvbmZpZ3VyYXRpb24uXG4gKlxuICogQHBhcmFtIHtjb25maWd1cmF0aW9uQ2FsbGJhY2t9IGNhbGxiYWNrKGVyciwgY29uZmlnKSBUaGUgY2FsbGJhY2sgdG8gY2FsbCB3aGVuIHRoZSBjb25maWd1cmF0aW9uXG4gKiAgICAgICAgaXMgZmV0Y2hlZC5cbiAqIEBwYXJhbSB7Q2FsbGJhY2t9IHByb2dyZXNzKGV2ZW50KSBUaGUgb3B0aW9uYWwgY2FsbGJhY2sgdG8gY2FsbCBvbiBwcm9ncmVzcyB0aW1lc3RlcC5cbiAqL1xuV2lkZ2V0UGFyYW1BUEkucHJvdG90eXBlLmdldEpTT04gPSBmdW5jdGlvbihjYWxsYmFjayl7XG4gICAgLy8gSWYgdGhlIGZvbGxvd2luZyBpbmtsaW5nSW5saW5lV2lkZ2V0Q29uZmlnIGlzIGRlZmluZWQsIGFzc3VtZSB0aGF0IGl0IHJlZmVyZW5jZXMgXG4gICAgLy8gYSBzdHJpbmdpZmllZCBKU09OIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIHdpZGdldCBjb25maWd1cmF0aW9uIGRhdGEuXG4gICAgaWYgKHRoaXMud2luXy5pbmtsaW5nSW5saW5lV2lkZ2V0Q29uZmlnKSB7XG4gICAgICBjYWxsYmFjayhudWxsLCBKU09OLnBhcnNlKHRoaXMud2luXy5pbmtsaW5nSW5saW5lV2lkZ2V0Q29uZmlnKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIHZhciBjb25maWdGaWxlID0gcGFyc2VQYXJhbXModGhpcy53aW5fLmxvY2F0aW9uLnNlYXJjaClbQ09ORklHX1BBUkFNXTtcbiAgICBpZiAoIWNvbmZpZ0ZpbGUpe1xuICAgICAgICBjYWxsYmFjayhudWxsLCBudWxsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciB4bWxodHRwID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICB4bWxodHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGlmICh4bWxodHRwLnJlYWR5U3RhdGUgPT09IDQpe1xuICAgICAgICAgICAgaWYgKHhtbGh0dHAuc3RhdHVzID09PSAyMDAgfHwgeG1saHR0cC5zdGF0dXMgPT09IDApe1xuICAgICAgICAgICAgICAgIHZhciBkYXRhID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBkYXRhID0gSlNPTi5wYXJzZSh4bWxodHRwLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaChlKXt9XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSA/IG51bGwgOiBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBwYXJzZSB0aGUgSlNPTiBjb25maWcgZmlsZS4nKSwgZGF0YSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignRmFpbGVkIHRvIGxvYWQgY29uZmlnIGZpbGUuJyksIG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICB4bWxodHRwLm9wZW4oJ0dFVCcsIGNvbmZpZ0ZpbGUsIHRydWUpO1xuICAgIHhtbGh0dHAuc2VuZCgpO1xufTtcblxuZnVuY3Rpb24gcGFyc2VQYXJhbXMoc2VhcmNoKXtcbiAgICByZXR1cm4gc2VhcmNoLnNsaWNlKDEpLnNwbGl0KCcmJykucmVkdWNlKGZ1bmN0aW9uKHBhcmFtcywgcGFpcil7XG4gICAgICAgIHZhciBwYXJ0cyA9IHBhaXIuc3BsaXQoJz0nKTtcbiAgICAgICAgdmFyIGtleSA9IGRlY29kZVVSSUNvbXBvbmVudChwYXJ0c1swXSk7XG4gICAgICAgIHZhciB2YWx1ZSA9IHBhcnRzLmxlbmd0aCA+IDEgPyBkZWNvZGVVUklDb21wb25lbnQocGFydHNbMV0pIDogbnVsbDtcblxuICAgICAgICBpZiAoa2V5KXtcbiAgICAgICAgICAgIHBhcmFtc1trZXldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICB9LCB7fSk7XG59XG4iLCIvKipcbiAqIFRoaXMgZmlsZSBkZWZpbmVzIHRoZSBpbnRlcmZhY2VzIGZvciBhY2Nlc3NpbmcgYW5kIHByb2Nlc3Npbmcgb3VyIHN0YW5kYXJkIEpTT04gY29uZmlndXJhdGlvblxuICogZm9yIHVzZSB3aXRoaW4gdGhlIHdpZGdldCwgYW4gZm9yIHVzZSBhcyBhIGRhdGEgc3RvcmFnZSBmb3JtYXQuIEJlbG93IHdlIGRvY3VtZW50IHRoZSBzdXBwb3J0ZWRcbiAqIGZvcm1hdHMgZm9yIHRoaXMgd2lkZ2V0LlxuICpcbiAqICMjIFBhcmFtc1xuICpcbiAqIFRoaXMgd2lkZ2V0IGFjY2VwdHMgdGhlIGZvbGxvd2luZyBrZXkvdmFsdWUgcGFpcnMgZm9yIDxwYXJhbT4gbm9kZXMuXG4gKlxuICogKiAncGFyYW1OYW1lJyAtIFRoZSBuYW1lIG9mIGEgcGFyYW1ldGVyIHZhbHVlLlxuICpcbiAqICMjIEpTT05cbiAqXG4gKiBUaGlzIHdpZGdldCBhY2NlcHRzIHRoZSBmb2xsb3dpbmcgSlNPTiBvYmplY3QgZm9ybWF0LlxuICpcbiAqICB7XG4gKiAgICAgIFwicGFyYW1OYW1lXCI6IFwiXCIgIC8vIFRoZSBuYW1lIG9mIGEgcGFyYW1ldGVyIHZhbHVlLlxuICogIH1cbiAqXG4gKi9cblxuLyoqXG4gKiBFeHBvcnQgdGhlIGRlZmF1bHQgSlNPTiBmb3IgbG9jYWwgZGV2LiBJZiB5b3UgYXJlIGxvYWRpbmcgdGhlIHdpZGdldCB0aHJvdWdoIFNWTiBvciBsb2NhbGx5XG4gKiBhbmQgaXQgaGFzIG5vIHBhcmFtcywgdGhpcyBmaWxlIHdpbGwgYmUgbG9hZGVkIHRvIGRlbW9uc3RyYXRlIHRoZSBmdW5jdGlvbmFsaXR5IG9mIHRoZSB3aWRnZXQuXG4gKi9cbmV4cG9ydHMuZGVmYXVsdHMgPSByZXF1aXJlKCcuL2RlZmF1bHRzJyk7XG5cbi8qKlxuICogUGFyc2UgdGhlIHBhcmFtcyBpbnRvIHN0YW5kYXJkIEpTT04uXG4gKi9cbmV4cG9ydHMucGFyc2VQYXJhbXMgPSBmdW5jdGlvbihwYXJhbXMpe1xuICAgIHJldHVybiB7XG4gICAgICAgIHBhcmFtTmFtZTogcGFyYW1zLnBhcmFtTmFtZVxuICAgIH1cbn07XG5cbi8qKlxuICogUGFyc2UgdGhlIHN0YW5kYXJkIEpTT04gaW50byB3aWRnZXQtc3BlY2lmaWMgc3RydWN0dXJlLiBJZiB0aGUgd2lkZ2V0IGV4cGVjdHMgYW55IGRlZmF1bHRzXG4gKiBvciBhc3N1bWVzIHRoYXQgYW55IHBhcnRpY3VsYXIgSlNPTiBzdHJ1Y3R1cmUgd2lsbCBiZSBwcmVzZW50LCB0aGlzIGZ1bmN0aW9uIHNob3VsZCBtYXNzYWdlXG4gKiB0aGUgSlNPTiBhbmQgcHJvdmlkZSBhbiBuZWNlc3NhcnkgZGVmYXVsdHMgaWYgdmFsdWVzIGFyZSBub3QgcHJlc2VudC4gU28gaXQgc2hvdWxkIHdvcmtcbiAqIGZpbmUgaWYgJ2pzb24nIHdlcmUganVzdCBhbiBlbXB0eSBvYmplY3QuXG4gKi9cbmV4cG9ydHMucGFyc2VKU09OID0gZnVuY3Rpb24oanNvbil7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgLy8gU2V0IHNvbWUgZGVmYXVsdHMgaWYgbm90IHByZXNlbnQuXG4gICAgICAgIHBhcmFtTmFtZToganNvbi5wYXJhbU5hbWUgfHwgJycsXG4gICAgfTtcbn07XG5cbi8qKlxuICogSWYgYW55IGluc3RhbmNlLXNwZWNpZmljIHZhbHVlcyB3ZXJlIGFkZGVkIHRvIHRoZSBKU09OIHN0cnVjdHVyZSBpbiBwYXJzZUpTT04sIHVzZSB0aGlzXG4gKiBtZXRob2QgYXMgYW4gb3Bwb3J0dW5pdHkgdG8gc3RyaXAgdGhlbSBvdXQgc28gdGhhdCBvbmx5IHZhbGlkIEpTT04gd2lsbCBiZSBzYXZlZC5cbiAqIElmIG5vdCBwcmVzZW50LCB0aGUgZGF0YSB3aWxsIGJlIHBhc3NlZCBzdHJhaWdodCB0aHJvdWdoLlxuICovXG5leHBvcnRzLmJ1aWxkSlNPTiA9IGZ1bmN0aW9uKGRhdGEpe1xuICAgIHJldHVybiBkYXRhO1xufTtcblxuLyoqXG4gKiBJZiB5b3UgZG9uJ3Qgd2FudCB5b3VyIHdpZGdldCB0byBoYXZlIGEgSlNPTiBjb25maWcgZmlsZSwgYW5kIGluc3RlYWQgd2FudCBpdCB0byB1c2UgcGFyYW1zLFxuICogdGhpcyBtZXRob2QgbWF5IGJlIHNwZWNpZmllZCB0byBzZXJpYWxpemUgdGhlIEpTT04gYmFjayBpbnRvIGEgc2V0IG9mIGtleS92YWx1ZSBwYWlycyBmb3JcbiAqIHN0b3JhZ2UgYXMgPHBhcmFtPiBub2Rlcy5cbiAqL1xuZXhwb3J0cy5idWlsZFBhcmFtcyA9IGZ1bmN0aW9uKGpzb24pe1xuICAgIHJldHVybiBqc29uO1xufTtcbiIsInt9XG4iLCJyZXF1aXJlKCdpbmtsaW5nLXdpZGdldC1jb25maWcvZWRpdG9yJykocmVxdWlyZSgnLi9jb25maWcnKSwgZnVuY3Rpb24oZXJyLCBjb25maWcpe1xuICAgIHZhciBkYXRhID0gY29uZmlnLmdldCgpO1xuXG4gICAgJChmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gUmVuZGVyIHRoZSB3aWRnZXQgdXNpbmcgdGhlIGNvbmZpZyBkYXRhLlxuXG4gICAgICAgIC8vIERvIHNvbWV0aGluZyBhbmQgdXBkYXRlIHRoZSBjb25maWcuXG4gICAgICAgIGRhdGEucGFyYW1OYW1lID0gJ25ld3ZhbHVlJztcbiAgICAgICAgY29uZmlnLnNldChkYXRhKTtcbiAgICB9KTtcbn0pO1xuIl19
