var MongoStore = store(connect)

var MONGO_URL = 'mongodb://localhost:27017/connect-mongo-test'

QUnit.module('MongoStore', {
    setup: function() {
        stop()
        this.store = new MongoStore(MONGO_URL)
        this.store.on('connect', start)
    },
    teardown: function() {
        stop()
        this.store.collection.remove({}, start)
    }
})

test('set', function() {
    stop()
    this.store.set('a', {a: 1}, function(err) {
        equal(err, null, 'set works')
        start()
    })
})

test('get', function() {
    stop()
    var data = {a: 1},
        store = this.store

    store.set('a', data, function(err) {
        store.get('a', function(err, sess) {
            deepEqual(data, sess, 'get works')
            start()
        })
    })
})

test('destroy', function() {
    stop()
    var store = this.store

    store.set('a', {a: 1}, function(err) {
        store.destroy('a', function(err) {
            equal(err, null, 'destroy without errors')
            store.get('a', function(err, sess) {
                equal(null, sess, 'destroy works')
                start()
            })
        })
    })
})

test('all', function() {
    stop()
    var store = this.store,
        data = [{a: 1}, {b: 1}]

    store.set('a', data[0], more)

    function more() {
        store.set('b', data[1], all)
    }

    function all() {
        store.all(function(err, sessions) {
            equal(err, null, 'all without errors')
            deepEqual(data, sessions, 'all works')
            start()
        })
    }
})

test('clear', function() {
    stop()
    var store = this.store
    store.set('a', {a: 1}, function(err) {
        store.clear(function(err) {
            equal(err, null, 'clear without err')
            store.get('a', function(err, sess) {
                equal(sess, null, 'clear works')
                start()
            })
        })
    })
})

test('length', function() {
    stop()
    var store = this.store,
        data = [{a: 1}, {b: 1}]

    store.set('a', data[0], more)

    function more() {
        store.set('b', data[1], all)
    }

    function all() {
        store.length(function(err, length) {
            equal(err, null, 'length without errors')
            deepEqual(data.length, length, 'length works')
            start()
        })
    }
})

test('cleanup', function() {
    stop()
    var store = new MongoStore(MONGO_URL, {cleanupInterval: 1000, ttl: 500})

    store.on('connect', function() {
        store.set('a', {a: 1}, function(err) {
            setTimeout(function() {
                store.get('a', function(err, sess) {
                    equal(sess, null, 'session cleaned up')
                    start()
                })
            }, 1100)
        })
    })
})

