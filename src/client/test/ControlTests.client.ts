import { Players, RunService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import JSON from "shared/fixes/Json";
import Gui from "../gui/Gui";
import MultiConfigControl from "../gui/config/MultiConfigControl";

const me = Players.LocalPlayer.Name === "i3ymm";
const launch = false && RunService.IsStudio() && me;
if (!launch) new Signal<() => void>().Wait();

task.wait(0.5); // wait for the controls to enable

const frame = new Instance("Frame");
frame.Position = new UDim2(0.3, 0, 0.033, 0);
frame.Size = new UDim2(0, 324, 0, 1107);
frame.Parent = Gui.getGameUI();
new Instance("UIListLayout").Parent = frame;

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
	{
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
	},
);
mcc.show();
if (Players.LocalPlayer.Name !== "i3ymm") mcc.hide();
else mcc.enable();

mcc.configUpdated.Connect((key, value) => {
	print(`Config updated:  ${key}: ${JSON.serialize(value)}`);
});
