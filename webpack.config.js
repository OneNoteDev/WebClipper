const {resolve} = require('path')

module.exports = () => {
    return {
        context: resolve('build'),
        entry: './bundles/clipper.js',
        output: {
            filename: 'bundle.js'
        }
    }
}
