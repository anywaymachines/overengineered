export default class Serializer {
	static CFrameSerializer = {
		serialize(cframe: CFrame): SerializedCFrame {
			return [cframe.Position.X, cframe.Position.Y, cframe.Position.Z, cframe.ToEulerAnglesXYZ()];
		},

		deserialize(serializedCFrame: SerializedCFrame): CFrame {
			return new CFrame(serializedCFrame[0], serializedCFrame[1], serializedCFrame[2]).mul(
				CFrame.fromEulerAnglesXYZ(serializedCFrame[3][0], serializedCFrame[3][1], serializedCFrame[3][2]),
			);
		},
	};

	static EnumMaterialSerializer = {
		serialize(material: Enum.Material): SerializedEnum {
			return material.Value;
		},

		deserialize(serializedEnumMaterial: SerializedEnum): Enum.Material {
			return Enum.Material.GetEnumItems().find((value) => value.Value === serializedEnumMaterial)!;
		},
	};

	static Color3Serializer = {
		serialize(color: Color3): SerializedColor {
			return color.ToHex();
		},

		deserialize(serializedColor: SerializedColor | readonly [number, number, number]): Color3 {
			if (!typeIs(serializedColor, "string"))
				return Color3.fromRGB(serializedColor[0], serializedColor[1], serializedColor[2]);

			return Color3.fromHex(serializedColor);
		},
	};

	static VectorSerializer = {
		serialize(vec: Vector3): SerializedVector {
			return [vec.X, vec.Y, vec.Z];
		},

		deserialize(serializedVec: SerializedVector): Vector3 {
			return new Vector3(serializedVec[0], serializedVec[1], serializedVec[2]);
		},
	};
}
