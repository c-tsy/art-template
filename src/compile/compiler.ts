const esTokenizer = require('./es-tokenizer');
const tplTokenizer = require('./tpl-tokenizer');
const fs = require('fs')
/** 传递给模板的数据引用 */
const DATA = `$data`;

/** 外部导入的所有全局变量引用 */
const IMPORTS = `$imports`;

/**  $imports.$escape */
const ESCAPE = `$escape`;

/**  $imports.$each */
const EACH = `$each`;

/** 文本输出函数 */
const PRINT = `print`;

/** 包含子模板函数 */
const INCLUDE = `include`;

/** 继承布局模板函数 */
const EXTEND = `await extend`;

/** “模板块”读写函数 */
const BLOCK = `await block`;

/** 字符串拼接变量 */
const OUT = `$$out`;

/** 运行时逐行调试记录变量 [line, start, source] */
const LINE = `$$line`;

/** 所有“模板块”变量 */
const BLOCKS = `$$blocks`;

/** 截取模版输出“流”的函数 */
const SLICE = `$$slice`;

/** 继承的布局模板的文件地址变量 */
const FROM = `$$from`;

/** 编译设置变量 */
const OPTIONS = `$$options`;

const has = (object: any, key: string) => Object.hasOwnProperty.call(object, key);
const stringify = JSON.stringify;

class Compiler {

    static CONSTS = {
        DATA,
        IMPORTS,
        PRINT,
        INCLUDE,
        EXTEND,
        BLOCK,
        OPTIONS,
        OUT,
        LINE,
        BLOCKS,
        SLICE,
        FROM,
        ESCAPE,
        EACH
    };

    options: any
    stacks: any
    context: any
    scripts: any
    CONTEXT_MAP: any
    ignore: any
    internal: any
    dependencies: any
    source: any
    /**
     * 模板编译器
     * @param   {Object}    options
     */
    constructor(options: any) {
        let source = options.source;
        const minimize = options.minimize;
        const htmlMinifier = options.htmlMinifier;

        // 编译选项
        this.options = options;

        // 所有语句堆栈
        this.stacks = [];

        // 运行时注入的上下文
        this.context = [];

        // 模板语句编译后的代码
        this.scripts = [];

        // context map
        this.CONTEXT_MAP = {};

        // 忽略的变量名单
        this.ignore = [DATA, IMPORTS, OPTIONS, ...options.ignore];

        // 按需编译到模板渲染函数的内置变量
        this.internal = {
            [OUT]: `''`,
            [LINE]: `[0,0]`,
            [BLOCKS]: `arguments[1]||{}`,
            [FROM]: `null`,
            [PRINT]: `function(){var s=''.concat.apply('',arguments);${OUT}+=s;return s}`,
            [INCLUDE]: `async function(src,data){var s= await ${OPTIONS}.include(src,data||${DATA},arguments[2]||${BLOCKS},${OPTIONS});${OUT}+=s;return s}`,
            [EXTEND]: `function(from){${FROM}=from}`,
            [SLICE]: `function(c,p,s){p=${OUT};${OUT}='';c();s=${OUT};${OUT}=p+s;return s}`,
            [BLOCK]: `function(){var a=arguments,s;if(typeof a[0]==='function'){return ${SLICE}(a[0])}else if(${FROM}){if(!${BLOCKS}[a[0]]){${BLOCKS}[a[0]]=${SLICE}(a[1])}else{${OUT}+=${BLOCKS}[a[0]]}}else{s=${BLOCKS}[a[0]];if(typeof s==='string'){${OUT}+=s}else{s=${SLICE}(a[1])}return s}}`
        };

        // 内置函数依赖关系声明
        this.dependencies = {
            [PRINT]: [OUT],
            [INCLUDE]: [OUT, OPTIONS, DATA, BLOCKS],
            [EXTEND]: [FROM, /*[*/ INCLUDE /*]*/],
            [BLOCK]: [SLICE, FROM, OUT, BLOCKS]
        };

        this.importContext(OUT);

        if (options.compileDebug) {
            this.importContext(LINE);
        }

        if (minimize) {
            try {
                source = htmlMinifier(source, options);
            } catch (error) { }
        }

        this.source = source;
        this.getTplTokens(source, options.rules, this).forEach((tokens: any) => {
            if (tokens.type === tplTokenizer.TYPE_STRING) {
                this.parseString(tokens);
            } else {
                this.parseExpression(tokens);
            }
        });
    }

