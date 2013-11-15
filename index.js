var util = require('util'),
    MongoClient = require('mongodb').MongoClient

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
        options.collectionName || (options.collectionName = 'sessions')
        // 1 day
        options.ttl || (options.ttl = 24 * 60 * 60 * 1000)
        // 60 s
        options.cleanupInterval || (options.cleanupInterval = 60 * 1000)
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
            })
        }
    }

    util.inherits(MongoStore, connect.session.Store)

    /**
     * Attempt to fetch session by the given `id`.
     *
     * @param {String} id
     * @param {Function} callback
     * @api public
     */
    MongoStore.prototype.get = function(id, callback) {
        this.collection.findOne({id: id}, function(err, doc) {
            callback(err, doc ? doc.sess : null)
        })
    }

    /**
     * Commit the given `sess` object associated with the given `id`.
     *
     * @param {String} id
     * @param {Session} sess
     * @param {Function} callback
     * @api public
     */
    MongoStore.prototype.set = function(id, sess, callback) {
        this.collection.update(
            {id: id},
            {$set: {
                sess: sess,
                expires: Date.now() + this.options.ttl
            }},
            {upsert: true},
            callback
        )
    }

    /**
     * Destroy the session associated with the given `id`.
     *
     * @param {String} id
     * @api public
     */
    MongoStore.prototype.destroy = function(id, callback) {
        this.collection.remove({id: id}, callback)
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

        this.db
            .on('error', error)
            .createCollection(
                this.options.collectionName,
                {autoIndexId: false},
                function(err, collection) {
                    if (err) return error(err)
                    self.collection = collection
                    collection.ensureIndex({id: 1}, {unique: true}, error)
                    setInterval(function() {
                        collection.remove({expires: {$lt: Date.now()}}, error)
                    }, self.options.cleanupInterval)
                    self.emit('connect')
                }
            )
    }

    return MongoStore
}
