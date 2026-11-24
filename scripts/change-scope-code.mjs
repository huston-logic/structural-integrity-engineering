// Parser-based checks for the .ts and .tsx files a client change may touch. A content module runs at build time (and
// contact-fields.ts also runs inside the contact Worker), so "it only changes text" is not enough: the file must BE
// plain data. A new page must be built only from what the site already has. Uses the TypeScript parser, which is already
// a dev dependency; nothing is executed. This is best-effort static analysis, one layer among several (CodeQL, the
// required checks and the preview are the others); see docs/CHANGE-SCOPE.md.
import ts from "typescript";
import { rules as defaultRules } from "./change-scope-rules.mjs";

const { SyntaxKind: K } = ts;
const kindName = (node) => ts.SyntaxKind[node.kind];

/** `import type { A } from "x"` and `import { type A } from "x"`: erased at build time, so they run nothing. */
function isTypeOnlyImport(node) {
  const clause = node.importClause;
  if (!clause) return false;
  if (clause.isTypeOnly) return true;
  const bindings = clause.namedBindings;
  return !clause.name && !!bindings && ts.isNamedImports(bindings) && bindings.elements.length > 0 && bindings.elements.every((e) => e.isTypeOnly);
}

const specifierOf = (node) => (ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : "(not a string)");

// ---- content modules: plain data only ---------------------------------------------------------------------------

function contentImportAllowed(spec, rules) {
  const match = /^(?:\.\/|@\/content\/)([A-Za-z0-9_-]+)$/.exec(spec);
  return !!match && !rules.contentWiring.includes(`src/content/${match[1]}.ts`);
}

function dataProblem(node, rules) {
  switch (node.kind) {
    case K.StringLiteral:
    case K.NoSubstitutionTemplateLiteral:
    case K.NumericLiteral:
    case K.BigIntLiteral:
    case K.TrueKeyword:
    case K.FalseKeyword:
    case K.NullKeyword:
      return null;
    case K.Identifier:
      return rules.denyIdentifiers.includes(node.text) ? `uses ${node.text}` : null;
    case K.ArrayLiteralExpression:
      return firstProblem(node.elements, (n) => dataProblem(n, rules));
    case K.SpreadElement:
    case K.AsExpression:
    case K.SatisfiesExpression:
    case K.ParenthesizedExpression:
    case K.TypeAssertionExpression:
    case K.NonNullExpression:
      return dataProblem(node.expression, rules);
    case K.PrefixUnaryExpression:
      return dataProblem(node.operand, rules);
    case K.PropertyAccessExpression:
      return rules.denyProperties.includes(node.name.text) || rules.denyMethodReads.includes(node.name.text) ? `uses .${node.name.text}` : dataProblem(node.expression, rules);
    case K.BinaryExpression:
      return node.operatorToken.kind === K.PlusToken ? firstProblem([node.left, node.right], (n) => dataProblem(n, rules)) : `uses an operator (${kindName(node.operatorToken)})`;
    case K.ObjectLiteralExpression:
      return firstProblem(node.properties, (prop) => {
        if (ts.isShorthandPropertyAssignment(prop)) return dataProblem(prop.name, rules);
        if (ts.isSpreadAssignment(prop)) return dataProblem(prop.expression, rules);
        if (!ts.isPropertyAssignment(prop)) return `has a method or accessor (${kindName(prop)})`;
        return keyProblem(prop.name, rules) ?? dataProblem(prop.initializer, rules);
      });
    default:
      return `uses ${kindName(node)}, which is code, not data`;
  }
}

/** An object key: a name, string or number, never computed, and never one that reaches the prototype chain or raw HTML. */
function keyProblem(name, rules) {
  if (ts.isComputedPropertyName(name)) return "uses a computed property name";
  const text = ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name) ? name.text : null;
  if (text === null) return `uses a property name of kind ${kindName(name)}`;
  return rules.denyProperties.includes(text) || rules.denyIdentifiers.includes(text) ? `uses the property name ${text}` : null;
}

/** Why the parser found a syntax error, or null. The build uses a different parser, so tolerated errors could be read differently. */
function syntaxProblem(source) {
  return source.parseDiagnostics?.length > 0 ? "has a syntax error" : null;
}

function firstProblem(nodes, check) {
  for (const node of nodes) {
    const problem = check(node);
    if (problem) return problem;
  }
  return null;
}

