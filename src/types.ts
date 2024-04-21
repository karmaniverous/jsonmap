import { z } from 'zod';

export interface JsonMapOptions {
  ignore?: string | RegExp;
}

const JsonMapTransform = z
  .object({
    method: z.string(),
    params: z.union([z.string(), z.string().array()]),
  })
  .required();

export type JsonMapTransform = z.infer<typeof JsonMapTransform>;

const JsonMapDynamic = z
  .object({
    $: z.union([JsonMapTransform, JsonMapTransform.array()]),
  })
  .required();

type JsonMapDynamic = z.infer<typeof JsonMapDynamic>;

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;

export type Json = Literal | { [key: string]: Json } | Json[];

export type JsonMapLib =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { [key: string]: JsonMapLib | ((x: any) => any) } | JsonMapLib[];

export type JsonMapMap =
  | Literal
  | { [key: string]: JsonMapMap | JsonMapDynamic }
  | JsonMapMap[];

export interface PathResolutionParams {
  obj?: string;
  path: string;
}

export type PathResolutionMap = Record<
  string,
  (x: PathResolutionParams) => { obj: unknown; path: string }
>;

export type JsonFn = (this: unknown, key: string, value: unknown) => unknown;
