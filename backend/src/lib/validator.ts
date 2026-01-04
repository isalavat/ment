import z, { ZodType } from "zod";

export const validateInputAndMap = async <SchemaType extends ZodType>(obj: unknown, schema: SchemaType) => {
    const { data, success, error } = await schema.safeParseAsync(obj);
    if (!success) {
        throw error;
    }
    return data;
}
