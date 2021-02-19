export = template;
/**
 * 模板引擎
 * @param   {string}            filename 模板名
 * @param   {Object|string}     content  数据或模板内容
 * @return  {string|function}            如果 content 为 string 则编译并缓存模板，否则渲染模板
 */
declare function template(filename: string, content: Object | string): string | Function;
declare namespace template {
    export { render };
    export { compile };
    export { defaults };
}
declare const render: typeof import("./render");
declare const compile: typeof import("./compile");
declare const defaults: typeof import("./compile/defaults");
