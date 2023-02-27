# JSON Schema Referencer

<center>
  <span>
    <img alt="CircleCI branch" src="https://img.shields.io/circleci/project/github/json-schema-tools/referencer/master.svg">
    <img alt="npm" src="https://img.shields.io/npm/dt/@json-schema-tools/referencer.svg" />
    <img alt="GitHub release" src="https://img.shields.io/github/release/json-schema-tools/referencer.svg" />
    <img alt="GitHub commits since latest release" src="https://img.shields.io/github/commits-since/json-schema-tools/referencer/latest.svg" />
  </span>
</center>

Referencer is a package that exports a single function - a function that accepts and returns a JSON Schema. The returned schema is 'flat', as in, any subschemas of the schema have been converted into $refs. Further, any of the subschemas' subschema are also $reffed, recurively until everything is a $ref, and the definition section is fully populated.

The input schema may have refs, but the refs must already be in the definitions section.
The input schema, as well as all of its subschemas must have titles. Their titles must also be unique for their content. We would like to use $id, but it has special meaning and therefor title is used as the unique identifier on-which schemas will be referenced.

Features:
 - Cyclic schemas become cyclic references
 - Completely synchronous
 - immutable by default, option to mutate in place.
 - No external dependencies
 - Fully typed against the generated [meta-schema typings](https://github.com/json-schema-tools/meta-schema/)
 - magically makes your json schema smaller.

## Usage

install it:
`npm install @json-schema-tools/referencer`

use it:
```typescript
import referencer from "@json-schema-tools/referencer";

const result = referencer({
  title: "example",
  type: "object",
  properties: {
    foo: { title: "foo", type: "number" },
    bar: { title: "bar", type: "string" }
  }
});

console.log(result);

// outputs
{
  title: "example",
  type: "object",
  properties: {
    foo: {$ref: "#/definitions/foo" },
    bar: { $ref: "#/definitions/bar" }
  },
  definitions: {
    foo: { title: "foo", type: "number" }
    bar: { title: "bar", type: "string" }
  }
}
```

## License

Apache-2.0


### Contributing

How to contribute, build and release are outlined in [CONTRIBUTING.md](CONTRIBUTING.md), [BUILDING.md](BUILDING.md) and [RELEASING.md](RELEASING.md) respectively. Commits in this repository follow the [CONVENTIONAL_COMMITS.md](CONVENTIONAL_COMMITS.md) specification.
