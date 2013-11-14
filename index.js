var util = require('util'),
    MongoClient = require('mongodb').MongoClient

var oneDay = 86400;

/**
 * Return the `MongoStore` extending `connect`'s session Store.
 *
 * @param {object} connect
 * @return {Function}
 * @api public
 */
module.exports = function(connect) {

    /**
     * Initialize a new `MongoStore`.
     *
     * @api public
     */
    function MongoStore(uri, options) {
        var self = this

        this.options = options || (options = {})
        options.collectionName != null || (options.collectionName = 'sessions')
        options.ttl != null || (options.ttl = oneDay)
        options.cleanupInterval != null || (options.cleanupInterval = 60 * 1000)
        options.server || (options.server = {})
        options.server.auto_reconnect != null || (options.server.auto_reconnect = true)

        // It's a Db instance.
        if (uri.collection) {
            this.db = uri
            this._setup()
        } else {
            MongoClient.connect(uri, options, function(err, db) {
                if (err) return self.emit('error', err)
                self.db = db
                self._setup()
                self.emit('connect', db)
            })
        }
    }

    util.inherits(MongoStore, connect.session.Store)

    /**
     * Attempt to fetch session by the given `sid`.
     *
     * @param {String} sid
     * @param {Function} callback
     * @api public
     */
    MongoStore.prototype.get = function(sid, callback) {
        this.collection.findOne({sid: sid}, function(err, doc) {
            callback(err, doc ? doc.sess : null)
        })
    }

    /**
     * Commit the given `sess` object associated with the given `sid`.
     *
     * @param {String} sid
     * @param {Session} sess
     * @param {Function} callback
     * @api public
     */
    MongoStore.prototype.set = function(sid, sess, callback) {
        this.collection.update(
            {sid: sid},
            {$set: {
                sess: sess,
                expires: Date.now() + this.options.ttl
            }},
            {upsert: true},
            callback
        )
    }

    /**
     * Destroy the session associated with the given `sid`.
     *
     * @param {String} sid
     * @api public
     */
    MongoStore.prototype.destroy = function(sid, callback) {
        this.collection.remove({sid: sid}, callback)
    }

    /**
     * Invoke the given callback `callback` with all active sessions.
     *
     * @param {Function} callback
     * @api public
     */
    MongoStore.prototype.all = function(callback) {
        this.collection.find().toArray(function(err, docs) {
            var sess = []
            if (err) return callback(err)
            docs.forEach(function(doc) {
                sess.push(doc.sess)
            })
            callback(null, sess)
        })
    }

    /**
     * Clear all sessions.
     *
     * @param {Function} callback
     * @api public
     */
    MongoStore.prototype.clear = function(callback) {
        this.collection.remove({}, callback)
    }

    /**
     * Fetch number of sessions.
     *
     * @param {Function} callback
     * @api public
     */
    MongoStore.prototype.length = function(callback) {
        this.collection.count({}, callback)
    }

    /**
     * Remove outdated sessions.
     *
     * @param {Function} callback
     * @api private
     */
    MongoStore.prototype._cleanup = function() {
        var self = this
        this.collection.remove({expires: {$lt: Date.now()}}, function(err) {
            if (err) self.emit('error', err)
        })
    }

    /**
     * Setup collection, cleanup, error handler.
     */
    MongoStore.prototype._setup = function() {
        var self = this

        function error(err) {
            if (err) self.emit('error', err)
        }
        this.db.on('error', error)
        this.collection = this.db.collection(this.options.collectionName)
        this.collection.ensureIndex({sid: 1}, {unique: true}, error)
        setInterval(function() {
            self.collection.remove({expires: {$lt: Date.now()}}, error)
        }, this.options.cleanupInterval)
    }

    return MongoStore
}
