export = compile;
/**
 * 编译模版
 * @param {string|Object} source   模板内容
 * @param {?Object}       options  编译选项
 * @return {function}
 */
declare function compile(source: string | Object, options?: Object | null): Function;
declare namespace compile {
    export { Compiler };
}
declare const Compiler: any;
