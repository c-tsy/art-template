export = precompile;
/**
 * 预编译模版，将模板编译成 javascript 代码
 * 使用静态分析，将模板内部之间依赖转换成 `require()`
 * @param  {Object}       options  编译选项
 * @return {Object}
 */
declare function precompile(options?: Object): Object;
