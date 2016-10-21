const requireDir = require('require-dir')
const Promise = require('bluebird')

module.exports = {

/**
 * iterate over modules in `path` directory,
 * init and load found seneca plugins with config[name] options
 */
  loadPlugins(seneca, path, config = {}) {
    const loaded = []
    const plugins = requireDir(path, {recurse: true})
    return Promise.each(Object.keys(plugins), name => {
      const plugin = plugins[name].index || plugins[name]
      const pluginConfig = config[name]
      return seneca.useAsync(plugin, pluginConfig, name).then(() => {
        loaded.push(name)
      })
    }).then(() => loaded)
  },
}