    /**
     * 将模板代码转换成 tplToken 数组
     * @param   {string} source
     * @return  {Object[]}
     */
    getTplTokens(...args: any[]) {
        return tplTokenizer(...args);
    }

    /**
     * 将模板表达式转换成 esToken 数组
     * @param   {string} source
     * @return  {Object[]}
     */
    getEsTokens(source: any) {
        return esTokenizer(source);
    }

    /**
     * 获取变量列表
     * @param {Object[]} esTokens
     * @return {string[]}
     */
    getVariables(esTokens: any) {
        let ignore = false;
        return esTokens
            .filter((esToken: any) => {
                return esToken.type !== `whitespace` && esToken.type !== `comment`;
            })
            .filter((esToken: any) => {
                if (esToken.type === `name` && !ignore) {
                    return true;
                }

                ignore = esToken.type === `punctuator` && esToken.value === `.`;

                return false;
            })
            .map((tooken: any) => tooken.value);
    }

    /**
     * 导入模板上下文
     * @param {string} name
     */
    importContext(name: string) {
        let value = ``;
        const internal = this.internal;
        const dependencies = this.dependencies;
        const ignore = this.ignore;
        const context = this.context;
        const options = this.options;
        const imports = options.imports;
        const contextMap = this.CONTEXT_MAP;

        if (!has(contextMap, name) && ignore.indexOf(name) === -1) {
            if (has(internal, name)) {
                value = internal[name];

                if (has(dependencies, name)) {
                    dependencies[name].forEach((name: any) => this.importContext(name));
                }

                // imports 继承了 Global，但是继承的属性不分配到顶级变量中，避免占用了模板内部的变量名称
            } else if (name === ESCAPE || name === EACH || has(imports, name)) {
                value = `${IMPORTS}.${name}`;
            } else {
                value = `${DATA}.${name}`;
            }

            contextMap[name] = value;
            context.push({
                name,
                value
            });
        }
    }

    /**
     * 解析字符串（HTML）直接输出语句
     * @param {Object} tplToken
     */
    parseString(tplToken: any) {
        let source = tplToken.value;

        if (!source) {
            return;
        }

        const code = `${OUT}+=${stringify(source)}`;
        this.scripts.push({
            source,
            tplToken,
            code
        });
    }

    /**
     * 解析逻辑表达式语句
     * @param {Object} tplToken
     */
    parseExpression(tplToken: any) {
        const source = tplToken.value;
        const script = tplToken.script;
        const output = script.output;
        const escape = this.options.escape;
        let code = script.code;

        if (output) {
            if (escape === false || output === tplTokenizer.TYPE_RAW) {
                code = `${OUT}+=${script.code}`;
            } else {
                code = `${OUT}+=await ${ESCAPE}(${script.code})`;
            }
        }

        const esToken = this.getEsTokens(code);
        this.getVariables(esToken).forEach((name: any) => this.importContext(name));

        this.scripts.push({
            source,
            tplToken,
            code
        });
    }

