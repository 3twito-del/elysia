import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { describe, expect, it } from "vitest";

import { Input } from "./input";
import { Textarea } from "./textarea";

const root = process.cwd();
const sourceRoots = ["src/app", "src/components"];
const visibleFieldTags = new Set(["input", "select", "textarea"]);
const ignoredFieldTypes = new Set([
  "button",
  "checkbox",
  "file",
  "hidden",
  "radio",
  "reset",
  "submit",
]);
const autofillRecognizedNamePattern =
  /(^|[-_])(address|city|code|coupon|email|identifier|message|name|notes|password|phone|postal|reason|recipient|street|tel|url|zip)([-_]|$)/iu;

describe("form autocomplete contract", () => {
  it("renders shared text controls with an explicit autocomplete fallback", () => {
    expect(renderToStaticMarkup(<Input name="email" />)).toMatch(
      /autocomplete="off"/iu,
    );
    expect(renderToStaticMarkup(<Textarea name="message" />)).toMatch(
      /autocomplete="off"/iu,
    );
  });

  it("keeps native recognizable form fields from omitting autocomplete", () => {
    const violations = listNativeAutocompleteViolations();

    expect(violations).toEqual([]);
  });
});

function listNativeAutocompleteViolations() {
  return sourceRoots
    .flatMap((sourceRoot) => listTsxFiles(path.join(root, sourceRoot)))
    .flatMap((filePath) => getNativeAutocompleteViolations(filePath));
}

function listTsxFiles(dirPath: string): string[] {
  return readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      return listTsxFiles(entryPath);
    }

    return entry.isFile() && entry.name.endsWith(".tsx") ? [entryPath] : [];
  });
}

function getNativeAutocompleteViolations(filePath: string) {
  const relativePath = path.relative(root, filePath).replaceAll("\\", "/");
  const sourceText = readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    relativePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const violations: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName.getText(sourceFile);

      if (
        visibleFieldTags.has(tagName) &&
        isRecognizedField(node, sourceFile)
      ) {
        const location = sourceFile.getLineAndCharacterOfPosition(
          node.getStart(sourceFile),
        );

        violations.push(
          `${relativePath}:${location.line + 1}:${location.character + 1}`,
        );
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return violations;
}

function isRecognizedField(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  sourceFile: ts.SourceFile,
) {
  const fieldType = getJsxAttributeValue(node, "type", sourceFile) ?? "text";

  if (ignoredFieldTypes.has(fieldType)) {
    return false;
  }

  if (getJsxAttributeValue(node, "autoComplete", sourceFile)) {
    return false;
  }

  const fieldIdentity = [
    getJsxAttributeValue(node, "id", sourceFile),
    getJsxAttributeValue(node, "name", sourceFile),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  return autofillRecognizedNamePattern.test(fieldIdentity);
}

function getJsxAttributeValue(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  name: string,
  sourceFile: ts.SourceFile,
) {
  const attribute = node.attributes.properties.find(
    (property): property is ts.JsxAttribute =>
      ts.isJsxAttribute(property) && property.name.getText(sourceFile) === name,
  );

  if (!attribute) {
    return undefined;
  }

  if (!attribute.initializer) {
    return "";
  }

  if (ts.isStringLiteral(attribute.initializer)) {
    return attribute.initializer.text;
  }

  return attribute.initializer.getText(sourceFile);
}
