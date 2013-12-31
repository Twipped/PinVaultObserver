#PinVault Observer

An observer/mediator library that supports objects and arrays as event names for partial matching on dispatches and event bubbling.  PVO allows you to define event patterns for object structures, and then trigger multiple events from objects with matching characteristics.

For example, an event `trigger`-ed like so...

```js
myObserver.trigger({
    model: 'user',
    action: 'create',
    user: {
        firstname: 'Jane',
        lastname: 'Smith',
        phone: '555-555-5555',
        type: 'admin'
    }
});
```

... could trigger all of the following event bindings:

```js
myObserver.on({ model: 'user', action: 'create', user: { type: 'admin' }}, function () { console.log('A new admin has been created'); });
myObserver.on({ model: 'user', user: { phone: '*' }}, function () { console.log('A user model with a phone number did something.'); });
myObserver.on({ action: 'create' }, function () { console.log('A model was created'); });
myObserver.on({ model: 'user' }, function () { console.log('A user model did something'); })
myObserver.on({}, function () { console.log('EVERYTHING!'); });
```

The events will be triggered asynchronously in order of highest match specificity and first binding (eg, if the above bindings list were reversed, they would still trigger in the order as they are written now);

#Installation

NPM: `npm install pinvault-observer`

Bower: `bower install pinvault-observer`

PinVaultObserver has a single dependency, [pinvault.js](https://github.com/ChiperSoft/PinVault), and is installed by npm.

##Usage

PVO is a mixin library designed to extend other objects.

In Node or another CommonJS environment:

```js
var pinvaultObserver = require('pinvault');
var mediator = {};
pinvaultObserver(mediator);
```

In an AMD environment such as RequireJS:

```js
require(['pinvault'], function (pinvaultObserver) {
	var mediator = {};
	pinvaultObserver(mediator);
});
```

Loaded directly on a webpage:

```js
var mediator = {};
PinVaultObserver(mediator);
```

PVO will also return the object passed in, and if no value is passed in will substitute an empty object:

```js
var mediator = pinvaultObserver();
```


###mediator.on(pattern, callback, [context])

Binds a `callback` function to the mediator object. The callback will be invoked whenever the mediator's `trigger()` function
is called with a value that the passed pattern matches against.

- `pattern` (mixed) - What event name or object pattern to watch for. This may be an object, array, string or integer.
- `callback` (function) - The callback function to be triggered when a `trigger`-ed dispatch matches.
- `context` (object, optional) - The object to be used as `this` when the callback is triggered. If omitted, the callback is executed with the mediator object as `this`

If `mediator.observerDelimiter` contains a value and `pattern` contains a string, the pattern will first be split according to the delimiter and matched against as an array.

```js
var someClass = function () {
    //bind our class to any events with foo values
    //and call the onFoo function with our context
    mediator.on({foo: '*'}, this.onFoo, this);
};
someClass.prototype.onFoo = function (ev, arg1, arg2) {
    console.log('object passed to trigger:', ev.value);
    console.log('second argument passed to trigger:', arg1);
    console.log('third argument passed to trigger:', arg2);
    ev.stop(); //don't execute any more event bindings after this one.
};
```



###mediator.off([pattern], [callback], [context])

Remove a previously-bound `callback` function from an object. If no `context` is specified, all of the versions of the callback with different contexts will be removed. If no callback is specified, all callbacks for the event will be removed. If only a context is supplied, all bindings using that context are removed. If no arguments are provided, all callbacks are unbound.

- `pattern` (mixed) - What event name or object pattern the callback is watching for. This may be an object, array, string or integer.
- `callback` (function) - The callback function to be triggered when a `trigger`-ed dispatch matches.
- `context` (object, optional) - The object to be used as `this` when the callback is triggered. If omitted, the callback is executed with the mediator object as `this`

If `mediator.observerDelimiter` contains a value and `pattern` contains a string, the pattern will first be split according to the delimiter and matched against as an array.

```js
// Removes just the `onChange` callback.
mediator.off({foo: 1}, onChange);

// Removes all callbacks matching `{foo: 1}`.
mediator.off({foo: 1});

// Removes the `onChange` callback for all events.
mediator.off(null, onChange);

// Removes all callbacks for `context` for all events.
mediator.off(null, null, context);

// Removes all callbacks on `mediator`.
mediator.off();
```

###mediator.trigger(input)

Trigger all callbacks that match against the given input. Subsequent arguments to trigger will be passed along to the event callbacks.  Input may be an object, array, string or integer.

If `mediator.observerDelimiter` contains a value and the input is a string, the input will first be split according to the delimiter and matched against as an array.


###mediator.once(input)

Just like on, but causes the bound callback to only fire once before being removed. Handy for saying "the next time that X happens, do this".

###mediator.listenTo(otherMediator, pattern, callback)

Tell `mediator` to listen for an event `pattern` on `otherMediator`. The advantage of using this form, instead of `otherMediator.on(event, callback, object)`, is that `listenTo` allows the `mediator` to keep track of the events, and they can be removed all at once later on. The callback will always be called with `mediator` as the `this` context.

###mediator.stopListening([otherMediator], [pattern], [callback])

Tell `mediator` to stop listening for an event `pattern` on `otherMediator`.  If any argument is omitted, `mediator` will unbind any events matching the provided arguments.  If all arguments are omited, `mediator` will unbind all external events.

###mediator.listenToOnce(otherMediator, pattern, callback)

The `once` equivalent for `listenTo`.  The bound callback will only be fired a single time.


###mediator.observerDelimiter = false

This property identifies what character to use to split string based name patterns.  When set to a string value, any string event patterns will be split and converted into arrays.  This allows for namespaced event names that will bubble up the namespace tree.

For example, if the delimiter were set to `':'`, then an event name of 'user:create:admin' would match against bindings for 'user', 'user:create', 'user:*:admin' and 'user:create:admin'

This value defaults to false, disabling the feature, and must be set after PVO is mixed in to an object.


##Running Unit Tests

From inside the repository root, run `npm install` to install the NodeUnit dependency.

Run `npm test` to execute the complete test suite.

##License and Accreditation

PinVaultObserver is released under a standard MIT license, as defined in the LICENSE file.

PVO is based upon code in other MIT libraries, namely:

- Backbone.Events
- Lo-Dash
- async.js