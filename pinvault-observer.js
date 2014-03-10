// PinVaultObserver
// ---------------

// A module that can be mixed in to *any object* in order to provide it with
// custom observer events. You may bind with `on` or remove with `off` callback
// functions to an observer; `trigger`-ing an observer fires all callbacks in
// succession by order of best pattern match and first bound.
//
//     var object = {};
//     PinVaultObserver(object);
//     object.on({buzz: 2}, function(){ console.log('buzz'); });
//     object.on({fizz: 1}, function(){ console.log('fizz'); });
//     object.on({fizz: 1, buzz: 2}, function(){ console.log('fizzbuzz'); });
//     object.on({foo: '*'}, function(){ console.log('foo'); });
//     object.trigger({foo: 3, fizz: 1, buzz: 2});
//
// The above code will produce the following in the console:
//
//     fizzbuzz
//     buzz
//     fizz
//     foo
//
// Based on code from Backbone.Events, Lo-Dash and async.js
// Released under an MIT license.

(function (init, context) {

	if ( typeof module === 'object' && module && typeof module.exports === 'object' ) {
		//Running inside node
		module.exports = init(require('pinvault'));

	} else if ( typeof define === 'function' && define.amd ) {
		//Running inside AMD
		define(['pinvault'], function (pinvault) {return init(pinvault);});
	} else {
		//Dunno where we are, add it to the global context with a noConflict

		var previous = context.PinVaultObserver;
		var pvo = init(context.pinvault);
		PinVaultObserver.noConflict = function () {
			context.PinVaultObserver = previous;
			return pvo;
		};
		context.PinVaultObserver = pvo;

	}

})(function (pinvault, undefined) {
	'use strict';

	var PVO = {

		observerDelimiter: false,

		// Bind an event to a `callback` function. Passing `"all"` will bind
		// the callback to all events fired.
		on: function(name, callback, context) {
			if (!callback) {
				return this;
			}
			if (typeof callback !== 'function') {
				throw TypeError;
			}
			if (!this._observers) {
				this._observers = pinvault();
			}
			name = processName(name, this.observerDelimiter);
			this._observers.add(name, {callback: callback, context: context, ctx: context || this});
			return this;
		},

		// Bind an event to only be triggered a single time. After the first time
		// the callback is invoked, it will be removed.
		once: function(name, callback, context) {
			var self = this;
			var once = makeOnce(function() {
				self.off(name, once);
				callback.apply(this, arguments);
			});
			once._callback = callback;
			return this.on(name, once, context);
		},

		// Remove one or many callbacks. If `context` is null, removes all
		// callbacks with that function. If `callback` is null, removes all
		// callbacks for the event. If `name` is null, removes all bound
		// callbacks for all events.
		off: function(name, callback, context) {
			if (!this._observers) return this;
			if (!name && !callback && !context) {
				this._observers = undefined;
				return this;
			}

			name = processName(name, this.observerDelimiter);
			
			var possibles = false, pos;

			//no name specified for removal, so we have to run through all entries and remove anything matching callback or context
			if (!name && (callback || context)) {
				possibles = this._observers.get(undefined, true, true);
			} else if (name && (callback || context)) {
				possibles = this._observers.get(name, true, true);
			}

			// if possible isn't false, that means we need to do a callback/context check
			if (possibles) {
				var i = -1, c = possibles.length;
				while (++i < c) {
					pos = possibles[i];
					if ((callback && (callback === pos.data.callback || callback === pos.data.callback._callback)) || (context && context === pos.data.context)) {
						this._observers.remove(name || JSON.parse(pos.pattern), pos.data);
					}
				}
			} else {
				this._observers.remove(name);
			}

			return this;
		},

		// Trigger one or many events, firing all bound callbacks. Callbacks are
		// passed the same arguments as `trigger` is, apart from the event name
		// (unless you're listening on `"all"`, which will cause your callback to
		// receive the true name of the event as the first argument).
		trigger: function(name) {
			if (!this._observers) return this;
			var args = [].slice.call(arguments, 1);

			name = processName(name, this.observerDelimiter);
			
			var observers = this._observers.match(name);

			var stopped = false;
			var stop = function () {
				stopped = true;
			};

			var observer,
				ev,
				i = -1,
				count = observers.length;

			while (++i < count && !stopped) {
				observer = observers[i];

				ev = {
					value: name,
					matched: JSON.parse(observer.pattern),
					specificity: observer.specificity,
					index: observer.index,
					stop: stop
				};

				// create an invoker in current scope and pass it into a closure wrapper to preserve it's value outside of the loop, then defer the closure
				// this way the values of the invoker are preserved outside of the loop, but `stopped` is still accessible.
				defer((function (cb) {
					return function () { if (!stopped) cb();};
				})(invoker(observer.data.callback, [ev].concat(args), observer.data.ctx, this.onObserverError)));
			}

			return this;
		},

		// Tell this object to stop listening to either specific events ... or
		// to every object it's currently listening to.
		stopListening: function(obj, name, callback) {
			var listeningTo = this._listeningTo;
			if (!listeningTo) return this;

			var remove = !name && !callback;

			if (obj) (listeningTo = {})[obj._listenId] = obj;

			name = processName(name, this.observerDelimiter);

			for (var id in listeningTo) {
				obj = listeningTo[id];
				obj.off(name, callback, this);
				if (remove || obj._observers.length) delete this._listeningTo[id];
			}

			return this;
		}

	};


	// Inversion-of-control versions of `on` and `once`. Tell *this* object to
	// listen to an event in another object ... keeping track of what it's
	// listening to.
	[['listenTo', 'on'], ['listenToOnce', 'once']].forEach(function(tuple) {
		var implementation = tuple[1], method = tuple[0];
		PVO[method] = function(obj, name, callback) {
			var listeningTo = this._listeningTo || (this._listeningTo = {});
			var id = obj._listenId || (obj._listenId = uniqueId('l'));
			listeningTo[id] = obj;
			if (!callback && typeof name === 'object') callback = this;
			obj[implementation](name, callback, this);
			return this;
		};
	});


	function processName(name, observerDelimiter) {
		if (typeof name !== 'string' || !observerDelimiter) {
			return name;
		}
		return name.split(observerDelimiter);
	}


	// creates a string that is unique to this runtime session
	// (based on lo-dash.uniqueId)
	var idCounter = 0;
	function uniqueId(prefix) {
		var id = ++idCounter + '';
		return prefix ? prefix + id : id;
	}

	// creates wrapper function to execute the callback with the supplied arguments in the most performant manner with an isolated scope
	// (based on triggerEvents in Backbone.Events)
	function invoker(callback, args, context, handleError) {
		var a1 = args[0], a2 = args[1], a3 = args[2];
		switch (args.length) {
			case 0:  return function () {try { callback.call( context);             } catch (e) {if (handleError) handleError(e);}};
			case 1:  return function () {try { callback.call( context, a1);         } catch (e) {if (handleError) handleError(e);}};
			case 2:  return function () {try { callback.call( context, a1, a2);     } catch (e) {if (handleError) handleError(e);}};
			case 3:  return function () {try { callback.call( context, a1, a2, a3); } catch (e) {if (handleError) handleError(e);}};
			default: return function () {try { callback.apply(context, args);       } catch (e) {if (handleError) handleError(e);}};
		}
	}

	// creates a debouncer that ensures a function will only be called once
	// (based on lo-dash.once)
	function makeOnce(func) {
		var ran, result;

		return function() {
			if (ran) {
				return result;
			}
			ran = true;
			result = func.apply(this, arguments);

			// clear the `func` variable so the function may be garbage collected
			func = null;
			return result;
		};
	}

	// extends the first argument object with the members of all other argument objects
	// (based on lo-dash.assign)
	function extend(object) {
		if (!object) {
			return object;
		}
		for (var argsIndex = 1, argsLength = arguments.length; argsIndex < argsLength; argsIndex++) {
			var iterable = arguments[argsIndex];
			if (iterable) {
				for (var key in iterable) {
					object[key] = iterable[key];
				}
			}
		}
		return object;
	}

	// defers execution of the callback onto the end of the next event loop cycle
	// (based on code in async.js, extended with code from Timed.js)
	function defer(callback) {
		//if we're not running in node, try the various browser solutions
		if (typeof process === 'undefined' || !(process.nextTick)) {
			//setImmediate, IE10+ feature
			if (typeof setImmediate === 'function') {
				setImmediate(callback);

			//window.postMessage hook
			} else if (typeof postMessage === 'function' && typeof addEventListener === 'function') {
				var id = Math.round(Math.random()*1000000);
				addEventListener('message', function wrapper (event) {
					if (event.data === id) {
						removeEventListener('message', wrapper);
						callback();
					}
				});
				postMessage(id, '*');

			//the old setTimeout method
			} else {
				setTimeout(fn, 1);
			}

		} else {
			//we're running inside node, so just use nextTick
			process.nextTick(callback);
		}
	}

	// the actual PinVaultObserver is simply a mixin function
	return function (target) {
		target = target || {};
		extend(target, PVO);
		return target;
	};

}, this);
