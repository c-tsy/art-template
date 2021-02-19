export = tplTokenizer;
/**
 * 将模板转换为 Tokens
 * @param {string}      source
 * @param {Object[]}    rules     @see defaults.rules
 * @param {Object}      context
 * @return {Object[]}
 */
declare function tplTokenizer(source: string, rules: Object[], context?: Object): Object[];
declare namespace tplTokenizer {
    export { TYPE_STRING };
    export { TYPE_EXPRESSION };
    export { TYPE_RAW };
    export { TYPE_ESCAPE };
}
declare const TYPE_STRING: "string";
declare const TYPE_EXPRESSION: "expression";
declare const TYPE_RAW: "raw";
declare const TYPE_ESCAPE: "escape";
