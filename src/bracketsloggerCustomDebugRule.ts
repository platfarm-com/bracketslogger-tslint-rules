import * as ts from 'typescript';
import * as Lint from 'tslint';
import { ErrorTolerantWalker } from './tslint-microsoft-contrib/ErrorTolerantWalker';
import { ExtendedMetadata } from './tslint-microsoft-contrib/ExtendedMetadata';
import { Utils } from './tslint-microsoft-contrib/Utils';
import { SyntaxKind } from 'typescript';

const FAILURE_STRING: string = 'Debug.log() call missing final bracket; log will not be displayed in console: ';

/**
 * Implementation of the bracketslogger-custom-debug rule.
 */
export class Rule extends Lint.Rules.AbstractRule {
  public static metadata: ExtendedMetadata = {
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

  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithWalker(new BracketsloggerCustomDebugRuleWalker(sourceFile, this.getOptions()));
  }
}

class BracketsloggerCustomDebugRuleWalker extends ErrorTolerantWalker {
  protected visitSourceFile(node: ts.SourceFile): void {
    // if () { do not call super if we dont want to process this file
    super.visitSourceFile(node);
  }

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

  private isProbablyOurCustomDebug(node: ts.PropertyAccessExpression) {
    if (node.getChildCount() != 3) return false;
    const subnode = node.getChildAt(2);
    if (subnode.kind === ts.SyntaxKind.Identifier &&
        node.getChildAt(0).kind === ts.SyntaxKind.Identifier &&
        node.getChildAt(1).kind === ts.SyntaxKind.DotToken) {
      const ct = subnode.getText();
      if (ct === 'Debug' || 
          ct === 'Info' ||
          ct === 'Trace' ||
          ct === 'Warn' ||
          ct === 'Error') {
        return true;
      }
    }
    return false;
  }

  protected visitCallExpression(node: ts.CallExpression): void {
    if (node.parent.kind === SyntaxKind.ArrowFunction) {
      const propExpr = node.getChildCount() > 0 && node.getChildAt(0);
      if (propExpr.kind === ts.SyntaxKind.PropertyAccessExpression &&
        this.isProbablyOurCustomDebug(propExpr as ts.PropertyAccessExpression)) {
        this.addFailureAt(propExpr.getChildAt(2).getStart(), propExpr.getChildAt(2).getWidth(), 'Suspect Debug missing executive brackets - will not produce console output');
      }
    }
    super.visitCallExpression(node);
  }

  private isMaybeBrokenCustomDebugCallExpression(node: ts.Node) {
    const expr = node.getChildCount() > 0 && node.getChildAt(0);
    const propExpr = expr && expr.getChildCount() > 0 && expr.getChildAt(0);
    if (expr && expr.kind === ts.SyntaxKind.CallExpression &&
      propExpr && propExpr.kind === ts.SyntaxKind.PropertyAccessExpression
    ) {
      return this.isProbablyOurCustomDebug(propExpr as ts.PropertyAccessExpression);
    }
    return false;
  }

  protected visitExpressionStatement(node: ts.ExpressionStatement): void {
    if (this.isMaybeBrokenCustomDebugCallExpression(node)) {
      const offender = node.getChildAt(0).getChildAt(0).getChildAt(2);
      this.addFailureAt(offender.getStart(), offender.getWidth(), 'Suspect Debug missing executive brackets - will not produce console output');
    }
    super.visitExpressionStatement(node);
  }
}
