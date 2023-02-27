import referencer, { NoTitleError } from "./";
import { JSONSchema, Properties, Definitions, JSONSchemaObject } from "@json-schema-tools/meta-schema";

describe("referencer", () => {
  it("does not change anything if are no sub schemas", () => {
    const testSchema = { title: "foo" };
    const result = referencer(testSchema);
    expect(result).toEqual({ title: "foo" });
  });

  it("errors if any subschema is missing a title", () => {
    const testSchema = { title: "foo", properties: { bar: { type: "string" } } };
    expect(() => referencer(testSchema)).toThrow(NoTitleError);
  });

  it("it works for simple cases", () => {
    const testSchema = {
      title: "foo",
      properties: {
        bar: {
          title: "bar",
          type: "string",
        },
        baz: {
          title: "baz",
          type: "array",
          items: [
            {
              title: "whatsAfterBazAgain",
              type: "string",
            },
          ],
        },
      },
    };
    const reffed = referencer(testSchema) as JSONSchemaObject;

    const props = reffed.properties as Properties;
    const defs = reffed.definitions as Definitions;

    expect(props.bar.$ref).toBe("#/definitions/bar");
    expect(defs.bar.title).toBe("bar");
    expect(props.baz.$ref).toBe("#/definitions/baz");
    expect(defs.baz.title).toBe("baz");
    const bazItems = defs.baz.items as JSONSchema[];
    expect(bazItems).toHaveLength(1);
    expect((bazItems[0] as JSONSchemaObject).$ref).toBe("#/definitions/whatsAfterBazAgain");
    expect(defs.whatsAfterBazAgain.title).toBe("whatsAfterBazAgain");
  });

  it("nested composition", () => {
    const testSchema = {
      title: "anyOfTheThings",
      anyOf: [
        {
          title: "allOfFoo",
          allOf: [{ title: "foo", type: "object", properties: { cba: true } }],
        },
        {
          title: "bar",
          oneOf: [
            { title: "baz", type: "number" },
            { title: "abc", type: "string" },
          ],
        },
      ],
    } as JSONSchema;
    const reffed = referencer(testSchema) as JSONSchemaObject;

    const defs = reffed.definitions as Definitions;

    expect(defs.allOfFoo.title).toBe("allOfFoo");
    expect(defs.foo.title).toBe("foo");
    expect(defs.bar.title).toBe("bar");
    expect(defs.baz.title).toBe("baz");
    expect(defs.abc.title).toBe("abc");

    expect(reffed.anyOf).toHaveLength(2);
    const anyOfs = reffed.anyOf as JSONSchemaObject[];
    expect(anyOfs[0].$ref).toBe("#/definitions/allOfFoo");
    expect(anyOfs[1].$ref).toBe("#/definitions/bar");

    expect(defs.bar.oneOf).toHaveLength(2);
    expect(defs.bar.oneOf[0].$ref).toBe("#/definitions/baz");
    expect(defs.bar.oneOf[1].$ref).toBe("#/definitions/abc");
  });

  it("handles cycles", () => {
    const testSchema = {
      title: "foo",
      type: "object",
      properties: { anotherFoo: {} },
    };

    testSchema.properties.anotherFoo = testSchema;

    const reffed = referencer(testSchema as JSONSchema) as JSONSchemaObject;

    const props = reffed.properties as Properties;
    const defs = reffed.definitions as Definitions;

    expect(defs.foo.$ref).toBe("#");
    expect(props.anotherFoo.$ref).toBe("#/definitions/foo");
  });

  it("already has some refs with dupes", () => {
    const testSchema = {
      title: "anyOfTheThings",
      anyOf: [
        {
          title: "allOfFoo",
          allOf: [
            {
              title: "foo",
              type: "object",
              properties: { abc: { title: "abc", type: "string" } },
            },
            { title: "baz", type: "object", properties: { cba: { $ref: "#/definitions/cba" } } },
          ],
        },
        {
          title: "bar",
          oneOf: [
            { title: "baz", type: "object", properties: { cba: { $ref: "#/definitions/cba" } } },
            { title: "abc", type: "string" },
          ],
        },
      ],
      definitions: {
        cba: {
          title: "cba",
          type: "string",
        },
      },
    };
    const reffed = referencer(testSchema as JSONSchema) as JSONSchemaObject;

    const defs = reffed.definitions as Definitions;

    expect(defs.cba.title).toBe("cba");
    expect(defs.allOfFoo.title).toBe("allOfFoo");
    expect(defs.foo.title).toBe("foo");
    expect(defs.baz.title).toBe("baz");
    expect(defs.bar.title).toBe("bar");
    expect(defs.abc.title).toBe("abc");

    expect(defs.allOfFoo.allOf[0].$ref).toBe("#/definitions/foo");
    expect(defs.allOfFoo.allOf[1].$ref).toBe("#/definitions/baz");
    expect(defs.baz.properties.cba.$ref).toBe("#/definitions/cba");
  });

  describe("Mutable", () => {
    it("does not mutate the input schema", () => {
      const testSchema = Object.freeze({
        title: "foo",
        type: "object",
        properties: { bar: { title: "bar", type: "number" } },
      });

      const reffed = referencer(testSchema as JSONSchema) as JSONSchemaObject;

      const props = reffed.properties as Properties;

      expect(props.bar.$ref).toBe("#/definitions/bar");
      expect(reffed).not.toBe(testSchema);
    });

    it("does mutate the input schema when options.mutate === true", () => {
      const testSchema = {
        title: "foo",
        type: "object",
        properties: { bar: { title: "bar", type: "number" } },
      };

      const reffed = referencer(testSchema as JSONSchema, { mutate: true }) as JSONSchemaObject;

      const props = reffed.properties as Properties;

      expect(props.bar.$ref).toBe("#/definitions/bar");
      expect(reffed).toBe(testSchema);
    });

  });
});