function contentStatementProblem(statement, rules) {
  if (ts.isEmptyStatement(statement)) return null;
  if (ts.isImportDeclaration(statement)) {
    if (isTypeOnlyImport(statement) || contentImportAllowed(specifierOf(statement), rules)) return null;
    return `imports ${specifierOf(statement)}, which a content file may not import`;
  }
  if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) return null;
  if (ts.isExportDeclaration(statement)) {
    return statement.isTypeOnly || !statement.moduleSpecifier ? null : `re-exports from ${specifierOf(statement)}`;
  }
  if (ts.isVariableStatement(statement)) {
    const { flags } = statement.declarationList;
    if (!(flags & ts.NodeFlags.Const) || flags & ts.NodeFlags.Using) return "declares a variable that is not a plain const";
    return firstProblem(statement.declarationList.declarations, (d) => {
      if (!ts.isIdentifier(d.name)) return "takes a value apart (destructuring)";
      return d.initializer ? dataProblem(d.initializer, rules) : null;
    });
  }
  return `contains ${kindName(statement)}, which is code, not data`;
}

/** Why `text` is not a plain-data content module, or null when it is. */
export function contentModuleProblem(text, rules = defaultRules) {
  if (text.includes("\0")) return "contains a binary (NUL) byte";
  const source = ts.createSourceFile("module.ts", text, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  return syntaxProblem(source) ?? firstProblem(source.statements, (s) => contentStatementProblem(s, rules));
}

// ---- new pages --------------------------------------------------------------------------------------------------

const URL_ATTRIBUTES = new Set(["href", "src", "action", "formAction", "srcSet", "poster", "data", "xlinkHref"]);
const PAGE_STATEMENTS = [ts.isVariableStatement, ts.isFunctionDeclaration, ts.isTypeAliasDeclaration, ts.isInterfaceDeclaration, ts.isExportAssignment];

function pageImportProblem(spec, existsAtBase, rules, typeOnly) {
  const { exact, contentPrefix, componentPrefix } = rules.pageImports;
  // `next` is only allowed for its types (import type { Metadata }): its default export is a server factory.
  if (exact.includes(spec) && (spec !== "next" || typeOnly)) return null;
  if (spec.startsWith(contentPrefix)) {
    const target = `src/content/${spec.slice(contentPrefix.length)}.ts`;
    if (rules.contentFile.test(target) && !rules.contentWiring.includes(target)) return null;
  } else if (spec.startsWith(componentPrefix)) {
    const target = `src/components/${spec.slice(componentPrefix.length)}`;
    if ([".tsx", ".ts", "/index.tsx", "/index.ts"].some((ending) => existsAtBase(target + ending))) return null;
  }
  return `a new page imports ${spec}, which is not an existing component, content file or @/lib/metadata`;
}

function pageNodeProblem(node, rules) {
  if (ts.isIdentifier(node) && rules.denyIdentifiers.includes(node.text)) return `a new page may not use ${node.text}`;
  if (ts.isPropertyAccessExpression(node) && (rules.denyProperties.includes(node.name.text) || rules.denyMethodReads.includes(node.name.text))) return `a new page may not use .${node.name.text}`;
  if (ts.isElementAccessExpression(node)) {
    const key = node.argumentExpression;
    if ((ts.isStringLiteral(key) || ts.isNoSubstitutionTemplateLiteral(key)) && (rules.denyProperties.includes(key.text) || rules.denyIdentifiers.includes(key.text))) {
      return `a new page may not use ["${key.text}"]`;
    }
    if (ts.isBinaryExpression(key) || ts.isTemplateExpression(key) || ts.isCallExpression(key)) return "a new page may not build a property name at run time";
  }
  if (ts.isCallExpression(node) && node.expression.kind === K.ImportKeyword) return "a new page may not use a dynamic import()";
  if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
    const tag = node.tagName.getText();
    if (rules.denyJsxTags.includes(tag)) return `a new page may not use the <${tag}> tag`;
  }
  if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer) && /^\s*(?:javascript|data):/i.test(node.initializer.text)) {
    return `a new page may not use a ${node.initializer.text.split(":")[0]}: link`;
  }
  // HTML entities decode after this check (&#106;avascript:), so a link attribute may not contain any.
  if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer) && URL_ATTRIBUTES.has(node.name.getText()) && /&#|&(?:colon|tab|newline);/i.test(node.initializer.text)) {
    return "a new page may not use an HTML character reference in a link attribute";
  }
  return undefined;
}

