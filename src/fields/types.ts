export type FieldKind = "money" | "number" | "percent" | "date" | "bool" | "text";

/** A box in screen-relative units: 0..1 on both axes, origin top-left. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Field {
  id: string;
  label: string;
  /** The value as displayed, never pre-normalized. */
  value: string;
  kind?: FieldKind;
  box?: Box;
  /** Logical section on the screen, for example "totals" or "lines". */
  group?: string;
}

export interface Screen {
  id: string;
  app: string;
  title?: string;
  fields: Field[];
}
