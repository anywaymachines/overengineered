import { RunService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import ColorWheel, { ColorWheelDefinition } from "client/gui/ColorWheel";
import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import { ConfigControl2 } from "client/gui/buildmode/ConfigControl";
import MultiConfigControl from "client/gui/config/MultiConfigControl";
import BlockConfig from "shared/block/config/BlockConfig";
import { BlockConfigDefinitions } from "shared/block/config/BlockConfigDefinitionRegistry";

const launch = false && RunService.IsStudio();
if (!launch) new Signal<() => void>().Wait();

task.wait(0.5); // wait for the controls to enable

const frame = new Instance("Frame");
frame.Transparency = 1;
frame.Position = new UDim2(0, 0, 0, 0);
frame.Size = new UDim2(1, 0, 1, 0);
frame.Parent = Gui.getGameUI();

const parent = new Control(frame);

//

parent.add(new ColorWheel(Gui.getGameUI<{ Templates: { Color: ColorWheelDefinition } }>().Templates.Color.Clone()));

{
	const multidef: BlockConfigDefinitions = {
		a: {
			displayName: "TRU",
			type: "bool",
			config: false,
			default: false,
		},
		b: {
			displayName: "FALS",
			type: "bool",
			config: false,
			default: false,
		},
		c: {
			displayName: "MIXED",
			type: "bool",
			config: false,
			default: false,
		},
		av: {
			displayName: "VECTOR 1",
			type: "vector3",
			config: Vector3.zero,
			default: Vector3.zero,
		},
		bv: {
			displayName: "VECTOR 0",
			type: "vector3",
			config: Vector3.zero,
			default: Vector3.zero,
		},
		cv: {
			displayName: "VECTOR MIXED",
			type: "vector3",
			config: Vector3.zero,
			default: Vector3.zero,
		},
	};

	const frame = new Instance("ScrollingFrame");
	frame.Position = new UDim2(0.3, 0, 0.033, 0);
	frame.Size = new UDim2(0, 324, 0, 1107);
	frame.BackgroundColor3 = Color3.fromRGB(18, 18, 31);
	frame.Transparency = 0.2;
	new Instance("UIListLayout").Parent = frame;

	const list = parent.add(new Control(frame));

	const mcc = new MultiConfigControl(
		frame,
		{
			["1" as BlockUuid]: {
				a: true,
				b: false,
				c: true,
				av: Vector3.one,
				bv: Vector3.zero,
				cv: new Vector3(1, 2, 3),
			},
			["2" as BlockUuid]: {
				a: true,
				b: false,
				c: false,
				av: Vector3.one,
				bv: Vector3.zero,
				cv: new Vector3(1, 4, 3),
			},
		},
		multidef,
	);
	list.add(mcc);
}

{
	const def: BlockConfigDefinitions = {
		vector: {
			displayName: "Vector3",
			type: "vector3",
			default: Vector3.zero,
			config: Vector3.zero,
		},
		number: {
			displayName: "Number",
			type: "number",
			default: 0,
			config: 0,
		},
		string: {
			displayName: "String",
			type: "string",
			default: "AMON",
			config: "AMON",
		},
		clampedNumber: {
			displayName: "ClampedNumber",
			type: "clampedNumber",
			config: 0.5,
			default: 0.5,
			min: 0,
			max: 1,
			step: 0.01,
		},
		key: {
			displayName: "Key",
			type: "key",
			config: "A",
			default: "A",
		},
		keybool: {
			displayName: "Keybool",
			type: "keybool",
			default: false,
			config: {
				key: "B",
				reversed: false,
				switch: true,
				touchName: "B",
			},
			canBeReversed: true,
			canBeSwitch: true,
		},
		rotationSpeed: {
			displayName: "Speed",
			type: "motorRotationSpeed",
			default: 0,
			config: {
				rotation: {
					add: "W",
					sub: "S",
				},
				speed: 0,
				switchmode: true,
			},
			maxSpeed: 100,
		},
		servoAngle: {
			displayName: "Angle",
			type: "servoMotorAngle",
			default: 0,
			config: {
				angle: 0,
				rotation: { add: "W", sub: "S" },
				switchmode: false,
			},
		},
		thrust: {
			displayName: "Thrust",
			type: "thrust",
			default: 0,
			config: {
				thrust: {
					add: "W",
					sub: "S",
				},
				switchmode: false,
			},
			canBeSwitch: true,
		},
	};

	const frame = new Instance("ScrollingFrame");
	frame.Position = new UDim2(0.6, 0, 0.033, 0);
	frame.Size = new UDim2(0, 324, 0, 1107);
	frame.BackgroundColor3 = Color3.fromRGB(18, 18, 31);
	frame.Transparency = 0.2;
	new Instance("UIListLayout").Parent = frame;

	const list = parent.add(new Control(frame));

	const mcc = new ConfigControl2(frame, BlockConfig.addDefaults({}, def), def);
	list.add(mcc);
}

parent.show();
