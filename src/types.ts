/**
 * Type definitions and Zod schemas for JsonMap.
 *
 * @remarks
 * All Zod schemas are the source of truth; TypeScript types are derived via {@link z.infer}.
 *
 */

import { z } from 'zod';

/**
 * Schema for a single JsonMap transformation step.
 *
 * @remarks
 * A transform specifies a method path and one or more parameter paths
 * used during map evaluation.
 */
export const jsonMapTransformSchema = z.object({
  method: z.string(),
  params: z.union([z.string(), z.string().array()]),
});

/** A single JsonMap transformation step. */
export type JsonMapTransform = z.infer<typeof jsonMapTransformSchema>;

/**
 * Schema for a dynamic value node in a JsonMap.
 *
 * @remarks
 * A dynamic node is an object whose sole key is `$`, holding one or more
 * {@link JsonMapTransform} steps.
 */
export const jsonMapDynamicSchema = z.object({
  $: z.union([jsonMapTransformSchema, jsonMapTransformSchema.array()]),
});

/** A dynamic value node in a JsonMap. */
export type JsonMapDynamic = z.infer<typeof jsonMapDynamicSchema>;

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

/** A JSON literal value. */
type Literal = z.infer<typeof literalSchema>;

/** Any valid JSON value. */
export type Json = Literal | { [key: string]: Json } | Json[];

/** A library of functions available to JsonMap transformations. */
export type JsonMapLib =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { [key: string]: JsonMapLib | ((x: any) => any) } | JsonMapLib[];

/**
 * Schema for a recursive JsonMap map definition.
 *
 * @remarks
 * A map node is either a JSON literal, an array of map nodes, or an object
 * whose values are map nodes or {@link JsonMapDynamic} nodes.
 */
export const jsonMapMapSchema: z.ZodType<
  Literal | Record<string, unknown> | unknown[]
> = z.lazy(() =>
  z.union([
    literalSchema,
    z.record(z.string(), z.union([jsonMapMapSchema, jsonMapDynamicSchema])),
    z.array(jsonMapMapSchema),
  ]),
);

/**
 * A recursive JsonMap map definition.
 *
 * @remarks
 * This type is the union of JSON literals, objects mapping string keys to
 * either nested maps or {@link JsonMapDynamic} nodes, and arrays of maps.
 */
export type JsonMapMap =
  | Literal
  | { [key: string]: JsonMapMap | JsonMapDynamic }
  | JsonMapMap[];

/**
 * Schema for JsonMap constructor options.
 */
export const jsonMapOptionsSchema = z.object({
  ignore: z.union([z.string(), z.instanceof(RegExp)]).optional(),
});

/** Options passed to the {@link JsonMap} constructor. */
export type JsonMapOptions = z.infer<typeof jsonMapOptionsSchema>;

/** Parameters for path resolution. */
export interface PathResolutionParams {
  obj?: string;
  path: string;
}

/** Map of pattern strings to path resolution functions. */
export type PathResolutionMap = Record<
  string,
  (x: PathResolutionParams) => { obj: unknown; path: string }
>;

/** Replacer/reviver function signature for JSON serialisation. */
export type JsonFn = (this: unknown, key: string, value: unknown) => unknown;
