## Session store for connect using mongodb

Yes, its yet another store, built because of frustration looking at the existing implementations.

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


## Options

Options are directly passed to `MongoClient.connect`, so you can put any options for mongo here.

- `collectionName` - name of collection used for sessions, default 'sessions'
- `ttl` - time to live for a session, default 1 day
- `cleanupInterval` - interval used to remove outdated sessions, default 60s

## Reuse of existing Db instance

You can pass your existing Db instance instead of the uri. `new MongoStore(db)`
