/**
 * A tiny arithmetic language for computation rules, evaluated in plain code (never `eval`):
 *   numbers, field references in braces like {Sub Total}, + - * / and parentheses,
 *   round(x, digits) half up, min(a, b), max(a, b), abs(x), and sum({Label}) over every field with that
 *   label on the screen (the lines of an invoice, for example).
 * Example: round(({Sub Total} + {GST (5%)}) * 0.09975, 2)
 */
export type Expr =
  | { kind: "num"; value: number }
  | { kind: "field"; label: string }
  | { kind: "neg"; arg: Expr }
  | { kind: "bin"; op: "+" | "-" | "*" | "/"; left: Expr; right: Expr }
  | { kind: "call"; name: "round" | "min" | "max" | "abs"; args: Expr[] }
  | { kind: "sum"; label: string };

const MAX_LENGTH = 500;
const FUNCTIONS = new Set(["round", "min", "max", "abs"]);

export function parseExpr(source: string): Expr {
  if (source.length > MAX_LENGTH) throw new Error("expression too long");
  let i = 0;
  const peek = () => {
    while (source[i] === " ") i++;
    return source[i];
  };
  const expect = (c: string) => {
    if (peek() !== c) throw new Error(`expected "${c}" at ${i} in: ${source}`);
    i++;
  };

  function primary(): Expr {
    const c = peek();
    if (c === "(") {
      i++;
      const e = sum();
      expect(")");
      return e;
    }
    if (c === "-") {
      i++;
      return { kind: "neg", arg: primary() };
    }
    if (c === "{") {
      const end = source.indexOf("}", i);
      if (end < 0) throw new Error(`unclosed field reference in: ${source}`);
      const label = source.slice(i + 1, end).trim();
      if (!label) throw new Error("empty field reference");
      i = end + 1;
      return { kind: "field", label };
    }
    const num = /^\d+(\.\d+)?/.exec(source.slice(i));
    if (num) {
      i += num[0].length;
      return { kind: "num", value: Number(num[0]) };
    }
    const name = /^[a-z]+/.exec(source.slice(i));
    if (name?.[0] === "sum") {
      i += 3;
      expect("(");
      const inner = primary();
      if (inner.kind !== "field") throw new Error(`sum() takes one field reference in: ${source}`);
      expect(")");
      return { kind: "sum", label: inner.label };
    }
    if (name && FUNCTIONS.has(name[0])) {
      i += name[0].length;
      expect("(");
      const args = [sum()];
      while (peek() === ",") {
        i++;
        args.push(sum());
      }
      expect(")");
      return { kind: "call", name: name[0] as "round" | "min" | "max" | "abs", args };
    }
    throw new Error(`unexpected "${c ?? "end"}" at ${i} in: ${source}`);
  }
  function product(): Expr {
    let left = primary();
    for (let c = peek(); c === "*" || c === "/"; c = peek()) {
      i++;
      left = { kind: "bin", op: c, left, right: primary() };
    }
    return left;
  }
  function sum(): Expr {
    let left = product();
    for (let c = peek(); c === "+" || c === "-"; c = peek()) {
      i++;
      left = { kind: "bin", op: c, left, right: product() };
    }
    return left;
  }

  const e = sum();
  if (peek() !== undefined) throw new Error(`unexpected "${peek()}" at ${i} in: ${source}`);
  return e;
}

export function fieldsOf(e: Expr): string[] {
  switch (e.kind) {
    case "num":
      return [];
    case "field":
    case "sum":
      return [e.label];
    case "neg":
      return fieldsOf(e.arg);
    case "bin":
      return [...fieldsOf(e.left), ...fieldsOf(e.right)];
    case "call":
      return e.args.flatMap(fieldsOf);
  }
}

/** Half up, decimal-safe: 19.975 rounds to 19.98 as accounting software does. */
export function roundHalfUp(x: number, digits: number): number {
  const f = 10 ** digits;
  return (Math.sign(x) * Math.round(Number((Math.abs(x) * f).toPrecision(12)))) / f;
}

export function evaluate(
  e: Expr,
  values: (label: string) => number | undefined,
  all: (label: string) => number[] = (label) => {
    const v = values(label);
    return v === undefined ? [] : [v];
  },
): number {
  switch (e.kind) {
    case "sum": {
      const vs = all(e.label);
      if (vs.length === 0) throw new Error(`no value for {${e.label}}`);
      return vs.reduce((a, b) => a + b, 0);
    }
    case "num":
      return e.value;
    case "field": {
      const v = values(e.label);
      if (v === undefined) throw new Error(`no value for {${e.label}}`);
      return v;
    }
    case "neg":
      return -evaluate(e.arg, values, all);
    case "bin": {
      const a = evaluate(e.left, values, all);
      const b = evaluate(e.right, values, all);
      if (e.op === "/" && b === 0) throw new Error("division by zero");
      return e.op === "+" ? a + b : e.op === "-" ? a - b : e.op === "*" ? a * b : a / b;
    }
    case "call": {
      const args = e.args.map((a) => evaluate(a, values, all));
      switch (e.name) {
        case "round":
          return roundHalfUp(args[0] ?? Number.NaN, args[1] ?? 0);
        case "abs":
          return Math.abs(args[0] ?? Number.NaN);
        case "min":
          return Math.min(...args);
        case "max":
          return Math.max(...args);
      }
    }
  }
}