// The page grammar is an ALLOWLIST. A denylist of dangerous names can never be completed (a property name built at run
// time reaches the Function constructor without any banned word), so a new page may only be JSX, content values and a few
// call forms; everything else is rejected. pageNodeProblem above stays first because it gives readable reasons.
const SAFE_TAGS = new Set([
  "a", "abbr", "address", "article", "aside", "b", "blockquote", "br", "caption", "cite", "code", "dd", "details", "div", "dl", "dt", "em",
  "figcaption", "figure", "footer", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "i", "img", "li", "main", "mark", "nav", "ol", "p",
  "pre", "q", "s", "section", "small", "span", "strong", "sub", "summary", "sup", "table", "tbody", "td", "tfoot", "th", "thead", "time", "tr", "u", "ul",
]);
const ARRAY_METHODS = new Set(["map", "filter", "flatMap", "slice", "join", "concat"]);
const CALLBACK_METHODS = new Set(["map", "filter", "flatMap"]);
const OPERATORS = new Set([K.PlusToken, K.MinusToken, K.AmpersandAmpersandToken, K.BarBarToken, K.QuestionQuestionToken, K.EqualsEqualsEqualsToken, K.ExclamationEqualsEqualsToken, K.LessThanToken, K.GreaterThanToken, K.LessThanEqualsToken, K.GreaterThanEqualsToken]);

function bindingNames(node, names = []) {
  if (ts.isIdentifier(node)) names.push(node.text);
  else if (ts.isObjectBindingPattern(node) || ts.isArrayBindingPattern(node)) {
    for (const element of node.elements) if (ts.isBindingElement(element)) bindingNames(element.name, names);
  }
  return names;
}

function bindingProblem(name, rules) {
  if (ts.isIdentifier(name)) return null;
  if (!ts.isObjectBindingPattern(name) && !ts.isArrayBindingPattern(name)) return `uses ${kindName(name)}`;
  return firstProblem(name.elements.filter(ts.isBindingElement), (element) => {
    if (element.initializer) return "a new page may not use default values when taking values apart";
    if (element.propertyName && !ts.isIdentifier(element.propertyName)) return "a new page may not use a computed name when taking values apart";
    const picked = element.propertyName ?? element.name;
    if (ts.isIdentifier(picked) && (rules.denyProperties.includes(picked.text) || rules.denyMethodReads.includes(picked.text) || ARRAY_METHODS.has(picked.text) || rules.denyIdentifiers.includes(picked.text)) && !ts.isArrayBindingPattern(name)) {
      return `a new page may not take ${picked.text} out of a value`;
    }
    return bindingProblem(element.name, rules);
  });
}

/** An object key named like an allowed array method would make `const o = { concat: fn }; o.concat(...)` a call primitive. */
function arrayMethodKey(name) {
  return (ts.isIdentifier(name) || ts.isStringLiteral(name)) && ARRAY_METHODS.has(name.text) ? `a new page may not use ${name.text} as an object key` : null;
}

/** The value a .map/.filter/... call is made on: an array, a name, a property or element read, or another call. Never an object literal. */
function receiverProblem(node) {
  let inner = node;
  while (ts.isParenthesizedExpression(inner) || ts.isAsExpression(inner) || ts.isNonNullExpression(inner) || ts.isSatisfiesExpression(inner)) inner = inner.expression;
  const ok = ts.isArrayLiteralExpression(inner) || ts.isIdentifier(inner) || ts.isPropertyAccessExpression(inner) || ts.isElementAccessExpression(inner) || ts.isCallExpression(inner) || ts.isStringLiteral(inner);
  return ok ? null : `a new page may not call .map/.filter/.join and similar on ${kindName(inner)}`;
}

