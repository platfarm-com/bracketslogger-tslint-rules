"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var Lint = require("tslint");
var ErrorTolerantWalker_1 = require("./tslint-microsoft-contrib/ErrorTolerantWalker");
var typescript_1 = require("typescript");
var FAILURE_STRING = 'Debug.log() call missing final bracket; log will not be displayed in console: ';
/**
 * Implementation of the bracketslogger-custom-debug rule.
 */
var Rule = /** @class */ (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new BracketsloggerCustomDebugRuleWalker(sourceFile, this.getOptions()));
    };
    Rule.metadata = {
        ruleName: 'bracketslogger-custom-debug',
        type: 'functionality',
        description: 'A call to Log.Debug() misses the second () required to execute in the console context with correct line number.',
        options: null,
        optionsDescription: '',
        typescriptOnly: true,
        issueClass: 'Ignored',
        issueType: 'Warning',
        severity: 'Important',
        level: 'Mandatory',
        group: 'Correctness'
    };
    return Rule;
}(Lint.Rules.AbstractRule));
exports.Rule = Rule;
var BracketsloggerCustomDebugRuleWalker = /** @class */ (function (_super) {
    __extends(BracketsloggerCustomDebugRuleWalker, _super);
    function BracketsloggerCustomDebugRuleWalker() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BracketsloggerCustomDebugRuleWalker.prototype.visitSourceFile = function (node) {
        // if () { do not call super if we dont want to process this file
        _super.prototype.visitSourceFile.call(this, node);
    };
    // Good:
    //  ...(() => Log.Debug()())...
    //     ^^^^^^^^^^^^^^^^^^^^^ ???
    //         ^^                ArrowFunction
    //            ^^^^^^^^^^^^^  CallExpression - child(0)
    //            ^^^^^^^^^^^    CallExpression - child(0).child(0)
    //
    // Not Good:
    //  ...(() => Log.Debug())...
    //     ^^^^^^^^^^^^^^^^^^^ ???
    //         ^^              ArrowFunction
    //            ^^^^^^^^^^^  CallExpression - child(0)
    //            ^^^^^^^^^    PropertyAccessExpression - child(0).child(0)
    //   
    // Good:
    //  Log.Debug()(); // semicolon is optional and makes no difference
    //  ^^^^^^^^^^^^^^ ExpressionStatement
    //  ^^^^^^^^^^^^   CallExpression - child(0)
    //  ^^^^^^^^^^^    CallExpression - child(0).child(0)
    //   
    // Not Good:
    //  Log.Debug(); // semicolon is optional and makes no difference
    //  ^^^^^^^^^^^^ ExpressionStatement
    //  ^^^^^^^^^^^  CallExpression - child(0) 
    //      ^^^^^^^  PropertyAccessExpression - child(0).child(2)
    BracketsloggerCustomDebugRuleWalker.prototype.isProbablyOurCustomDebug = function (node) {
        if (node.getChildCount() != 3)
            return false;
        var subnode = node.getChildAt(2);
        if (subnode.kind === ts.SyntaxKind.Identifier &&
            node.getChildAt(0).kind === ts.SyntaxKind.Identifier &&
            node.getChildAt(1).kind === ts.SyntaxKind.DotToken) {
            var ct = subnode.getText();
            if (ct === 'Debug' ||
                ct === 'Info' ||
                ct === 'Trace' ||
                ct === 'Warn' ||
                ct === 'Error') {
                return true;
            }
        }
        return false;
    };
    BracketsloggerCustomDebugRuleWalker.prototype.visitCallExpression = function (node) {
        if (node.parent.kind === typescript_1.SyntaxKind.ArrowFunction) {
            var propExpr = node.getChildCount() > 0 && node.getChildAt(0);
            if (propExpr.kind === ts.SyntaxKind.PropertyAccessExpression &&
                this.isProbablyOurCustomDebug(propExpr)) {
                this.addFailureAt(propExpr.getChildAt(2).getStart(), propExpr.getChildAt(2).getWidth(), 'Suspect Debug missing executive brackets - will not produce console output');
            }
        }
        _super.prototype.visitCallExpression.call(this, node);
    };
    BracketsloggerCustomDebugRuleWalker.prototype.isMaybeBrokenCustomDebugCallExpression = function (node) {
        var expr = node.getChildCount() > 0 && node.getChildAt(0);
        var propExpr = expr && expr.getChildCount() > 0 && expr.getChildAt(0);
        if (expr && expr.kind === ts.SyntaxKind.CallExpression &&
            propExpr && propExpr.kind === ts.SyntaxKind.PropertyAccessExpression) {
            return this.isProbablyOurCustomDebug(propExpr);
        }
        return false;
    };
    BracketsloggerCustomDebugRuleWalker.prototype.visitExpressionStatement = function (node) {
        if (this.isMaybeBrokenCustomDebugCallExpression(node)) {
            var offender = node.getChildAt(0).getChildAt(0).getChildAt(2);
            this.addFailureAt(offender.getStart(), offender.getWidth(), 'Suspect Debug missing executive brackets - will not produce console output');
        }
        _super.prototype.visitExpressionStatement.call(this, node);
    };
    return BracketsloggerCustomDebugRuleWalker;
}(ErrorTolerantWalker_1.ErrorTolerantWalker));
