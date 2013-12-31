
var pvo = require('../pinvault-observer');

exports['requirement'] = function (test) {
	test.strictEqual(typeof pvo, 'function', 'pvo is a function');
	test.done();
};

exports['initialization without target'] = function(test){
	var observer = pvo();

	test.strictEqual(typeof observer, 'object', 'Observer is an object');

	test.deepEqual(Object.keys(observer), ['observerDelimiter', 'on', 'once', 'off', 'trigger', 'stopListening', 'listenTo', 'listenToOnce'], 'Found expected functions');

	test.done();
};

exports['initialization with object'] = function(test){
	var observer = pvo({
		originalValue: true
	});

	test.strictEqual(typeof observer, 'object', 'Observer is an object');

	test.deepEqual(Object.keys(observer), ['originalValue', 'observerDelimiter', 'on', 'once', 'off', 'trigger', 'stopListening', 'listenTo', 'listenToOnce'], 'Found expected functions');

	test.done();
};

exports['initialization with target'] = function(test){
	var observer = {
		originalValue: true
	};

	pvo(observer);

	test.strictEqual(typeof observer, 'object', 'Observer is an object');

	test.deepEqual(Object.keys(observer), ['originalValue', 'observerDelimiter', 'on', 'once', 'off', 'trigger', 'stopListening', 'listenTo', 'listenToOnce'], 'Found expected functions');

	test.done();
};

exports['initialization without target'] = function(test){
	test.expect(2);
	var observer = pvo();

	observer.on('event', function () {
		test.ok(true);
		test.done();
	});

	// console.log(require('util').inspect(observer._observers.dump(), {colors: true, depth: 10}));

	test.deepEqual(Object.keys(observer), ['observerDelimiter', 'on', 'once', 'off', 'trigger', 'stopListening', 'listenTo', 'listenToOnce', '_observers'], '_observers was created');

	observer.trigger('event');

};


exports["multiple triggers"] = function(test) {
	test.expect(5);
	var obj = pvo({ counter: 0 });

	obj.on('event', function() {
		test.ok(++obj.counter);
		if (obj.counter == 5) {
			test.done();
		}
	});
	obj.trigger('event');
	obj.trigger('event');
	obj.trigger('events');
	obj.trigger('event');
	obj.trigger('event');
	obj.trigger('event');

};

exports["object key"] = function(test) {
	test.expect(1);

	var obj = pvo();

	obj.on({a:1}, function() {
		test.ok(true);
	});

	obj.trigger({a:1});

	setTimeout(test.done, 10);
};

exports["object key, multiple"] = function(test) {
	test.expect(2);

	var obj = pvo();

	obj.on({a:1}, function() { test.ok(true); });
	obj.on({b:2}, function() { test.ok(true); });
	obj.on({c:1}, function() { test.ok(false); });

	obj.trigger({a:1, b:2});

	setTimeout(test.done, 10);
};

exports["object key, many levels"] = function(test) {
	test.expect(5);

	var obj = pvo();
	var i = 0;

	obj.on({a:1},           function() { test.strictEqual(++i, 4); });
	obj.on({a:1, c:3, d:4}, function() { test.strictEqual(++i, 1); });
	obj.on({a:1, b:2},      function() { test.strictEqual(++i, 2); });
	obj.on({a:2},           function() { test.ok(false, 'Should not have matched a:2'); });
	obj.on({a:1, c:3},      function() { test.strictEqual(++i, 3); });
	obj.on({},              function() { test.strictEqual(++i, 5); });

	obj.trigger({a:1, b:2, c:3, d:4, e:5});

	setTimeout(test.done, 10);
};

exports["object key, many levels, stopping"] = function(test) {
	test.expect(2);

	var obj = pvo();
	var i = 0;

	obj.on({a:1},           function(ev) { test.ok(false); });
	obj.on({a:1, c:3, d:4}, function(ev) { test.strictEqual(++i, 1); });
	obj.on({a:1, b:2},      function(ev) { test.strictEqual(++i, 2); ev.stop(); });
	obj.on({},              function(ev) { test.ok(false); });

	obj.trigger({a:1, b:2, c:3, d:4, e:5});

	setTimeout(test.done, 10);
};

