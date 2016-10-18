const opbeat = require('opbeat')

module.exports = config => {
  const cfg = Object.assign({}, config, {
    active: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging',
    instrument: false // dont log requests
  })

  opbeat.addFilter(payload => {
    payload.extra.env = process.env.NODE_ENV
    return payload
  })

  opbeat.start(cfg)
}
