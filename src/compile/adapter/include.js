/**
 * 载入子模板
 * @param   {string}    filename
 * @param   {Object}    data
 * @param   {Object}    blocks
 * @param   {Object}    options
 * @return  {string}
 */
const include = async (filename, data, blocks, options) => {
    const compile = require('../index');
    options = options.$extend({
        filename: options.resolveFilename(filename, options),
        bail: true,
        source: null
    });
    let c = await compile(options);
    c = c(data, blocks)
    return c;
};

module.exports = include;