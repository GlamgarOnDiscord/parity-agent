/** One object found by SAM 3.1, box in screen-relative units (0..1). */
export interface SamObject {
  id: number;
  box: { x: number; y: number; w: number; h: number };
}

/**
 * Parse SAM 3.1 special-token output, for example
 * `<0f>0<|box;x1=90;y1=70;x2=190;y2=100;w=320;h=120|><|mask;...|>`. Masks are kept out: boxes are enough to
 * place fields, and the mask payload is large.
 */
export function parseSam(output: string): SamObject[] {
  const objects: SamObject[] = [];
  const pattern =
    /<\|box;x1=(\d+(?:\.\d+)?);y1=(\d+(?:\.\d+)?);x2=(\d+(?:\.\d+)?);y2=(\d+(?:\.\d+)?);w=(\d+);h=(\d+)\|>/g;
  for (const m of output.slice(0, 2_000_000).matchAll(pattern)) {
    const [x1, y1, x2, y2, w, h] = m.slice(1, 7).map(Number) as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    if (!w || !h) continue;
    objects.push({ id: objects.length, box: { x: x1 / w, y: y1 / h, w: (x2 - x1) / w, h: (y2 - y1) / h } });
  }
  return objects;
}
