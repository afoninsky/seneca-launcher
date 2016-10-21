#!/usr/bin/env node

/**
 * Base seneca plugins launcher with transport support and stuff
 */

if (module.parent) { throw new Error('Im not a module, please launch me directly. Thank you') }
require('babel-core/register')

const config = require('config')
const ld = require('lodash')

if (config.opbeat) { // init opbeat module, will catch error only on env = 'production' | 'staging'
  require('./opbeat')(config.opbeat)
}

const { loadPlugins } = require('./utils')
const connections = require('./connections')
const seneca = require('seneca-extended')({
  logLevel: 'info'
})

const pluginsDir = `${process.env.PWD}/${process.argv[2] || 'src'}`


Promise.resolve()
.then(() => { // init mongodb connection
  if (!config.mongodb) { return }
  return connections.mongodb(config.mongodb, seneca.logger).then(database => {
    seneca.decorate('mongodb', database)
  })
})
.then(() => { // load plugins
  return loadPlugins(seneca, pluginsDir, config)
}).then(loaded => { // launch service

  if(!loaded.length) {
    throw new Error(`no plugins found in ${pluginsDir} directory`)
  }

  if (config.transport) { // load http/https transport
    seneca.listen(config.transport)
  }

  if (config.health) { // run healthcheck server
    seneca.logger.info(`Health server started on port ${config.health.port}`)
    const info = Object.assign(ld.pick(require('../package'), ['name', 'version']), {
      NODE_ENV: process.env.NODE_ENV
    })
    require('./health')(config.health, info)
  }

  seneca.logger.info(`Services started: ${loaded.join(', ')}`)

}).catch(err => {
  seneca.logger.error(err)
  process.exit(1)
})
