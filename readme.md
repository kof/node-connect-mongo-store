## Session store for connect using mongodb

Yes, its yet another store, built because of frustration looking at the existing implementations.
You can pass ANY options mongodb native driver can accept, it works in ANY setups, also with replica set.
You can pass your existing Db instance instead of the uri. `new MongoStore(db)`

## Installation
    $ npm install connect-mongo-store

## Usage

    var connect = require('connect')
    var MongoStore = require('connect-mongo-store')(connect)
    var mongoStore = new MongoStore('mongodb://localhost:27017/mydb', [options])
    connect()
        .use(connect.session({store: mongoStore, secret: 'keyboard cat'}))

    mongoStore.on('connect', function() {
        console.log('Store is ready to use')
    })

    mongoStore.on('error', function(err) {
        console.log('Do not ignore me', err)
    })

Express users may do the following, since express.session.Store points to the connect.session.Store function:

    var MongoStore = require('connect-mongo-store')(express)
    express()
        .use(express.session({store: mongoStore, secret: 'keyboard cat'}))


## Options

Options are directly passed to `MongoClient.connect`, so you can put any options for mongo here.

- `collectionName` - name of collection used for sessions, default 'sessions'
- `ttl` - time to live for a session, default 1 day
- `cleanupInterval` - interval used to remove outdated sessions, default 60s
