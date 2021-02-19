const template = require('./src/index');
const extension = require('./src/extension');

template.extension = extension;
require.extensions[template.defaults.extname] = extension;

module.exports = template;