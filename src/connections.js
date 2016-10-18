/**
 * Provide singletone connections (with connection pool) for various remote services
 */
const singletone = {}
// const Redis = require('ioredis')
const ld = require('lodash')
const Promise = require('bluebird')
const { MongoClient } = require('mongodb')

function fromCache(service, hash) {
	if (!singletone[service]) { singletone[service] = {} }
	return singletone[service][hash]
}

function saveCache(service, hash, instance) {
	if (!singletone[service]) { singletone[service] = {} }
	singletone[service][hash] = instance
	return singletone[service][hash]
}

module.exports = {

	// redis(params = {}) {
	// 	const { cluster, config } = params
	// 	const prev = fromCache('redis', params)
	// 	if (prev) { return prev }
	//
	// 	// connecting to redis cluster
  //   if (cluster) {
  //     const redis = new Redis.Cluster(cluster, {
  //       redisOptions: config
  //     })
	// 		return Promise.resolve(saveCache('redis', params, redis))
  //   }
	//
	// 	// connecting to single redis instance
	// 	return Promise.resolve(saveCache('redis', params, new Redis(config)))
	// },

	mongodb(config, logger = console) {
		const prev = fromCache('mongodb', config)
		if (prev) { return Promise.resolve(prev) }

    let connectCount = 10
    let connectTimeout = 1000

		const cached = database => saveCache('mongodb', config, database)

    const _connect = () => {
      return MongoClient.connect(config.mongoUrl).then(database => {
				const indexes = config.indexes
        logger.info('Connected to database')
         if (!indexes) {
           logger.warn('Database indexes unspecified, so wont be created')
           return cached(database)
         }
         return Promise.each(ld.keys(indexes), name => { // recreate indexes
           const collection = database.collection(name)
           return Promise.each(indexes[name], index => collection.ensureIndex.apply(collection, index) )
         }).then(() => { return cached(database) })
      })
    }

    const connect = () => {
      return _connect().catch(err => {
        if (--connectCount > 0 && err.name === 'MongoError' && err.message.indexOf('on first connect') !== -1) {
          logger.warn(err.message, `- reconnecting in ${connectTimeout}`)
          return Promise.delay(connectTimeout).then(connect)
        }
        throw err
      })
    }

		return connect()
	}
}
