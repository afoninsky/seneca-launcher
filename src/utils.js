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
    return Promise.each(Object.keys(plugins), fileName => {
      const plugin = plugins[fileName].index || plugins[fileName]
      const name = plugin.name || fileName
      return seneca.useAsync(plugin, config[name], name).then(() => {
        loaded.push(name)
      })
    }).then(() => loaded)
  },
}
