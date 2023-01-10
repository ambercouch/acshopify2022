/*
 *  Remodal - v1.1.1
 *  Responsive, lightweight, fast, synchronized with CSS animations, fully customizable modal window plugin with declarative configuration and hash tracking.
 *  http://vodkabears.github.io/remodal/
 *
 *  Made by Ilya Makarov
 *  Under MIT License
 */

!(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], function($) {
      return factory(root, $);
    });
  } else if (typeof exports === 'object') {
    factory(root, require('jquery'));
  } else {
    factory(root, root.jQuery || root.Zepto);
  }
})(this, function(global, $) {

  'use strict';

  /**
   * Name of the plugin
   * @private
   * @const
   * @type {String}
   */
  var PLUGIN_NAME = 'remodal';

  /**
   * Namespace for CSS and events
   * @private
   * @const
   * @type {String}
   */
  var NAMESPACE = global.REMODAL_GLOBALS && global.REMODAL_GLOBALS.NAMESPACE || PLUGIN_NAME;

  /**
   * Animationstart event with vendor prefixes
   * @private
   * @const
   * @type {String}
   */
  var ANIMATIONSTART_EVENTS = $.map(
    ['animationstart', 'webkitAnimationStart', 'MSAnimationStart', 'oAnimationStart'],

    function(eventName) {
      return eventName + '.' + NAMESPACE;
    }

  ).join(' ');

  /**
   * Animationend event with vendor prefixes
   * @private
   * @const
   * @type {String}
   */
  var ANIMATIONEND_EVENTS = $.map(
    ['animationend', 'webkitAnimationEnd', 'MSAnimationEnd', 'oAnimationEnd'],

    function(eventName) {
      return eventName + '.' + NAMESPACE;
    }

  ).join(' ');

  /**
   * Default settings
   * @private
   * @const
   * @type {Object}
   */
  var DEFAULTS = $.extend({
    hashTracking: true,
    closeOnConfirm: true,
    closeOnCancel: true,
    closeOnEscape: true,
    closeOnOutsideClick: true,
    modifier: '',
    appendTo: null
  }, global.REMODAL_GLOBALS && global.REMODAL_GLOBALS.DEFAULTS);

  /**
   * States of the Remodal
   * @private
   * @const
   * @enum {String}
   */
  var STATES = {
    CLOSING: 'closing',
    CLOSED: 'closed',
    OPENING: 'opening',
    OPENED: 'opened'
  };

  /**
   * Reasons of the state change.
   * @private
   * @const
   * @enum {String}
   */
  var STATE_CHANGE_REASONS = {
    CONFIRMATION: 'confirmation',
    CANCELLATION: 'cancellation'
  };

  /**
   * Is animation supported?
   * @private
   * @const
   * @type {Boolean}
   */
  var IS_ANIMATION = (function() {
    var style = document.createElement('div').style;

    return style.animationName !== undefined ||
      style.WebkitAnimationName !== undefined ||
      style.MozAnimationName !== undefined ||
      style.msAnimationName !== undefined ||
      style.OAnimationName !== undefined;
  })();

  /**
   * Is iOS?
   * @private
   * @const
   * @type {Boolean}
   */
  var IS_IOS = /iPad|iPhone|iPod/.test(navigator.platform);

  /**
   * Current modal
   * @private
   * @type {Remodal}
   */
  var current;

  /**
   * Scrollbar position
   * @private
   * @type {Number}
   */
  var scrollTop;

  /**
   * Returns an animation duration
   * @private
   * @param {jQuery} $elem
   * @returns {Number}
   */
  function getAnimationDuration($elem) {
    if (
      IS_ANIMATION &&
      $elem.css('animation-name') === 'none' &&
      $elem.css('-webkit-animation-name') === 'none' &&
      $elem.css('-moz-animation-name') === 'none' &&
      $elem.css('-o-animation-name') === 'none' &&
      $elem.css('-ms-animation-name') === 'none'
    ) {
      return 0;
    }

    var duration = $elem.css('animation-duration') ||
      $elem.css('-webkit-animation-duration') ||
      $elem.css('-moz-animation-duration') ||
      $elem.css('-o-animation-duration') ||
      $elem.css('-ms-animation-duration') ||
      '0s';

    var delay = $elem.css('animation-delay') ||
      $elem.css('-webkit-animation-delay') ||
      $elem.css('-moz-animation-delay') ||
      $elem.css('-o-animation-delay') ||
      $elem.css('-ms-animation-delay') ||
      '0s';

    var iterationCount = $elem.css('animation-iteration-count') ||
      $elem.css('-webkit-animation-iteration-count') ||
      $elem.css('-moz-animation-iteration-count') ||
      $elem.css('-o-animation-iteration-count') ||
      $elem.css('-ms-animation-iteration-count') ||
      '1';

    var max;
    var len;
    var num;
    var i;

    duration = duration.split(', ');
    delay = delay.split(', ');
    iterationCount = iterationCount.split(', ');

    // The 'duration' size is the same as the 'delay' size
    for (i = 0, len = duration.length, max = Number.NEGATIVE_INFINITY; i < len; i++) {
      num = parseFloat(duration[i]) * parseInt(iterationCount[i], 10) + parseFloat(delay[i]);

      if (num > max) {
        max = num;
      }
    }

    return max;
  }

  /**
   * Returns a scrollbar width
   * @private
   * @returns {Number}
   */
  function getScrollbarWidth() {
    if ($(document).height() <= $(window).height()) {
      return 0;
    }

    var outer = document.createElement('div');
    var inner = document.createElement('div');
    var widthNoScroll;
    var widthWithScroll;

    outer.style.visibility = 'hidden';
    outer.style.width = '100px';
    document.body.appendChild(outer);

    widthNoScroll = outer.offsetWidth;

    // Force scrollbars
    outer.style.overflow = 'scroll';

    // Add inner div
    inner.style.width = '100%';
    outer.appendChild(inner);

    widthWithScroll = inner.offsetWidth;

    // Remove divs
    outer.parentNode.removeChild(outer);

    return widthNoScroll - widthWithScroll;
  }

  /**
   * Locks the screen
   * @private
   */
  function lockScreen() {
    if (IS_IOS) {
      return;
    }

    var $html = $('html');
    var lockedClass = namespacify('is-locked');
    var paddingRight;
    var $body;

    if (!$html.hasClass(lockedClass)) {
      $body = $(document.body);

      // Zepto does not support '-=', '+=' in the `css` method
      paddingRight = parseInt($body.css('padding-right'), 10) + getScrollbarWidth();

      $body.css('padding-right', paddingRight + 'px');
      $html.addClass(lockedClass);
    }
  }

  /**
   * Unlocks the screen
   * @private
   */
  function unlockScreen() {
    if (IS_IOS) {
      return;
    }

    var $html = $('html');
    var lockedClass = namespacify('is-locked');
    var paddingRight;
    var $body;

    if ($html.hasClass(lockedClass)) {
      $body = $(document.body);

      // Zepto does not support '-=', '+=' in the `css` method
      paddingRight = parseInt($body.css('padding-right'), 10) - getScrollbarWidth();

      $body.css('padding-right', paddingRight + 'px');
      $html.removeClass(lockedClass);
    }
  }

  /**
   * Sets a state for an instance
   * @private
   * @param {Remodal} instance
   * @param {STATES} state
   * @param {Boolean} isSilent If true, Remodal does not trigger events
   * @param {String} Reason of a state change.
   */
  function setState(instance, state, isSilent, reason) {

    var newState = namespacify('is', state);
    var allStates = [namespacify('is', STATES.CLOSING),
                     namespacify('is', STATES.OPENING),
                     namespacify('is', STATES.CLOSED),
                     namespacify('is', STATES.OPENED)].join(' ');

    instance.$bg
      .removeClass(allStates)
      .addClass(newState);

    instance.$overlay
      .removeClass(allStates)
      .addClass(newState);

    instance.$wrapper
      .removeClass(allStates)
      .addClass(newState);

    instance.$modal
      .removeClass(allStates)
      .addClass(newState);

    instance.state = state;
    !isSilent && instance.$modal.trigger({
      type: state,
      reason: reason
    }, [{ reason: reason }]);
  }

  /**
   * Synchronizes with the animation
   * @param {Function} doBeforeAnimation
   * @param {Function} doAfterAnimation
   * @param {Remodal} instance
   */
  function syncWithAnimation(doBeforeAnimation, doAfterAnimation, instance) {
    var runningAnimationsCount = 0;

    var handleAnimationStart = function(e) {
      if (e.target !== this) {
        return;
      }

      runningAnimationsCount++;
    };

    var handleAnimationEnd = function(e) {
      if (e.target !== this) {
        return;
      }

      if (--runningAnimationsCount === 0) {

        // Remove event listeners
        $.each(['$bg', '$overlay', '$wrapper', '$modal'], function(index, elemName) {
          instance[elemName].off(ANIMATIONSTART_EVENTS + ' ' + ANIMATIONEND_EVENTS);
        });

        doAfterAnimation();
      }
    };

    $.each(['$bg', '$overlay', '$wrapper', '$modal'], function(index, elemName) {
      instance[elemName]
        .on(ANIMATIONSTART_EVENTS, handleAnimationStart)
        .on(ANIMATIONEND_EVENTS, handleAnimationEnd);
    });

    doBeforeAnimation();

    // If the animation is not supported by a browser or its duration is 0
    if (
      getAnimationDuration(instance.$bg) === 0 &&
      getAnimationDuration(instance.$overlay) === 0 &&
      getAnimationDuration(instance.$wrapper) === 0 &&
      getAnimationDuration(instance.$modal) === 0
    ) {

      // Remove event listeners
      $.each(['$bg', '$overlay', '$wrapper', '$modal'], function(index, elemName) {
        instance[elemName].off(ANIMATIONSTART_EVENTS + ' ' + ANIMATIONEND_EVENTS);
      });

      doAfterAnimation();
    }
  }

  /**
   * Closes immediately
   * @private
   * @param {Remodal} instance
   */
  function halt(instance) {
    if (instance.state === STATES.CLOSED) {
      return;
    }

    $.each(['$bg', '$overlay', '$wrapper', '$modal'], function(index, elemName) {
      instance[elemName].off(ANIMATIONSTART_EVENTS + ' ' + ANIMATIONEND_EVENTS);
    });

    instance.$bg.removeClass(instance.settings.modifier);
    instance.$overlay.removeClass(instance.settings.modifier).hide();
    instance.$wrapper.hide();
    unlockScreen();
    setState(instance, STATES.CLOSED, true);
  }

  /**
   * Parses a string with options
   * @private
   * @param str
   * @returns {Object}
   */
  function parseOptions(str) {
    var obj = {};
    var arr;
    var len;
    var val;
    var i;

    // Remove spaces before and after delimiters
    str = str.replace(/\s*:\s*/g, ':').replace(/\s*,\s*/g, ',');

    // Parse a string
    arr = str.split(',');
    for (i = 0, len = arr.length; i < len; i++) {
      arr[i] = arr[i].split(':');
      val = arr[i][1];

      // Convert a string value if it is like a boolean
      if (typeof val === 'string' || val instanceof String) {
        val = val === 'true' || (val === 'false' ? false : val);
      }

      // Convert a string value if it is like a number
      if (typeof val === 'string' || val instanceof String) {
        val = !isNaN(val) ? +val : val;
      }

      obj[arr[i][0]] = val;
    }

    return obj;
  }

  /**
   * Generates a string separated by dashes and prefixed with NAMESPACE
   * @private
   * @param {...String}
   * @returns {String}
   */
  function namespacify() {
    var result = NAMESPACE;

    for (var i = 0; i < arguments.length; ++i) {
      result += '-' + arguments[i];
    }

    return result;
  }

  /**
   * Handles the hashchange event
   * @private
   * @listens hashchange
   */
  function handleHashChangeEvent() {
    var id = location.hash.replace('#', '');
    var instance;
    var $elem;

    if (!id) {

      // Check if we have currently opened modal and animation was completed
      if (current && current.state === STATES.OPENED && current.settings.hashTracking) {
        current.close();
      }
    } else {

      // Catch syntax error if your hash is bad
      try {
        $elem = $(
          '[data-' + PLUGIN_NAME + '-id="' + id + '"]'
        );
      } catch (err) {}

      if ($elem && $elem.length) {
        instance = $[PLUGIN_NAME].lookup[$elem.data(PLUGIN_NAME)];

        if (instance && instance.settings.hashTracking) {
          instance.open();
        }
      }

    }
  }

  /**
   * Remodal constructor
   * @constructor
   * @param {jQuery} $modal
   * @param {Object} options
   */
  function Remodal($modal, options) {
    var $body = $(document.body);
    var $appendTo = $body;
    var remodal = this;

    remodal.settings = $.extend({}, DEFAULTS, options);
    remodal.index = $[PLUGIN_NAME].lookup.push(remodal) - 1;
    remodal.state = STATES.CLOSED;

    remodal.$overlay = $('.' + namespacify('overlay'));

    if (remodal.settings.appendTo !== null && remodal.settings.appendTo.length) {
      $appendTo = $(remodal.settings.appendTo);
    }

    if (!remodal.$overlay.length) {
      remodal.$overlay = $('<div>').addClass(namespacify('overlay') + ' ' + namespacify('is', STATES.CLOSED)).hide();
      $appendTo.append(remodal.$overlay);
    }

    remodal.$bg = $('.' + namespacify('bg')).addClass(namespacify('is', STATES.CLOSED));

    remodal.$modal = $modal
      .addClass(
        NAMESPACE + ' ' +
        namespacify('is-initialized') + ' ' +
        remodal.settings.modifier + ' ' +
        namespacify('is', STATES.CLOSED))
      .attr('tabindex', '-1');

    remodal.$wrapper = $('<div>')
      .addClass(
        namespacify('wrapper') + ' ' +
        remodal.settings.modifier + ' ' +
        namespacify('is', STATES.CLOSED))
      .hide()
      .append(remodal.$modal);
    $appendTo.append(remodal.$wrapper);

    // Add the event listener for the close button
    remodal.$wrapper.on('click.' + NAMESPACE, '[data-' + PLUGIN_NAME + '-action="close"]', function(e) {
      e.preventDefault();

      remodal.close();
    });

    // Add the event listener for the cancel button
    remodal.$wrapper.on('click.' + NAMESPACE, '[data-' + PLUGIN_NAME + '-action="cancel"]', function(e) {
      e.preventDefault();

      remodal.$modal.trigger(STATE_CHANGE_REASONS.CANCELLATION);

      if (remodal.settings.closeOnCancel) {
        remodal.close(STATE_CHANGE_REASONS.CANCELLATION);
      }
    });

    // Add the event listener for the confirm button
    remodal.$wrapper.on('click.' + NAMESPACE, '[data-' + PLUGIN_NAME + '-action="confirm"]', function(e) {
      e.preventDefault();

      remodal.$modal.trigger(STATE_CHANGE_REASONS.CONFIRMATION);

      if (remodal.settings.closeOnConfirm) {
        remodal.close(STATE_CHANGE_REASONS.CONFIRMATION);
      }
    });

    // Add the event listener for the overlay
    remodal.$wrapper.on('click.' + NAMESPACE, function(e) {
      var $target = $(e.target);

      if (!$target.hasClass(namespacify('wrapper'))) {
        return;
      }

      if (remodal.settings.closeOnOutsideClick) {
        remodal.close();
      }
    });
  }

  /**
   * Opens a modal window
   * @public
   */
  Remodal.prototype.open = function() {
    var remodal = this;
    var id;

    // Check if the animation was completed
    if (remodal.state === STATES.OPENING || remodal.state === STATES.CLOSING) {
      return;
    }

    id = remodal.$modal.attr('data-' + PLUGIN_NAME + '-id');

    if (id && remodal.settings.hashTracking) {
      scrollTop = $(window).scrollTop();
      location.hash = id;
    }

    if (current && current !== remodal) {
      halt(current);
    }

    current = remodal;
    lockScreen();
    remodal.$bg.addClass(remodal.settings.modifier);
    remodal.$overlay.addClass(remodal.settings.modifier).show();
    remodal.$wrapper.show().scrollTop(0);
    remodal.$modal.focus();

    syncWithAnimation(
      function() {
        setState(remodal, STATES.OPENING);
      },

      function() {
        setState(remodal, STATES.OPENED);
      },

      remodal);
  };

  /**
   * Closes a modal window
   * @public
   * @param {String} reason
   */
  Remodal.prototype.close = function(reason) {
    var remodal = this;

    // Check if the animation was completed
    if (remodal.state === STATES.OPENING || remodal.state === STATES.CLOSING || remodal.state === STATES.CLOSED) {
      return;
    }

    if (
      remodal.settings.hashTracking &&
      remodal.$modal.attr('data-' + PLUGIN_NAME + '-id') === location.hash.substr(1)
    ) {
      location.hash = '';
      $(window).scrollTop(scrollTop);
    }

    syncWithAnimation(
      function() {
        setState(remodal, STATES.CLOSING, false, reason);
      },

      function() {
        remodal.$bg.removeClass(remodal.settings.modifier);
        remodal.$overlay.removeClass(remodal.settings.modifier).hide();
        remodal.$wrapper.hide();
        unlockScreen();

        setState(remodal, STATES.CLOSED, false, reason);
      },

      remodal);
  };

  /**
   * Returns a current state of a modal
   * @public
   * @returns {STATES}
   */
  Remodal.prototype.getState = function() {
    return this.state;
  };

  /**
   * Destroys a modal
   * @public
   */
  Remodal.prototype.destroy = function() {
    var lookup = $[PLUGIN_NAME].lookup;
    var instanceCount;

    halt(this);
    this.$wrapper.remove();

    delete lookup[this.index];
    instanceCount = $.grep(lookup, function(instance) {
      return !!instance;
    }).length;

    if (instanceCount === 0) {
      this.$overlay.remove();
      this.$bg.removeClass(
        namespacify('is', STATES.CLOSING) + ' ' +
        namespacify('is', STATES.OPENING) + ' ' +
        namespacify('is', STATES.CLOSED) + ' ' +
        namespacify('is', STATES.OPENED));
    }
  };

  /**
   * Special plugin object for instances
   * @public
   * @type {Object}
   */
  $[PLUGIN_NAME] = {
    lookup: []
  };

  /**
   * Plugin constructor
   * @constructor
   * @param {Object} options
   * @returns {JQuery}
   */
  $.fn[PLUGIN_NAME] = function(opts) {
    var instance;
    var $elem;

    this.each(function(index, elem) {
      $elem = $(elem);

      if ($elem.data(PLUGIN_NAME) == null) {
        instance = new Remodal($elem, opts);
        $elem.data(PLUGIN_NAME, instance.index);

        if (
          instance.settings.hashTracking &&
          $elem.attr('data-' + PLUGIN_NAME + '-id') === location.hash.substr(1)
        ) {
          instance.open();
        }
      } else {
        instance = $[PLUGIN_NAME].lookup[$elem.data(PLUGIN_NAME)];
      }
    });

    return instance;
  };

  $(document).ready(function() {

    // data-remodal-target opens a modal window with the special Id
    $(document).on('click', '[data-' + PLUGIN_NAME + '-target]', function(e) {
      e.preventDefault();

      var elem = e.currentTarget;
      var id = elem.getAttribute('data-' + PLUGIN_NAME + '-target');
      var $target = $('[data-' + PLUGIN_NAME + '-id="' + id + '"]');

      $[PLUGIN_NAME].lookup[$target.data(PLUGIN_NAME)].open();
    });

    // Auto initialization of modal windows
    // They should have the 'remodal' class attribute
    // Also you can write the `data-remodal-options` attribute to pass params into the modal
    $(document).find('.' + NAMESPACE).each(function(i, container) {
      var $container = $(container);
      var options = $container.data(PLUGIN_NAME + '-options');

      if (!options) {
        options = {};
      } else if (typeof options === 'string' || options instanceof String) {
        options = parseOptions(options);
      }

      $container[PLUGIN_NAME](options);
    });

    // Handles the keydown event
    $(document).on('keydown.' + NAMESPACE, function(e) {
      if (current && current.settings.closeOnEscape && current.state === STATES.OPENED && e.keyCode === 27) {
        current.close();
      }
    });

    // Handles the hashchange event
    $(window).on('hashchange.' + NAMESPACE, handleHashChangeEvent);
  });
});

