# JSON (de)serialization

`HttpService.JSONEncode` and `HttpService.JSONDecode` only support primitive types (or tables of primitive types):
- `boolean`
- `number`
- `string`
- `object`
- `array`

Types like `Vector3`, `UDim` are not supported. To mitigate that, `Json.ts` was created.


# Usage

```ts
const json: string = JSON.serialize(new Vector3(1, 2, 3));
const vector: Vector3 = JSON.deserialize<Vector3>(json);
```

Serializing `Vector3` JSON would result in:
```json
{ "x": 2, "y": 1, "z": 3, "__v": 0, "__type": "vector3" }
```


# Supported types

- `CFrame`
- `Color3`
- `Vector2`
- `Vector3`
- `UDim`
- `UDim2`

The list might me incomplete, look for `serializers` object in `Json.ts` for the up-to-date list.


# How and why

`HttpService.Json**code` does not deserialize non-primitive types because there is simply not enough information:

Is
```ts
{ x: 1, y: 2, z: 3 }
```
a Vector3 or just an object?

So `Json.ts` stores the type in `__type` field when needed.

That also means that a JSON, serialized with `HttpSerive.JsonEncode` might not be deserialized with `Json.ts` as expected, so be careful.

---

`Json.ts` also stores the serializer version in `__v` field, which is ignored when deserializing.
The version has no usage yet, and may be removed later.