function pageGrammarProblem(source, rules) {
  const names = new Set();
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement) && statement.importClause) {
      const { name, namedBindings } = statement.importClause;
      if (name) names.add(name.text);
      if (namedBindings && ts.isNamespaceImport(namedBindings)) names.add(namedBindings.name.text);
      if (namedBindings && ts.isNamedImports(namedBindings)) for (const element of namedBindings.elements) names.add(element.name.text);
    } else if (ts.isFunctionDeclaration(statement) && statement.name) names.add(statement.name.text);
  }
  const imported = new Set(names);
  // Every name the page declares anywhere (imports, consts, functions, parameters, destructured bindings). An identifier that
  // is not one of these is an ambient global (Object, parseInt, Array ...), and globals are how a denylist gets walked around.
  const declared = new Set(names);
  const collect = (node) => {
    if (ts.isVariableDeclaration(node) || ts.isParameter(node)) for (const name of bindingNames(node.name)) declared.add(name);
    if (ts.isFunctionDeclaration(node) && node.name) declared.add(node.name.text);
    ts.forEachChild(node, collect);
  };
  collect(source);

  const bad = (what) => `a new page may not use ${what}`;
  const expr = (node, callbackOk = false) => {
    switch (node.kind) {
      case K.StringLiteral: case K.NoSubstitutionTemplateLiteral: case K.NumericLiteral: case K.BigIntLiteral: case K.TrueKeyword: case K.FalseKeyword: case K.NullKeyword:
        return null;
      case K.Identifier:
        return node.text === "undefined" || declared.has(node.text) ? null : bad(`the name ${node.text} (it is not declared or imported in this page)`);
      case K.PropertyAccessExpression:
        return expr(node.expression);
      case K.ElementAccessExpression:
        return ts.isNumericLiteral(node.argumentExpression) ? expr(node.expression) : bad("square brackets with anything but a number");
      case K.ArrayLiteralExpression:
        return firstProblem(node.elements, (element) => expr(ts.isSpreadElement(element) ? element.expression : element));
      case K.ObjectLiteralExpression:
        return firstProblem(node.properties, (prop) => {
          if (ts.isShorthandPropertyAssignment(prop)) return keyProblem(prop.name, rules) ?? arrayMethodKey(prop.name) ?? expr(prop.name);
          if (ts.isSpreadAssignment(prop)) return expr(prop.expression);
          if (!ts.isPropertyAssignment(prop)) return bad("a method or accessor in an object");
          return keyProblem(prop.name, rules) ?? arrayMethodKey(prop.name) ?? expr(prop.initializer);
        });
      case K.ParenthesizedExpression: case K.AsExpression: case K.SatisfiesExpression: case K.NonNullExpression: case K.TypeAssertionExpression:
        return expr(node.expression);
      case K.PrefixUnaryExpression:
        return node.operator === K.ExclamationToken || node.operator === K.MinusToken ? expr(node.operand) : bad("that operator");
      case K.BinaryExpression:
        return OPERATORS.has(node.operatorToken.kind) ? firstProblem([node.left, node.right], (n) => expr(n)) : bad(`the operator ${node.operatorToken.getText()}`);
      case K.ConditionalExpression:
        return firstProblem([node.condition, node.whenTrue, node.whenFalse], (n) => expr(n));
      case K.CallExpression: {
        const callee = node.expression;
        let allowCallbacks = false;
        if (ts.isIdentifier(callee)) {
          if (!imported.has(callee.text)) return bad(`a call to ${callee.text} (pages may call only imported or local helpers and ${[...ARRAY_METHODS].join("/")})`);
        } else if (ts.isPropertyAccessExpression(callee) && ARRAY_METHODS.has(callee.name.text)) {
          const receiver = receiverProblem(callee.expression) ?? expr(callee.expression);
          if (receiver) return receiver;
          allowCallbacks = CALLBACK_METHODS.has(callee.name.text);
          // .map/.filter/.flatMap take exactly one inline arrow function; .slice/.join/.concat take plain values.
          if (allowCallbacks && !(node.arguments.length === 1 && ts.isArrowFunction(node.arguments[0]))) return bad(`.${callee.name.text}() with anything but one inline arrow function`);
          if (callee.name.text === "concat" && !node.arguments.every((a) => ts.isIdentifier(a) || ts.isArrayLiteralExpression(a) || ts.isStringLiteral(a) || ts.isNumericLiteral(a))) {
            return bad(".concat() with anything but names, arrays or plain values");
          }
          if (!allowCallbacks && callee.name.text !== "concat" && !node.arguments.every((a) => ts.isNumericLiteral(a) || ts.isStringLiteral(a) || (ts.isPrefixUnaryExpression(a) && ts.isNumericLiteral(a.operand)))) {
            return bad(`.${callee.name.text}() with anything but plain numbers or text`);
          }
        } else return bad("that kind of call");
        return firstProblem(node.arguments, (argument) => expr(argument, allowCallbacks));
      }
      case K.ArrowFunction: {
        if (!callbackOk) return bad("a function here (only .map/.filter callbacks may be functions)");
        if (node.modifiers?.length) return bad("an async function");
        const parameters = firstProblem(node.parameters, (p) => (p.initializer ? bad("default values in parameters") : bindingProblem(p.name, rules)));
        return parameters ?? (ts.isBlock(node.body) ? statements(node.body.statements) : expr(node.body));
      }
      case K.JsxElement: case K.JsxSelfClosingElement: case K.JsxFragment:
        return jsx(node);
      default:
        return bad(`${kindName(node)}`);
    }
  };

  const statements = (list) =>
    firstProblem(list, (statement) => {
      if (ts.isReturnStatement(statement)) return statement.expression ? expr(statement.expression) : null;
      if (ts.isEmptyStatement(statement)) return null;
      if (ts.isVariableStatement(statement)) {
        if (!(statement.declarationList.flags & ts.NodeFlags.Const) || statement.declarationList.flags & ts.NodeFlags.Using) return bad("a variable that is not a plain const");
        return firstProblem(statement.declarationList.declarations, (d) => bindingProblem(d.name, rules) ?? (d.initializer ? expr(d.initializer) : null));
      }
      return bad(`${kindName(statement)} inside a function`);
    });

  const jsxTag = (tag) => {
    if (ts.isIdentifier(tag)) return /^[a-z]/.test(tag.text) ? (SAFE_TAGS.has(tag.text) ? null : bad(`the <${tag.text}> tag`)) : names.has(tag.text) ? null : bad(`the <${tag.text}> component (it is not imported)`);
    if (ts.isPropertyAccessExpression(tag)) return jsxTag(tag.expression);
    return bad("that kind of tag");
  };
  const jsxAttribute = (attribute) => {
    if (ts.isJsxSpreadAttribute(attribute)) return bad("spread attributes ({...props})");
    if (!ts.isIdentifier(attribute.name)) return bad("a namespaced attribute");
    const { initializer } = attribute;
    if (!initializer) return null;
    if (ts.isStringLiteral(initializer)) return null;
    if (!ts.isJsxExpression(initializer) || !initializer.expression) return bad("that attribute value");
    if (URL_ATTRIBUTES.has(attribute.name.text) && !(ts.isStringLiteral(initializer.expression) || ts.isIdentifier(initializer.expression) || ts.isPropertyAccessExpression(initializer.expression) || ts.isCallExpression(initializer.expression))) {
      return bad(`a computed value for ${attribute.name.text}`);
    }
    return expr(initializer.expression);
  };
  const jsxChild = (child) => {
    if (ts.isJsxText(child)) return null;
    if (ts.isJsxExpression(child)) return child.expression && !child.dotDotDotToken ? expr(child.expression) : child.dotDotDotToken ? bad("spread children") : null;
    return jsx(child);
  };
  const jsx = (node) => {
    if (ts.isJsxFragment(node)) return firstProblem(node.children, jsxChild);
    const opening = ts.isJsxElement(node) ? node.openingElement : node;
    const own = jsxTag(opening.tagName) ?? firstProblem(opening.attributes.properties, jsxAttribute);
    return own ?? (ts.isJsxElement(node) ? firstProblem(node.children, jsxChild) : null);
  };

  const functionProblem = (fn) => {
    if (fn.asteriskToken || fn.modifiers?.some((m) => m.kind === K.AsyncKeyword)) return bad("an async or generator function");
    const parameters = firstProblem(fn.parameters, (p) => (p.initializer ? bad("default values in parameters") : bindingProblem(p.name, rules)));
    return parameters ?? (fn.body ? statements(fn.body.statements) : null);
  };

  return firstProblem(source.statements, (statement) => {
    if (ts.isVariableStatement(statement)) return statements([statement]);
    if (ts.isFunctionDeclaration(statement)) return functionProblem(statement);
    if (ts.isExportAssignment(statement)) return expr(statement.expression);
    return null;
  });
}

/** Why `text` is not an acceptable new page, or null when it is. `existsAtBase` says whether a component file exists. */
export function pageProblem(text, existsAtBase, rules = defaultRules) {
  if (text.includes("\0")) return "contains a binary (NUL) byte";
  const source = ts.createSourceFile("page.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const syntax = syntaxProblem(source);
  if (syntax) return `a new page ${syntax}`;
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      const problem = pageImportProblem(specifierOf(statement), existsAtBase, rules, isTypeOnlyImport(statement));
      if (problem) return problem;
    } else if ((ts.isExportDeclaration(statement) && !statement.moduleSpecifier) || ts.isEmptyStatement(statement)) {
      continue;
    } else if (!PAGE_STATEMENTS.some((is) => is(statement))) {
      return `a new page contains ${kindName(statement)} at the top level, which is not allowed`;
    }
  }
  const visit = (node) => pageNodeProblem(node, rules) ?? ts.forEachChild(node, visit);
  return visit(source) ?? pageGrammarProblem(source, rules) ?? null;
}
