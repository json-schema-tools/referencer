import referencer from "./";
import { JSONSchemaObject } from "@json-schema-tools/meta-schema";
import { replaceTypeAsArrayWithOneOf } from "@json-schema-tools/transpiler/build/utils";

import titleizer from "@json-schema-tools/titleizer";
import Dereferencer from "@json-schema-tools/dereferencer";

describe("referencer", () => {
  it("works on openrpc metaschema", async () => {
    const s = await new Dereferencer({ $ref: 'https://meta.open-rpc.org' }).resolve();
    const schemaWithTitles = titleizer(s);
    const reffed = referencer(schemaWithTitles) as JSONSchemaObject;
    expect(Object.keys((reffed as any).definitions)).not.toContain("undefined")
  });

  it("works on own metaschema", async () => {
    const s = await new Dereferencer({ $ref: 'https://meta.json-schema.tools' }).resolve();
    const noTypeArrays = replaceTypeAsArrayWithOneOf(s);
    const schemaWithTitles = titleizer(noTypeArrays);
    const reffed = referencer(schemaWithTitles) as JSONSchemaObject;
    expect(Object.keys((reffed as any).definitions)).not.toContain("undefined")
  });
});
