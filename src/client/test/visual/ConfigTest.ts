import { Colors } from "client/gui/Colors";
import { Control } from "client/gui/Control";
import { MultiConfigControl } from "client/gui/config/MultiConfigControl";
import { Element } from "shared/Element";
import { Objects } from "shared/fixes/objects";
import { ControlTest } from "./ControlTest";

export const ConfigTest: ControlTest = {
	createTests() {
		const frame = Element.create(
			"Frame",
			{
				Position: new UDim2(0.3, 0, 0.033, 0),
				Size: new UDim2(0, 324, 0, 1107),
				BackgroundColor3: Colors.staticBackground,
				Transparency: 1,
			},
			{
				list: Element.create("UIListLayout", {
					FillDirection: Enum.FillDirection.Horizontal,
				}),
			},
		);
		const control = new Control(frame);

		// multiconfig
		{
			const tests = {
				bool: {
					boolTrue: {
						displayName: "boolean TRUE",
						type: "bool",
						config: false,
						default: false,
					},
					boolFalse: {
						displayName: "boolean FALSE",
						type: "bool",
						config: false,
						default: false,
					},
					boolMixed: {
						displayName: "boolean MIXED",
						type: "bool",
						config: false,
						default: false,
					},
				},
				vector3: {
					vecOne: {
						displayName: "VECTOR 1",
						type: "vector3",
						config: Vector3.zero,
						default: Vector3.zero,
					},
					vecZero: {
						displayName: "VECTOR 0",
						type: "vector3",
						config: Vector3.zero,
						default: Vector3.zero,
					},
					vecMixed: {
						displayName: "VECTOR MIXED",
						type: "vector3",
						config: Vector3.zero,
						default: Vector3.zero,
					},
				},
				string: {
					str: {
						displayName: "STRING",
						type: "string",
						config: "",
						default: "",
					},
					strMixed: {
						displayName: "STRING MIKSED",
						type: "string",
						config: "",
						default: "",
					},
				},
				number: {
					num: {
						displayName: "NUMBER",
						type: "number",
						config: 1,
						default: 1,
					},
					numMixed: {
						displayName: "NUMBER mixed",
						type: "number",
						config: 1,
						default: 1,
					},
				},
				clampedNumber: {
					clnum: {
						displayName: "SLDIER",
						type: "clampedNumber",
						config: 1,
						default: 1,
						min: 0,
						max: 10,
						step: 1,
					},
					clnumMixed: {
						displayName: "SLDIER MIXED",
						type: "clampedNumber",
						config: 1,
						default: 1,
						min: 0,
						max: 10,
						step: 1,
					},
				},
				key: {
					key: {
						displayName: "Key",
						type: "key",
						config: "E",
						default: "E",
					},
					keyMixed: {
						displayName: "Key MIKER",
						type: "key",
						config: "E",
						default: "E",
					},
				},
				keybool: {
					kb: {
						displayName: "Key BOOLEAN",
						type: "keybool",
						config: {
							key: "A",
							touchName: "AMONGUS",
							reversed: false,
							switch: false,
						},
						default: false,
						canBeSwitch: true,
						canBeReversed: true,
					},
					kbMixed: {
						displayName: "Key BOOLEAN MIXED",
						type: "keybool",
						config: {
							key: "A",
							touchName: "AMONGUS",
							reversed: false,
							switch: false,
						},
						default: false,
						canBeSwitch: true,
						canBeReversed: true,
					},
				},
				thrust: {
					thr: {
						displayName: "Thrust",
						type: "thrust",
						config: {
							thrust: {
								add: "R",
								sub: "F",
							},
							switchmode: false,
						},
						default: 0,
						canBeSwitch: true,
					},
					thrMixed: {
						displayName: "Thrust MIXED",
						type: "thrust",
						config: {
							thrust: {
								add: "R",
								sub: "F",
							},
							switchmode: false,
						},
						default: 0,
						canBeSwitch: true,
					},
				},
				color: {
					color: {
						displayName: "Color",
						type: "color",
						config: Color3.fromRGB(255, 0, 0),
						default: Color3.fromRGB(255, 0, 0),
					},
					colorMixed: {
						displayName: " ColorA EE MIXED",
						type: "color",
						config: Color3.fromRGB(255, 0, 0),
						default: Color3.fromRGB(255, 0, 0),
					},
				},
				multikey: {
					mkey: {
						displayName: "MULTI KEY",
						type: "multikey",
						config: { add: "E", sub: "R" },
						default: { add: "E", sub: "R" },
						keyDefinitions: {
							add: {
								displayName: "KEY ONE ADD",
								type: "key",
								config: "E",
								default: "E",
							},
							sub: {
								displayName: "KEY TWO SUB",
								type: "key",
								config: "R",
								default: "R",
							},
						},
					},
					mkeyMixed: {
						displayName: "MULTI KEY miXED",
						type: "multikey",
						config: { add: "E", sub: "R" },
						default: { add: "E", sub: "R" },
						keyDefinitions: {
							add: {
								displayName: "KEY ONE ADD",
								type: "key",
								config: "E",
								default: "E",
							},
							sub: {
								displayName: "KEY TWO SUB",
								type: "key",
								config: "R",
								default: "R",
							},
						},
					},
				},
				motorRotationSpeed: {
					motorRotationSpeed: {
						displayName: "MotorRotation",
						type: "motorRotationSpeed",
						config: {
							rotation: { add: "R", sub: "F" },
							speed: 11,
							switchmode: true,
						},
						default: 0,
						maxSpeed: 100,
					},
					motorRotationSpeedMixed: {
						displayName: "MotorRotation SPEED MIXED",
						type: "motorRotationSpeed",
						config: {
							rotation: { add: "R", sub: "F" },
							speed: 11,
							switchmode: true,
						},
						default: 0,
						maxSpeed: 100,
					},
				},
				servoMotorAngle: {
					servoMotorAngle: {
						displayName: "ServoMotorAngle",
						type: "servoMotorAngle",
						config: {
							rotation: { add: "R", sub: "F" },
							angle: 0,
							switchmode: false,
						},
						default: 0,
					},
					servoMotorAngleMixed: {
						displayName: "ServoMotorAngle mixED",
						type: "servoMotorAngle",
						config: {
							rotation: { add: "R", sub: "F" },
							angle: 0,
							switchmode: false,
						},
						default: 0,
					},
				},
				controllableNumber: {
					cn: {
						displayName: "controllableNumber",
						type: "controllableNumber",
						config: {
							value: 1,
							control: { add: "R", sub: "F" },
						},
						default: 0,
						min: 0,
						max: 10,
						step: 1,
					},
					cnMixed: {
						displayName: "controllableNumber mixed",
						type: "controllableNumber",
						config: {
							value: 1,
							control: { add: "R", sub: "F" },
						},
						default: 0,
						min: 0,
						max: 10,
						step: 1,
					},
				},
				or: {
					or: {
						displayName: "OR",
						type: "or",
						config: { type: "unset", value: 0.5 },
						default: 0,
						types: {
							bool: {
								displayName: "Boolean",
								type: "bool",
								config: false as boolean,
								default: false as boolean,
							},
							number: {
								displayName: "Number",
								type: "number",
								default: 0 as number,
								config: 0 as number,
							},
							vector3: {
								displayName: "Vector3",
								type: "vector3",
								default: Vector3.zero as Vector3,
								config: Vector3.zero as Vector3,
							},
						},
					},
					orMixedValue: {
						displayName: "OR MIXED Value",
						type: "or",
						config: { type: "unset", value: 0.5 },
						default: 0,
						types: {
							bool: {
								displayName: "Boolean",
								type: "bool",
								config: false as boolean,
								default: false as boolean,
							},
							number: {
								displayName: "Number",
								type: "number",
								default: 0 as number,
								config: 0 as number,
							},
							vector3: {
								displayName: "Vector3",
								type: "vector3",
								default: Vector3.zero as Vector3,
								config: Vector3.zero as Vector3,
							},
						},
					},
					orMixedType: {
						displayName: "OR MIXED TYPE",
						type: "or",
						config: { type: "unset", value: 0.5 },
						default: 0,
						types: {
							bool: {
								displayName: "Boolean",
								type: "bool",
								config: false as boolean,
								default: false as boolean,
							},
							number: {
								displayName: "Number",
								type: "number",
								default: 0 as number,
								config: 0 as number,
							},
							vector3: {
								displayName: "Vector3",
								type: "vector3",
								default: Vector3.zero as Vector3,
								config: Vector3.zero as Vector3,
							},
						},
					},
				},
			} satisfies Readonly<Record<keyof BlockConfigTypes.Types, BlockConfigTypes.Definitions>>;

			const multidef = Objects.fromEntries(
				Objects.values(tests).flatmap((k) => Objects.entriesArray(k)),
			) as Record<
				{ [k in keyof typeof tests]: keyof (typeof tests)[k] }[keyof typeof tests],
				BlockConfigTypes.Definitions[string]
			>;

			const frame = Element.create(
				"ScrollingFrame",
				{
					Position: new UDim2(0.3, 0, 0.033, 0),
					Size: new UDim2(0, 324, 0, 1107),
					BackgroundColor3: Colors.staticBackground,
					Transparency: 0.2,
					AutomaticCanvasSize: Enum.AutomaticSize.Y,
				},
				{ list: Element.create("UIListLayout") },
			);

			const list = control.add(new Control(frame));

			const configs: Record<BlockUuid, ConfigDefinitionsToConfig<keyof typeof multidef, typeof multidef>> = {
				["1" as BlockUuid]: {
					boolTrue: true,
					boolFalse: false,
					boolMixed: true,
					vecOne: Vector3.one,
					vecZero: Vector3.zero,
					vecMixed: new Vector3(1, 2, 3),
					str: "asd",
					strMixed: "asd1",
					num: 1,
					numMixed: 1,
					clnum: 1,
					clnumMixed: 1,
					key: "E",
					keyMixed: "E",
					kb: { key: "E" },
					kbMixed: { key: "E" },
					thr: { thrust: { add: "R", sub: "F" }, switchmode: false },
					thrMixed: { thrust: { add: "R", sub: "F" }, switchmode: false },
					color: Color3.fromRGB(255, 0, 0),
					colorMixed: Color3.fromRGB(255, 0, 0),
					mkey: { add: "R", sub: "F" },
					mkeyMixed: { add: "R", sub: "F" },
					motorRotationSpeed: { rotation: { add: "R", sub: "F" }, speed: 1, switchmode: true },
					motorRotationSpeedMixed: { rotation: { add: "R", sub: "F" }, speed: 1, switchmode: true },
					servoMotorAngle: { rotation: { add: "R", sub: "F" }, angle: 0, switchmode: true },
					servoMotorAngleMixed: { rotation: { add: "R", sub: "F" }, angle: 0, switchmode: true },
					cn: { control: { add: "R", sub: "F" }, value: 0 },
					cnMixed: { control: { add: "R", sub: "F" }, value: 0 },
					or: { type: "bool", value: false },
					orMixedValue: { type: "bool", value: false },
					orMixedType: { type: "bool", value: false },
				},
				["2" as BlockUuid]: {
					boolTrue: true,
					boolFalse: false,
					boolMixed: false,
					vecOne: Vector3.one,
					vecZero: Vector3.zero,
					vecMixed: new Vector3(1, 4, 3),
					str: "dsa",
					strMixed: "asd2",
					num: 1,
					numMixed: 2,
					clnum: 1,
					clnumMixed: 2,
					key: "E",
					keyMixed: "W",
					kb: { key: "E" },
					kbMixed: { key: "W" },
					thr: { thrust: { add: "R", sub: "F" }, switchmode: false },
					thrMixed: { thrust: { add: "A", sub: "E" }, switchmode: true },
					color: Color3.fromRGB(255, 0, 0),
					colorMixed: Color3.fromRGB(255, 255, 0),
					mkey: { add: "R", sub: "F" },
					mkeyMixed: { add: "A", sub: "E" },
					motorRotationSpeed: { rotation: { add: "R", sub: "F" }, speed: 1, switchmode: true },
					motorRotationSpeedMixed: { rotation: { add: "A", sub: "E" }, speed: 2, switchmode: false },
					servoMotorAngle: { rotation: { add: "R", sub: "F" }, angle: 0, switchmode: true },
					servoMotorAngleMixed: { rotation: { add: "A", sub: "E" }, angle: 1, switchmode: false },
					cn: { control: { add: "R", sub: "F" }, value: 0 },
					cnMixed: { control: { add: "A", sub: "E" }, value: 1 },
					or: { type: "bool", value: false },
					orMixedValue: { type: "bool", value: true },
					orMixedType: { type: "number", value: 0 },
				},
			} satisfies Record<BlockUuid, ConfigDefinitionsToConfig<string, BlockConfigTypes.Definitions>>;

			const mcc = new MultiConfigControl(frame, configs, multidef);
			list.add(mcc);
		}

		return [["Configuration", control]];
	},
};
