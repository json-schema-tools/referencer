import traverse from "@json-schema-tools/traverse";
import { JSONSchema, JSONSchemaObject } from "@json-schema-tools/meta-schema";

const deleteAllProps = (o: { [k: string]: unknown }) => {
  Object.keys(o)
    .forEach((k) => { if (k !== 'title') delete o[k]; });
};

const isObject = (obj?: JSONSchema) => {
  return obj && obj === Object(obj)
};

const isComplex = (obj: JSONSchemaObject) =>  {
  // TODO: evaluate if `array` should be considered complex
  return (obj.type === 'object' && typeof obj.properties === 'object');
};

const hasReference = (obj: JSONSchemaObject) => {
  return typeof obj.$ref === 'string' && obj.$ref.length > 0 && obj.$ref.indexOf("#") !== -1;
};

export const stringifyCircular = (obj: unknown) => {
  const cache: unknown[] = [];
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (cache.indexOf(value) !== -1) {
        return `[Circular: ${value.title ? value.title : "NoTitle"}]`;
      }
      cache.push(value);
    }
    return value;
  }, "\t");
};

export class NoTitleError implements Error {
  public name = "NoTitleError";
  public message: string;

  constructor(schema: JSONSchema, parentSchema: JSONSchema) {
    let schemaStr;
    let parentSchemaStr;

    try {
      schemaStr = JSON.stringify(schema);
    } catch {
      schemaStr = stringifyCircular(schema);
    }

    try {
      parentSchemaStr = JSON.stringify(parentSchema);
    } catch {
      parentSchemaStr = stringifyCircular(parentSchema);
    }

    this.message = [
      "Title is required on subschemas.",
      "Without title, identical schemas would return differing names.",
      "",
      "Subschema in question:",
      schemaStr,
      "",
      "Parent Schema:",
      parentSchemaStr,
    ].join("\n");
  }
}

/**
 * Options that can be passed into the Referencer.
 */
export interface ReferencerOptions {
  /**
   * If true, the schema passed in will be referenced in-place, mutating the original. Default is false.
   */
  mutate?: boolean;
  /**
   * By setting this to `true`, only complex types (`object`) will be replaced.
   * @default false
   */
  onlyComplex?: boolean;
}

const defaultReferencerOptions = {
  mutate: false,
};

/**
 * Returns the schema where all subschemas have been replaced with $refs and added to definitions.
 *
 * All of the subschemas must have a title. If you are unsure if you have titles for all
 * schemas, use the json-schema-tools/titleizer first. If a subschema is already a $ref, it must
 * exists in the input schema's definitions object.
 *
 * @param s The schema to create references for (ie 'flatten' it)
 * @param options The custom options
 *
 * @returns input schema where subschemas are turned into refs (recursively)
 *
 * @category Utils
 * @category SchemaImprover
 *
 */
export default function referencer(s: JSONSchema, options: ReferencerOptions = defaultReferencerOptions): JSONSchema {
  const {
    onlyComplex = false,
  } = options;
  const definitions: Record<string, JSONSchema> = {};
  
  let newS = traverse(
    s,
    (subSchema: JSONSchema, isRootCycle: boolean) => {
      let t = "";
      if (!isObject(subSchema)) { // For schema that is boolean
        if (onlyComplex) {
          return subSchema;
        }
        if (subSchema === true) {
          t = "AlwaysTrue";
          definitions[t as string] = true;
        } else if (subSchema === false) {
          t = "AlwaysFalse";
          definitions[t as string] = false;
        }
        return subSchema;
      }

      // Otherwise it is a object schema
      const objectSchema = subSchema as JSONSchemaObject;
      if (isRootCycle) {
        if (objectSchema.$ref) {
          const title = objectSchema.$ref.replace("#/definitions/", "");
          const hasDefForRef = definitions[title];

          if (hasDefForRef === undefined) {
            throw new Error(`Encountered unknown $ref: ${objectSchema.$ref}`);
          }

          return objectSchema;
        }

        if (objectSchema === s) {
          definitions[s.title as string] = { $ref: `#` };
          return { $ref: `#/definitions/${s.title}` };
        }

        definitions[objectSchema.title as string] = { ...objectSchema };
        objectSchema.$ref = `#/definitions/${objectSchema.title}`;
        return objectSchema;
      }

      if (!hasReference(objectSchema) && (!onlyComplex || isComplex(objectSchema))) {
        if (typeof objectSchema.title !== "string") {
          throw new NoTitleError(objectSchema, s);
        }
        t = objectSchema.title as string;
        definitions[t as string] = { ...objectSchema };
        deleteAllProps(objectSchema);
        objectSchema.$ref = `#/definitions/${t}`;
      }

      return objectSchema;
    },
    { mutable: options.mutate, skipFirstMutation: true },
  );

  if (options.mutate === true) {
    newS = s;
  }

  if (typeof newS === "object" && Object.keys(definitions).length > 0) {
    newS.definitions = { ...newS.definitions, ...definitions };
  }

  return newS;
}
