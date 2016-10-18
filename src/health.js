const Koa = require('koa')

module.exports = (config, info) => {

  const healthRoute = config.route || '/_ah/health'
  const app = new Koa()

  app.use(ctx => {
    const { method, url } = ctx
    if (method !== 'GET') { return }

    switch (url) {
      case healthRoute:
        ctx.body = info
    }

  })

  return app.listen(config.port)
}
