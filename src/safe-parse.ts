import type { TypeOf } from "zod";

export function validate<S extends Zod.Schema>(value: unknown, schema: S, errorMessage: string): TypeOf<S> {
    const result = schema.safeParse(value);
    if(!result.success) throw new Error(errorMessage);
    return value;
}