exports["error inside event handler"] = function(test) {
	test.expect(2);

	var obj = pvo();

	obj.on('event', function() { unknown++; });
	obj.onObserverError = function (e) {
		test.strictEqual(e.message, 'unknown is not defined');
		test.strictEqual(e.type, 'not_defined');
	};

	obj.trigger('event');

	setTimeout(test.done, 10);
};


exports["off"] = function(test) {
	test.expect(1);

	var obj = pvo();

	obj.on('event', function() { test.ok(true); });

	obj.trigger('event');

	obj.off('event');

	obj.trigger('event');
	
	setTimeout(test.done, 10);
};

exports["off with callback"] = function(test) {
	test.expect(4);
	var counter = 0;

	var obj = pvo();

	var c1 = function() {
		++counter;
		test.ok(true);
	};

	var c2 = function() {
		--counter;
		test.ok(true);
	};

	obj.on('event', c1);
	obj.on('event', c2);

	obj.trigger('event');

	obj.off('event', c1);

	obj.trigger('event');
	
	setTimeout(function () {
		test.strictEqual(counter, -1);
		test.done();
	}, 10);
};

exports["off with callback and no name"] = function(test) {
	test.expect(4);
	var counter = 0;

	var obj = pvo();

	var c1 = function() {
		++counter;
		test.ok(true);
	};

	var c2 = function() {
		--counter;
		test.ok(true);
	};

	obj.on('event', c1);
	obj.on('event', c2);

	obj.trigger('event');

	obj.off(undefined, c1);

	obj.trigger('event');
	
	setTimeout(function () {
		test.strictEqual(counter, -1);
		test.done();
	}, 10);
};

exports["off with context only"] = function(test) {
	test.expect(4);
	var counter = 0;

	var obj = pvo();
	var context = {foo:1};

	var c1 = function() {
		++counter;
		test.ok(true);
	};

	var c2 = function() {
		--counter;
		test.ok(true);
	};

	obj.on('event', c1, context);
	obj.on('event', c2);

	obj.trigger('event');

	obj.off(undefined, undefined, context);

	obj.trigger('event');
	
	setTimeout(function () {
		test.strictEqual(counter, -1);
		test.done();
	}, 10);
};

exports["off with object key"] = function(test) {
	test.expect(1);

	var obj = pvo();

	obj.on({a:1}, function() { test.ok(true); });

	obj.trigger({a:1});

	obj.off({a:1});

	obj.trigger({a:1});
	
	setTimeout(test.done, 10);
};

exports['once'] = function (test) {
	test.expect(1);
	var obj = pvo();

	obj.once('event', function(){ test.ok(true); });

	obj.trigger('event');
	obj.trigger('event');

	setTimeout(test.done, 10);
};

exports['once removed'] = function (test) {
	test.expect(0);
	var obj = pvo();
	var f = function(){ ok(true); };

	obj.once('event', f);
	obj.off('event', f);
	obj.trigger('event');

	setTimeout(test.done, 10);
};


exports['on with context'] = function (test) {
	test.expect(1);

	var TestClass = function () {};
	TestClass.prototype.assertTrue = function () {
		test.ok(true, '`this` was bound to the callback');
	};

	var obj = pvo();

	obj.on('event', function () { this.assertTrue(); }, (new TestClass()));

	obj.trigger('event');

	setTimeout(test.done, 10);
};

exports['if callback is truthy but not a function, `on` should throw an error'] = function (test) {
	var obj = pvo();

	test.throws(function () {
		obj.on('test', 'noop');
	});

	test.done();
};



exports['listenTo'] = function (test) {
	test.expect(2);
	var a = pvo();
	var b = pvo();

	a.listenTo(b, 'event', function(){ test.ok(true); });

	b.trigger('event');
	b.trigger('event');

	setTimeout(test.done, 10);
};


