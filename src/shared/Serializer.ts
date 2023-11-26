export type SerializedCFrame = [number, number, number, [number, number, number]];
export type SerializedColor = [number, number, number];
export type SerializedEnum = number;

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

	static EnumKeyCodeSerializer = {
		serialize(material: Enum.KeyCode): SerializedEnum {
			return material.Value;
		},

		deserialize(serializedEnumKeyCode: SerializedEnum): Enum.KeyCode {
			return Enum.KeyCode.GetEnumItems().find((value) => value.Value === serializedEnumKeyCode)!;
		},
	};

	static Color3Serializer = {
		serialize(color: Color3): SerializedColor {
			return [math.round(color.R * 255), math.round(color.G * 255), math.round(color.B * 255)];
		},

		deserialize(serializedColor: SerializedColor): Color3 {
			return Color3.fromRGB(serializedColor[0], serializedColor[1], serializedColor[2]);
		},
	};
}