/*!
 * JavaScript Cookie v2.2.0
 * https://github.com/js-cookie/js-cookie
 *
 * Copyright 2006, 2015 Klaus Hartl & Fagner Brack
 * Released under the MIT license
 */
;(function (factory) {
	var registeredInModuleLoader = false;
	if (typeof define === 'function' && define.amd) {
		define(factory);
		registeredInModuleLoader = true;
	}
	if (typeof exports === 'object') {
		module.exports = factory();
		registeredInModuleLoader = true;
	}
	if (!registeredInModuleLoader) {
		var OldCookies = window.Cookies;
		var api = window.Cookies = factory();
		api.noConflict = function () {
			window.Cookies = OldCookies;
			return api;
		};
	}
}(function () {
	function extend () {
		var i = 0;
		var result = {};
		for (; i < arguments.length; i++) {
			var attributes = arguments[ i ];
			for (var key in attributes) {
				result[key] = attributes[key];
			}
		}
		return result;
	}

	function init (converter) {
		function api (key, value, attributes) {
			var result;
			if (typeof document === 'undefined') {
				return;
			}

			// Write

			if (arguments.length > 1) {
				attributes = extend({
					path: '/'
				}, api.defaults, attributes);

				if (typeof attributes.expires === 'number') {
					var expires = new Date();
					expires.setMilliseconds(expires.getMilliseconds() + attributes.expires * 864e+5);
					attributes.expires = expires;
				}

				// We're using "expires" because "max-age" is not supported by IE
				attributes.expires = attributes.expires ? attributes.expires.toUTCString() : '';

				try {
					result = JSON.stringify(value);
					if (/^[\{\[]/.test(result)) {
						value = result;
					}
				} catch (e) {}

				if (!converter.write) {
					value = encodeURIComponent(String(value))
						.replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
				} else {
					value = converter.write(value, key);
				}

				key = encodeURIComponent(String(key));
				key = key.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
				key = key.replace(/[\(\)]/g, escape);

				var stringifiedAttributes = '';

				for (var attributeName in attributes) {
					if (!attributes[attributeName]) {
						continue;
					}
					stringifiedAttributes += '; ' + attributeName;
					if (attributes[attributeName] === true) {
						continue;
					}
					stringifiedAttributes += '=' + attributes[attributeName];
				}
				return (document.cookie = key + '=' + value + stringifiedAttributes);
			}

			// Read

			if (!key) {
				result = {};
			}

			// To prevent the for loop in the first place assign an empty array
			// in case there are no cookies at all. Also prevents odd result when
			// calling "get()"
			var cookies = document.cookie ? document.cookie.split('; ') : [];
			var rdecode = /(%[0-9A-Z]{2})+/g;
			var i = 0;

			for (; i < cookies.length; i++) {
				var parts = cookies[i].split('=');
				var cookie = parts.slice(1).join('=');

				if (!this.json && cookie.charAt(0) === '"') {
					cookie = cookie.slice(1, -1);
				}

				try {
					var name = parts[0].replace(rdecode, decodeURIComponent);
					cookie = converter.read ?
						converter.read(cookie, name) : converter(cookie, name) ||
						cookie.replace(rdecode, decodeURIComponent);

					if (this.json) {
						try {
							cookie = JSON.parse(cookie);
						} catch (e) {}
					}

					if (key === name) {
						result = cookie;
						break;
					}

					if (!key) {
						result[name] = cookie;
					}
				} catch (e) {}
			}

			return result;
		}

		api.set = api;
		api.get = function (key) {
			return api.call(api, key);
		};
		api.getJSON = function () {
			return api.apply({
				json: true
			}, [].slice.call(arguments));
		};
		api.defaults = {};

		api.remove = function (key, attributes) {
			api(key, '', extend(attributes, {
				expires: -1
			}));
		};

		api.withConverter = init;

		return api;
	}

	return init(function () {});
}));

/**
 * Created by Richard on 07/07/2017.
 */
/**
 * Created by Richard on 19/09/2016.
 */


//FidVids - uses custom selector because the youtube vid is lazy loaded so does not exist until modal is opened
//$("[data-fitvid]").fitVids({ customSelector: "iframe[data-youtube-iframe]"});

console.log('ACSHOPIFY2');
ACSHOPIFY = {
    common: {
        init: function () {

            'use strict';
            //uncomment to debug
            console.log('common tester');



            var newVisitor = false;
            var repeatVisitor = Cookies.get("ac-repeat-visitor");
            var expiresSetting = $("#remodalPopupPromo").attr('data-expires');
            var expires = new Date(new Date().getTime() + expiresSetting * 60 * 60 * 24 * 1000);
            var expiresCookie = Cookies.get("ac-popup-expires");

            if(expiresCookie != expiresSetting){
                Cookies.set("ac-popup-expires", expiresSetting );
                expiresCookie = Cookies.get('ac-popup-expires');
                Cookies.set("ac-repeat-visitor", 1, { expires : expires  } )
            }

            console.log(expiresSetting);

            if (repeatVisitor != 1 ){
                newVisitor = true;
                Cookies.set("ac-repeat-visitor", 1, { expires : expires  } )
            }else{
                newVisitor = false;
            }

            if(newVisitor == true){
                $(function(){
                    var inst = $.remodal.lookup[$('[data-remodal-id=modal]').data('remodal')];
                    inst.open();
                })
            }



            //add js class

            $('body').addClass('js');

            //Flickity
            $('.hero__carousel').flickity({
                // options
                cellAlign: 'center',
                contain: true,
                //autoPlay: 5000,
                imagesLoaded: true,
                wrapAround: true,
                adaptiveHeight: true
            });

            //menu button
            var showButton = $('#menuButtonOpen, #menuButtonClose');
            var container = document.getElementById('primaryNavigation');
            ACSHOPIFY.ac_fn.open(container, showButton);

            //filter button
            var showButton = $('#filterButtonOpen, #filterButtonClose');
            var container = document.getElementById('filterContainer');
            ACSHOPIFY.ac_fn.open(container, showButton);

            //Search Button
            var showButton = $('#searchControl, #searchControlClose');
            var container = document.getElementById('searchFormMain');
            ACSHOPIFY.ac_fn.open(container, showButton);

            //Search New Address
            var showButton = $('#addressNewOpen, #addressNewClose');
            var container = document.getElementById('addressNewForm');
            ACSHOPIFY.ac_fn.open(container, showButton);

            //Edit Address Cards
            $('.customer-address__address-card').each(function () {
                var formId = $(this).data('form-id');
                //console.log('formId' + formId);
                //address button
                var showButton = $('.address-edit-toggle', this);
                var container = $(this);
                ACSHOPIFY.ac_fn.open(container, showButton);
            })

            var inactiveAccess = ($('[data-customer-access=inactive]').length > 0) ? true : false ;
            var accessNotificationSent = Cookies.get('ac-accessNotificationSent');

            var sendAccessNotification = (inactiveAccess == true && accessNotificationSent != 1) ? true : false;
           //var sendAccessNotification =  true;

            if (inactiveAccess == true){
                Cookies.set("ac-inactiveAccess", 1, { expires : 1 });
            }else{
                Cookies.set("ac-inactiveAccess", 0, { expires : 1 });

            }

            var first_name = $('[data-customer-first-name]').attr('data-customer-first-name');
            var last_name = $('[data-customer-last-name]').attr('data-customer-last-name');
            var email = $('[data-customer-email]').attr('data-customer-email');
            var phone = '';
            var mobile = '';

            var company = '';
            var vat = $('[name="customer[note][vat]"]').val();
            var company_type = $('[name="customer[note][company type]"]').val();

            var address1 = $('[name="customer[note][address1]"]').val();
            var address2 = $('[name="customer[note][address2]"]').val();
            var city = $('[name="customer[note][city]"]').val();
            var postcode = $('[name="customer[note][postcode]"]').val();
            var country = $('[name="customer[note][country]"]').val();

            var referrer = '';

            console.log('email - ' + email );

            if (sendAccessNotification == true){
                var data = {
                    'action': 'contact_form',
                    'first_name': first_name,
                    'last_name': last_name,
                    'email': email,
                    'subject': 'Tempest Design inactive access',
                    'title': 'A customer attempted to access their account but it is currently inactive.'
                }
                $.ajax({
                    type: "POST",
                    async: true,
                    url: 'http://tpd.ambercouch.co.uk/script/contact_form.php',
                    data: data,
                    error: function (jqXHR, textStatus, errorThrown) {
                        //  Request Failed.
                        console.log('Ajax failed')
                    },
                    success: function (response) {
                        // Assume Success. 'response' is the complete HTML page of the
                        // contact success form, so likely won't be helpful
                        console.log('Ajax yes!')
                    }
                });
                console.log('send access notification');
                Cookies.set("ac-accessNotificationSent", 1, { expires : 1 });
            }else{
                console.log('dont send access notification');
            }

            var submit = false;

            $(document).on('submit', 'form#create_customer', function (event) {

                first_name = $('[name="customer[first_name]"]').val();
                last_name = $('[name="customer[last_name]"]').val();
                email = $('[name="customer[email]"]').val();
                phone = $('[name="customer[note][tel]"]').val();
                mobile = $('[name="customer[note][mobile]"]').val();

                company = $('[name="customer[note][company]"]').val();
                vat = $('[name="customer[note][vat]"]').val();
                company_type = $('[name="customer[note][company type]"]').val();

                address1 = $('[name="customer[note][address1]"]').val();
                address2 = $('[name="customer[note][address2]"]').val();
                city = $('[name="customer[note][city]"]').val();
                postcode = $('[name="customer[note][postcode]"]').val();
                country = $('[name="customer[note][country]"]').val();

                referrer = $('[name="customer[note][referrer]"]').val();



                if(submit == false) {
                    event.preventDefault();
                    var data = {
                        'action': 'contact_form',
                        'first_name': first_name,
                        'last_name': last_name,
                        'phone': phone,
                        'mobile': mobile,
                        'email': email,

                        'company': company,
                        'vat' : vat,
                        'company_type' : company_type,

                        'address1': address1,
                        'address2': address2,
                        'city': city,
                        'postcode': postcode,
                        'country': country,

                        'referrer': referrer,

                        'subject': 'Tempest Design New Signup',
                        'title': 'A new customer account request has been received'

                    }
                    $.ajax({
                        type: "POST",
                        async: true,
                        url: 'http://tpd.ambercouch.co.uk/script/contact_form.php',
                        data: data,
                        error: function (jqXHR, textStatus, errorThrown) {
                            //  Request Failed.
                            submit = true;
                            $('form#create_customer').submit();
                            console.log(data);
                            console.log('data.vat' + data.vat);

                        },
                        success: function (response) {
                            // Assume Success. 'response' is the complete HTML page of the
                            // contact success form, so likely won't be helpful
                            submit = true;
                            $('form#create_customer').submit();
                            console.log(data);
                            console.log('data.vat' + data.vat);

                        }
                    });
                }
            })



            $(function(){
                $('.filter-menu h4').on('click', function(e){
                    $(this).closest('.filter-group').not('.has_group_selected, .refine-header').toggleClass('expanded').find('ul,.filter-clear').toggle('fast');
                    e.preventDefault();
                });

                /* Expand first non-selected group on page load */
                $('.filter-group').not('.has_group_selected, .refine-header').first().addClass('expanded').find('ul,.filter-clear').slideDown('fast');
            });




            //REMODAL VIDEOS
            // $(document).on('closed', '.remodal', function(){
            //     var src;
            //     var dataSrc;
            //     $('[data-src]', this).each(function(){
            //         dataSrc =  $(this).attr('src');
            //         $(this).attr('data-src', dataSrc );
            //         $(this).attr('src', '');
            //     });
            // });

            // $(document).on('opened', '.remodal', function(){
            //     var src;
            //     var dataSrc;
            //     var $remodal = $(this);
            //
            //     $('[data-src]', this).each(function(){
            //         dataSrc =  $(this).attr('data-src');
            //         if(dataSrc != undefined){
            //             $(this).attr('src', dataSrc)
            //         }
            //     });
            // });

            //TOOLTIPS
            // $(document).on('mouseover', '[data-toggle=tooltip]', function () {
            //
            //     var title = $(this).attr('title');
            //     $(this).attr('data-original-title', title );
            //     $(this).attr('title', '' );
            //     $('.tooltip').addClass('bounceInDown');
            //     $('.tooltip__container').addClass('active');
            // })
            // $(document).on('mouseout', '[data-toggle=tooltip]', function () {
            //
            //     var title = $(this).attr('data-original-title');
            //     $(this).attr('data-original-title', '' );
            //     $(this).attr('title', title);
            //     $('.tooltip').removeClass('bounceInDown');
            //     $('.tooltip__container').removeClass('active');
            // })

            // var $mouseX = 0, $mouseY = 0;
            // var $xp = 0, $yp =0;
            //
            // $(document).on('mousemove','#mapExplore',function(e){
            //     $mouseX = e.clientX;
            //     $mouseY = e.clientY;
            // });

            // var $loop = setInterval(function(){
            //     // change 12 to alter damping higher is slower
            //     $xp += (($mouseX - $xp));
            //     $yp += (($mouseY - $yp));
            //     $("#mapTooltip").css({left:$xp +'px', top:$yp +'px'});
            // }, 30);

            // $('.hero-list__list').flickity({
            //     // options
            //     cellAlign: 'center',
            //     contain: true,
            //     wrapAround: true,
            //     lazyLoad: 2,
            //     imagesLoaded: true,
            //     pageDots: false
            // });

            // $('.subsidiary-news__list').flickity({
            //     // options
            //     cellAlign: 'center',
            //     contain: true,
            //     wrapAround: true,
            //     lazyLoad: 2,
            //     imagesLoaded: true,
            //     pageDots: true
            // });



            /**
             * navigation.js
             *
             * Handles toggling the navigation menu for small screens.
             */
            //( function() {
            //  var container, button, menu;
            //
            //  container = document.getElementById( 'main-navigation' );
            //  if ( ! container ) {
            //    return;
            //  }
            //
            //
            //  button = test;//document.getElementsByClassName( 'responsive-toggle' )[0];
            //  if ( 'undefined' === typeof button ) {
            //    button = container.querySelectorAll('.responsive-toggle')[0]
            //  }
            //  if ( 'undefined' === typeof button ) {
            //    return;
            //  }
            //
            //  menu = container.getElementsByTagName( 'ul' )[0];
            //
            //  // Hide menu toggle button if menu is empty and return early.
            //  if ( 'undefined' === typeof menu ) {
            //    button.style.display = 'none';
            //    return;
            //  }
            //
            //  menu.setAttribute( 'aria-expanded', 'false' );
            //
            //  if ( -1 === menu.className.indexOf( 'nav-menu' ) ) {
            //    menu.className += ' nav-menu';
            //  }
            //
            //  button.onclick = function() {
            //    if ( -1 !== container.className.indexOf( 'toggled' ) ) {
            //      container.className = container.className.replace( ' toggled', '' );
            //      button.setAttribute( 'aria-expanded', 'false' );
            //      menu.setAttribute( 'aria-expanded', 'false' );
            //    } else {
            //      container.className += ' toggled';
            //      button.setAttribute( 'aria-expanded', 'true' );
            //      menu.setAttribute( 'aria-expanded', 'true' );
            //    }
            //  };
            //} )();
            //



            console.log('ajax cart');
            function refreshCart(cart) {
                var $cartBtn = $("[data-button-cart]");
                // console.log('$cartBtn');
                // console.log($cartBtn);
                // console.log('cart');
                // console.log(cart);
                if ($cartBtn) {
                    var $cartCount = $cartBtn.find('[data-cart-count]');
                    if(cart.item_count == 0) {

                    } else if ($cartCount.length) {
                        $cartCount.text(cart.item_count);
                    }
                }
            }

            $(document).on('click', '[data-close=continue-shopping-helper]' ,function (e) {
                e.preventDefault();
               $('.continue-shopping-helper').addClass('animated fadeOutRight');
                setTimeout(function(){
                    $('.continue-shopping-helper').hide().removeClass('fadeOutRight');
                }, 1000);

                //$('.continue-shopping-helper').unbind('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend');
            });

            $(".add-form__form").submit(function(e) {
                console.log('add click');
                e.preventDefault();
                var $addToCartForm = $(this);
                var $addToCartBtn = $addToCartForm.find('.add-form__submit-btn');

                $.ajax({
                    url: '/cart/add.js',
                    dataType: 'json',
                    type: 'post',
                    data: $addToCartForm.serialize(),
                    beforeSend: function() {
                        $addToCartBtn.attr('disabled', 'disabled').addClass('disabled');
                        //$addToCartBtn.find('span').text('Adding').removeClass("zoomIn").addClass('animated zoomOut');
                    },
                    success: function(itemData) {
                        //$addToCartBtn.find('span').text('Added to your Cart').removeClass('zoomOut').addClass('fadeIn');
                       // $addToCartForm.find('.add-form__submit-btn').show().addClass('animated fadeInLeft');
                        $addToCartForm.find('.continue-shopping-helper').show().addClass('animated fadeInDown');

                        window.setTimeout(function(){
                            $addToCartBtn.removeAttr('disabled').removeClass('disabled');
                            $addToCartBtn.find('span').addClass("fadeOut").text($addToCartBtn.data('label')).removeClass('fadeIn').removeClass("fadeOut").addClass('zoomIn');
                        }, 2500);




                        $.getJSON("/cart.js", function(cart) {
                            refreshCart(cart);
                        });
                    },
                    error: function(XMLHttpRequest) {
                        var response = eval('(' + XMLHttpRequest.responseText + ')');
                        response = response.description;
                        // $('.warning').remove();

                        var warning = '<p>' + response.replace('All 1 ', 'All ') + '</p>';

                            // $('.continue-shopping-helper__notice').addClass(' warning animated bounceIn ');
                            $('.continue-shopping-helper__notice-content').html(warning);
                        $addToCartForm.find('.continue-shopping-helper').show();
                        $('.continue-shopping-helper__notice--added, .continue-shopping-helper__notice--warning').removeClass('continue-shopping-helper__notice--added animated bounceIn').addClass('continue-shopping-helper__notice--warning animated bounceIn').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
                            $(this).removeClass('animated bounceIn');
                        });
                        $addToCartBtn.removeAttr('disabled').removeClass('disabled');
                        //$addToCartBtn.find('span').text("Add to Cart").removeClass('zoomOut').addClass('zoomIn');
                    }
                });

                return false;
            });


            // Predictive search
            var $searchResults = $('#search-site-results');

            $('#Search').on('keyup',function() {
              var searchTerm = $(this).val();

              if ( searchTerm.length > 2 ) {
                var data = {
                  'q': searchTerm,
                  'resources': {
                    'type': 'product',
                    'limit': 10,
                    // 'options': {
                    //   'unavailable_products': 'last',
                    //   'fields': 'title,product_type,variants.title'
                    // }
                  }
                };

                $.ajax({
                  dataType: 'json',
                  url: '/search/suggest.json',
                  data: data,
                  success: function( response ) {
                    var productSuggestions = response.resources.results.products;

                    $searchResults.empty();

                    if ( productSuggestions.length === 0 ) {
                      $searchResults.hide();

                    } else {
                      // If we have results.
                      $.each(productSuggestions, function(index, item) {
                        var link = $('<a></a>').attr('href', item.url);
                        link.append('<span class="thumbnail"><img src="' + item.image + '" /></span>');
                        link.append('<span class="title">' + item.title + '</span>');
                        link.wrap('<div class="result-item"></div>');

                        $searchResults.append(link.parent());
                      });

                      // The Ajax request will return at the most 10 results.
                      // If there are more than 10, let's link to the search results page.
                      // if(response.resources.results.results_count > 10) {
                      //   $searchResults.append('<li><span class="title"><a href="' + searchURL + '">See all results (' + response.resources.results.results_count + ')</a></span></li>');
                      // }

                      $searchResults.fadeIn(200);
                    }
                  }
                });

              }
            });

            // Hide the predictive search results container if clicked outside

            $(document).on('click', function( event ) {
              var $target = $(event.target);

              if ( !$target.closest('#search-site-results').length && !$target.closest('#Search').length && $searchResults.is(':visible') ) {
                $searchResults.empty();
                $searchResults.hide();
              }
            });

        }
    },
    page: {
        init: function () {
            //uncomment to debug
            //console.log('pages');
        }
    },
   collection: {
        init: function () {
            //uncomment to debug
            console.log('collection');
            var currentUrlPath = $('body').attr('data-url-path');
            Cookies.set('lastCollectionPath', currentUrlPath,  { expires: 1 })

            //hover animation
            $(document).on('mouseenter', '.product-thumb.is-available-sold-out', function (event) {
                //console.log($(this));
                $(this).find('[data-hover-animation]').addClass(' animated fadeInUp ')
            })

            //hover over the reminder
            $(document).on('mouseenter', '[data-get-reminder]', function(event){
                console.log('hovered')
                var productUrl = $(this).parent().attr('href');
                console.log(productUrl);
                $(this).parent().removeAttr("href");
                $(this).parent().attr("data-href", productUrl);
                //$(this).parent().attr('href');
            });


            $(document).on('mouseleave', '[data-get-reminder]', function(event){
                console.log('Leave it out')
                var productUrl = $(this).parent().attr('data-href');
                //$(this).parent().removeAttr("href");
                $(this).parent().attr("href", productUrl);
            });

            $(document).on('click', '[data-get-reminder]', function(event){
                var productUrl = $(this).attr('data-get-reminder');
                Cookies.set('openStockReminder', 'true', {expires: 1});
                console.log('reminder click')
               window.location = productUrl

            });


        }//end collection.init
    },
    product: {
        init: function () {
            //uncomment to debug
            console.log('product');

            var openStockReminder = Cookies.get('openStockReminder');
            var currentUrlPath = $('body').attr('data-url-path');
            console.log('currentUrlPath = ' + currentUrlPath );
            Cookies.set('lastProductPath', currentUrlPath,  { expires: 1 })
            console.log('Cookies.get(lastProductPath)'+Cookies.get('lastProductPath'));
            //alert(openStockReminder);
            if(openStockReminder == 'true'){

                ACSHOPIFY.ac_fn.defer('undefined','undefined','undefined','undefined',3);

            }else{
                console.log('we have no reminder');
            }


            $(document).on('click', '.product-gallery__img', function (e) {
                var src = $(this).attr('data-variantimage');
                var href = $(this).attr('data-variantlink');

                $('[data-product-featured-image]').attr('src', src);
                $('[data-product-featured-link]').attr('href', href);
                console.log($(this).attr('data-variantimage'));
            })
        }
    },
    cart: {
        init: function () {
            //uncomment to debug
            //console.log('cart template');
            var lastCollectionPath = Cookies.get('lastCollectionPath');
            var lastProductPath = Cookies.get('lastProductPath');

            if (lastCollectionPath != 'undefined'){
                $('[data-continue-path]').attr('href', lastCollectionPath);
            }else if(lastProductPath != 'undefined'){
                $('[data-continue-path]').attr('href', lastProductPath);
            }else {
                $('[data-continue-path]').attr('href', '/');
            }
        }

    },
    var: {
        locale: ''
    },
    ac_fn:{
        locale: function (local) {

            if(local === undefined)
            {
                return ACSHOPIFY.var.locale
            }else{
                ACSHOPIFY.var.locale = local;
                return ACSHOPIFY.var.locale;
            }

        },
        open: function (container, showButton, parent, listParent) {
            var elState = showButton.attr('data-state');
            showButton.on('click', function(e){
                e.preventDefault();
                console.log('clicker');
                elState = showButton.attr('data-state');
                if ('off' === elState ) {
                    showButton.attr('data-state', 'on');
                    $(container).attr('data-state', 'on');
                    $(parent).attr('data-state', 'on');
                    $(container).addClass('ac-on');

                } else {
                    $(showButton).attr('data-state', 'off');
                    $(container).attr('data-state', 'off');
                    $(parent).attr('data-state', 'off');
                    $(container).removeClass('ac-on');
                }
            });
        },
        defer: function(successMethod, failMethod, testMethod, pause, attempts) {
            var defTest = function () {
                return $('#ISR_popup_container').length == 1
            };
            var  defFail = function () {
                $( "#ISR_button" ).click();
                console.log('deft clicking it');
            }
            var  defSuccess = function () {
                Cookies.remove('openStockReminder');
                console.log('return def success');;
            }
            attempts = (attempts == 'undefined')? false : attempts;
            pause = (pause == 'undefined')? 50 : pause;
            testMethod = (testMethod == 'undefined')? defTest : testMethod;
            failMethod = (failMethod == 'undefined')? defFail : failMethod;
            successMethod = (successMethod == 'undefined')? defSuccess : successMethod;


            if (testMethod()) {
                defSuccess();
            } else {
                failMethod();
                if(attempts === false || attempts > 0) {
                    setTimeout(function () {
                        attempts = (attempts === false )? attempts : attempts = attempts - 1;
                        ACSHOPIFY.ac_fn.defer(successMethod, failMethod, testMethod, pause, attempts)
                    }, pause);
                }
            }
        }
    },

};

UTIL = {
    exec: function (template, handle) {
        var ns = ACSHOPIFY,
            handle = (handle === undefined) ? "init" : handle;

        if (template !== '' && ns[template] && typeof ns[template][handle] === 'function') {
            ns[template][handle]();
        }
    },
    init: function () {
        var body = document.body,
            template = body.getAttribute('data-template'),
            handle = body.getAttribute('data-handle');

        // TODO: Check to see if the following line is necessary (init for common was firing twice with it enabled) - in relation the search, it meant the search box was opening and then closing immediately
        // UTIL.exec('common');
        UTIL.exec(template);
        UTIL.exec(template, handle);
    }
};
$(window).on('load',UTIL.init);
