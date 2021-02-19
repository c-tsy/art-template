declare const esTokenizer: any;
declare const tplTokenizer: any;
declare const fs: any;
/** 传递给模板的数据引用 */
declare const DATA = "$data";
/** 外部导入的所有全局变量引用 */
declare const IMPORTS = "$imports";
/**  $imports.$escape */
declare const ESCAPE = "$escape";
/**  $imports.$each */
declare const EACH = "$each";
/** 文本输出函数 */
declare const PRINT = "print";
/** 包含子模板函数 */
declare const INCLUDE = "await include";
/** 继承布局模板函数 */
declare const EXTEND = "await extend";
/** “模板块”读写函数 */
declare const BLOCK = "await block";
/** 字符串拼接变量 */
declare const OUT = "$$out";
/** 运行时逐行调试记录变量 [line, start, source] */
declare const LINE = "$$line";
/** 所有“模板块”变量 */
declare const BLOCKS = "$$blocks";
/** 截取模版输出“流”的函数 */
declare const SLICE = "$$slice";
/** 继承的布局模板的文件地址变量 */
declare const FROM = "$$from";
/** 编译设置变量 */
declare const OPTIONS = "$$options";
declare const has: (object: any, key: string) => boolean;
declare const stringify: {
    (value: any, replacer?: ((this: any, key: string, value: any) => any) | undefined, space?: string | number | undefined): string;
    (value: any, replacer?: (string | number)[] | null | undefined, space?: string | number | undefined): string;
};
declare class Compiler {
    static CONSTS: {
        DATA: string;
        IMPORTS: string;
        PRINT: string;
        INCLUDE: string;
        EXTEND: string;
        BLOCK: string;
        OPTIONS: string;
        OUT: string;
        LINE: string;
        BLOCKS: string;
        SLICE: string;
        FROM: string;
        ESCAPE: string;
        EACH: string;
    };
    options: any;
    stacks: any;
    context: any;
    scripts: any;
    CONTEXT_MAP: any;
    ignore: any;
    internal: any;
    dependencies: any;
    source: any;
    /**
     * 模板编译器
     * @param   {Object}    options
     */
    constructor(options: any);
    /**
     * 将模板代码转换成 tplToken 数组
     * @param   {string} source
     * @return  {Object[]}
     */
    getTplTokens(...args: any[]): any;
    /**
     * 将模板表达式转换成 esToken 数组
     * @param   {string} source
     * @return  {Object[]}
     */
    getEsTokens(source: any): any;
    /**
     * 获取变量列表
     * @param {Object[]} esTokens
     * @return {string[]}
     */
    getVariables(esTokens: any): any;
    /**
     * 导入模板上下文
     * @param {string} name
     */
    importContext(name: string): void;
    /**
     * 解析字符串（HTML）直接输出语句
     * @param {Object} tplToken
     */
    parseString(tplToken: any): void;
    /**
     * 解析逻辑表达式语句
     * @param {Object} tplToken
     */
    parseExpression(tplToken: any): void;
    /**
     * 检查解析后的模板语句是否存在语法错误
     * @param  {string} script
     * @return {boolean}
     */
    checkExpression(script: any): boolean;
    /**
     * 编译
     * @return  {function}
     */
    build(): any;
}