    /**
     * 检查解析后的模板语句是否存在语法错误
     * @param  {string} script
     * @return {boolean}
     */
    checkExpression(script: any) {
        // 没有闭合的块级模板语句规则
        // 基于正则规则来补全语法不能保证 100% 准确，
        // 但是在绝大多数情况下足以满足辅助开发调试的需要
        const rules: [RegExp, string][] = [
            // <% } %>
            // <% }else{ %>
            // <% }else if(a){ %>
            [/^\s*}[\w\W]*?{?[\s;]*$/, ''],

            // <% fn(c,function(a,b){ %>
            // <% fn(c, a=>{ %>
            // <% fn(c,(a,b)=>{ %>
            [/(^[\w\W]*?\([\w\W]*?(?:=>|\([\w\W]*?\))\s*{[\s;]*$)/, '$1})'],

            // <% if(a){ %>
            // <% for(var i in d){ %>
            [/(^[\w\W]*?\([\w\W]*?\)\s*{[\s;]*$)/, '$1}']
        ];

        let index = 0;
        while (index < rules.length) {
            if (rules[index][0].test(script)) {
                script = script.replace(...rules[index]);
                break;
            }
            index++;
        }

        try {
            new Function(script);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 编译
     * @return  {function}
     */
    build() {
        const options = this.options;
        const context = this.context;
        const scripts = this.scripts;
        const stacks = this.stacks;
        const source = this.source;
        const filename = options.filename;
        const imports = options.imports;
        const mappings: any[] = [];
        const extendMode = has(this.CONTEXT_MAP, EXTEND);

        let offsetLine = 0;

        // Create SourceMap: mapping
        const mapping = (code: any, { line, start }: any) => {
            const node = {
                generated: {
                    line: stacks.length + offsetLine + 1,
                    column: 1
                },
                original: {
                    line: line + 1,
                    column: start + 1
                }
            };

            offsetLine += code.split(/\n/).length - 1;
            return node;
        };

        // Trim code
        const trim = (code: string) => {
            return code.replace(/^[\t ]+|[\t ]$/g, '');
        };

        stacks.push(`async function(${DATA}){`);
        // stacks.push(`'use strict'`);
        // stacks.push(`const include = require("@ctsy/art-template/src/compile/adapter/include");`);
        stacks.push(`${DATA}=${DATA}||{}`);
        // stacks.push(`const include = require('@ctsy/art-template/src/compile/adapter/include')`)
        stacks.push(`var ` + context.map(({ name, value }: any) => `${name}=${value}`).join(`,`));

        if (options.compileDebug) {
            stacks.push(`try{`);

            scripts.forEach((script: any) => {
                if (script.tplToken.type === tplTokenizer.TYPE_EXPRESSION) {
                    stacks.push(
                        `${LINE}=[${[script.tplToken.line, script.tplToken.start].join(',')}]`
                    );
                }
                if (script.code.includes('include')) {
                    script.code = 'await ' + script.code;
                    // debugger
                }
                mappings.push(mapping(script.code, script.tplToken));
                stacks.push(trim(script.code));
            });

            stacks.push(`}catch(error){`);

            stacks.push(
                'throw {' +
                [
                    `name:'RuntimeError'`,
                    `path:${stringify(filename)}`,
                    `message:error.message`,
                    `line:${LINE}[0]+1`,
                    `column:${LINE}[1]+1`,
                    `source:${stringify(source)}`,
                    `stack:error.stack`
                ].join(`,`) +
                '}'
            );

            stacks.push(`}`);
        } else {
            scripts.forEach((script: any) => {
                if (script.code.includes('include')) {
                    script.code = 'await ' + script.code;
                    // debugger
                }
                mappings.push(mapping(script.code, script.tplToken));
                stacks.push(trim(script.code));
            });
        }

        if (extendMode) {
            stacks.push(`${OUT}=''`);
            stacks.push(`await ${INCLUDE}(${FROM},${DATA},${BLOCKS})`);
        }

        stacks.push(`return ${OUT}`);
        stacks.push(`}`);

        const renderCode = stacks.join(`\n`);
        fs.writeFileSync('render.js', renderCode)
        try {
            var AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
            const result = new AsyncFunction(IMPORTS, OPTIONS, `return await ${renderCode}`)(imports, options);
            result.mappings = mappings;
            result.sourcesContent = [source];
            return result;
        } catch (error) {
            let index = 0;
            let line = 0;
            let start = 0;
            let generated;

            while (index < scripts.length) {
                const current = scripts[index];
                if (!this.checkExpression(current.code)) {
                    line = current.tplToken.line;
                    start = current.tplToken.start;
                    generated = current.code;
                    break;
                }
                index++;
            }

            throw {
                name: `CompileError`,
                path: filename,
                message: error.message,
                line: line + 1,
                column: start + 1,
                source,
                generated,
                stack: error.stack
            };
        }
    }
}

/**
 * 模板内置常量
 */
// Compiler.CONSTS = {
//     DATA,
//     IMPORTS,
//     PRINT,
//     INCLUDE,
//     EXTEND,
//     BLOCK,
//     OPTIONS,
//     OUT,
//     LINE,
//     BLOCKS,
//     SLICE,
//     FROM,
//     ESCAPE,
//     EACH
// };

module.exports = Compiler;