exports['listenTo with object key'] = function (test) {
	test.expect(2);
	var a = pvo();
	var b = pvo();

	a.listenTo(b, {a:1}, function(){ test.ok(true); });

	b.trigger({a:1});
	b.trigger({a:1, b:2});

	setTimeout(test.done, 10);
};


exports['listenToOnce'] = function (test) {
	test.expect(1);
	var a = pvo();
	var b = pvo();

	a.listenToOnce(b, 'event', function(){ test.ok(true); });

	b.trigger('event');
	b.trigger('event');

	setTimeout(test.done, 10);
};



exports['stopListening'] = function (test) {
	test.expect(1);
	var a = pvo();
	var b = pvo();

	a.listenTo(b, 'event', function(){ test.ok(true); });

	b.trigger('event');

	a.listenTo(b, 'event', function(){ test.ok(false); });

	a.stopListening();

	b.trigger('event');

	setTimeout(test.done, 10);
};

exports['stopListening to object'] = function (test) {
	test.expect(1);
	var a = pvo();
	var b = pvo();

	a.listenTo(b, 'eventA', function(){ test.ok(true); });
	a.listenTo(b, 'eventB', function(){ test.ok(false); });

	b.trigger('eventA');

	a.stopListening(b);

	b.trigger('eventA');
	b.trigger('eventB');

	setTimeout(test.done, 10);
};


exports['stopListening to event'] = function (test) {
	test.expect(1);
	var a = pvo();
	var b = pvo();

	a.listenTo(b, 'eventA', function(){ test.ok(true); });
	a.listenTo(b, 'eventB', function(){ test.ok(false); });

	a.stopListening(b, 'eventB');

	b.trigger('eventA');
	b.trigger('eventB');

	setTimeout(test.done, 10);
};

exports['listenTo self'] = function (test) {
	test.expect(2);
	var a = pvo();

	a.listenTo(a, 'event', function(){ test.ok(true); });

	a.trigger('event');
	a.trigger('event');

	setTimeout(test.done, 10);
};

exports['listenTo self and stop listening'] = function (test) {
	test.expect(1);
	var a = pvo();

	a.listenTo(a, 'event', function(){ test.ok(true); });

	a.trigger('event');
	a.stopListening(a);
	a.trigger('event');

	setTimeout(test.done, 10);
};

exports['listenTo and stopListening cleaning up references'] = function (test) {
	var a = pvo();
	var b = pvo();

	a.listenTo(b, 'eventA', function(){ test.ok(true); });
	
	b.trigger('eventA');

	a.listenTo(b, 'eventB', function(){ test.ok(false); });

	a.stopListening(b, 'eventB');
	a.stopListening(b, 'eventA');

	test.strictEqual(Object.keys(a._listeningTo).length, 0);

	test.done();
};

exports['listenTo with empty callback doesn\'t throw an error'] = function (test) {
	var e = pvo();
	e.listenTo(e, "foo", null);
	e.trigger("foo");
	test.ok(true);

	test.done();
};

exports['delimited observer names'] = function (test) {
	test.expect(2);
	var obj = pvo();
	obj.observerDelimiter = ':';
	
	obj.on('a:b', function () { test.ok(true); });
	obj.on('a', function () { test.ok(true); });
	obj.on('a:b:d', function () { test.ok(false); });

	obj.trigger('a:b:c');

	setTimeout(test.done, 10);
};


exports['removing delimited observer names'] = function (test) {
	test.expect(4);
	var obj = pvo();
	obj.observerDelimiter = ':';
	
	obj.on('a:b', function () { test.ok(true); });
	obj.on('a', function () { test.ok(true); });
	obj.on('a:b:c', function () { test.ok(false); });

	obj.trigger('a:b');

	obj.off('a:b:c');

	obj.trigger('a:b:c');

	setTimeout(test.done, 10);
};




