export default class Serializer {
	static readonly CFrameSerializer = {
		serialize(cframe: CFrame): SerializedCFrame {
			return [cframe.Position.X, cframe.Position.Y, cframe.Position.Z, cframe.ToEulerAnglesXYZ()];
		},

		deserialize(serializedCFrame: SerializedCFrame): CFrame {
			return new CFrame(serializedCFrame[0], serializedCFrame[1], serializedCFrame[2]).mul(
				CFrame.fromEulerAnglesXYZ(serializedCFrame[3][0], serializedCFrame[3][1], serializedCFrame[3][2]),
			);
		},
	};

	static readonly EnumMaterialSerializer = {
		serialize(material: Enum.Material): SerializedEnum {
			return material.Value;
		},

		deserialize(serializedEnumMaterial: SerializedEnum): Enum.Material {
			return Enum.Material.GetEnumItems().find((value) => value.Value === serializedEnumMaterial)!;
		},
	};

	static readonly Color3Serializer = {
		serialize(color: Color3): SerializedColor {
			return color.ToHex();
		},

		deserialize(serializedColor: SerializedColor | readonly [number, number, number]): Color3 {
			if (!typeIs(serializedColor, "string"))
				return Color3.fromRGB(serializedColor[0], serializedColor[1], serializedColor[2]);

			return Color3.fromHex(serializedColor);
		},
	};

	static readonly UDim = {
		serialize(unserialized: UDim): SerializedUDim {
			return [unserialized.Scale, unserialized.Offset];
		},

		deserialize(serialized: SerializedUDim): UDim {
			return new UDim(serialized[0], serialized[1]);
		},
	};

	static readonly UDim2 = {
		serialize(unserialized: UDim2): SerializedUDim2 {
			return [Serializer.UDim.serialize(unserialized.X), Serializer.UDim.serialize(unserialized.Y)];
		},

		deserialize(serialized: SerializedUDim2): UDim2 {
			return new UDim2(Serializer.UDim.deserialize(serialized[0]), Serializer.UDim.deserialize(serialized[1]));
		},
	};

	static readonly Vector2 = {
		serialize(unserialized: Vector2): SerializedVector2 {
			return [unserialized.X, unserialized.Y];
		},

		deserialize(serialized: SerializedVector2): Vector2 {
			return new Vector2(serialized[0], serialized[1]);
		},
	};
}
