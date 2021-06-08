import traverse from "@json-schema-tools/traverse";
import { JSONSchema } from "@json-schema-tools/meta-schema";

const deleteAllProps = (o: { [k: string]: any }) => {
  Object.keys(o)
    .forEach((k) => { delete o[k]; });
};

export const stringifyCircular = (obj: any) => {
  const cache: any[] = [];
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
    } catch (e) {
      schemaStr = stringifyCircular(schema);
    }

    try {
      parentSchemaStr = JSON.stringify(parentSchema);
    } catch (e) {
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
 * Returns the schema where all subschemas have been replaced with $refs and added to definitions.
 *
 * All of the subschemas must have a title. If you are unsure if you have titles for all
 * schemas, use the json-schema-tools/titleizer first. If a subschema is already a $ref, it must
 * exists in the input schema's definitions object.
 *
 * @param s The schema to create references for (ie 'flatten' it)
 *
 * @returns input schema where subschemas are turned into refs (recursively)
 *
 * @category Utils
 * @category SchemaImprover
 *
 */
export default function referencer(s: JSONSchema): JSONSchema {
  const definitions: any = {};

  traverse(
    s,
    (subSchema: JSONSchema, isRootCycle: boolean) => {
      let t = "";
      if (isRootCycle && subSchema !== true && subSchema !== false) {
        if (subSchema.$ref) {
          const title = subSchema.$ref.replace("#/definitions/", "");
          const hasDefForRef = definitions[title];

          if (hasDefForRef === undefined) {
            throw new Error(`Encountered unknown $ref: ${subSchema.$ref}`);
          }

          return subSchema;
        }

        if (subSchema === s) {
          definitions[s.title as string] = { $ref: `#` };
          return { $ref: `#/definitions/${s.title}` };
        }

        definitions[subSchema.title as string] = { ...subSchema };
        deleteAllProps(subSchema);
        subSchema.$ref = `#/definitions/${subSchema.title}`;
        return subSchema;
      }

      if (subSchema === true) {
        t = "AlwaysTrue";
        definitions[t as string] = true;
      } else if (subSchema === false) {
        t = "AlwaysFalse";
        definitions[t as string] = false;
      } else if (subSchema.$ref !== undefined && subSchema.$ref.indexOf("#") !== -1) {
        return subSchema;
      } else {
        if (typeof subSchema.title !== "string") {
          throw new NoTitleError(subSchema, s);
        }
        t = subSchema.title as string;
        definitions[t as string] = { ...subSchema };
        deleteAllProps(subSchema);
        subSchema.$ref = `#/definitions/${t}`;
      }

      return subSchema;
    },
    { mutable: true, skipFirstMutation: true },
  );

  if (typeof s === "object" && Object.keys(definitions).length > 0) {
    s.definitions = { ...s.definitions, ...definitions };
  }

  return s;
};
