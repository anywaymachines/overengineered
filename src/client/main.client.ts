import { Players, RunService, StarterGui, UserInputService, Workspace } from "@rbxts/services";
import PlayerDataStorage from "./PlayerDataStorage";
import ComponentContainer from "./base/ComponentContainer";
import BeaconController from "./controller/BeaconController";
import GameEnvironmentController from "./controller/GameEnvironmentController";
import LocalPlayerController from "./controller/LocalPlayerController";
import PlayModeController from "./controller/PlayModeController";
import SoundController from "./controller/SoundController";
import WorldController from "./controller/WorldController";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import DebugControl from "./gui/static/DebugControl";
import LogControl from "./gui/static/LogControl";
import TooltipsControl from "./gui/static/TooltipsControl";

(async () => await PlayerDataStorage.init())();

GameEnvironmentController.initialize();

TooltipsControl.instance.show();
LogControl.instance.show();
WorldController.generate();

LocalPlayerController.initialize();
InputTypeChangeEvent.subscribe();
const _ = BeaconController.instance; // initialize

if (RunService.IsStudio()) {
	DebugControl.instance.show();
}

SoundController.initialize();

const root = new ComponentContainer();
const playModeController = new PlayModeController();
root.add(playModeController);
root.enable();

UserInputService.InputBegan.Connect((input) => {
	if (input.UserInputType !== Enum.UserInputType.Keyboard) {
		return;
	}

	const toggle = () => {
		const mode = playModeController.playmode.get();
		if (!mode) return;

		const scene = playModeController.modes[mode];
		if (scene.isEnabled()) {
			StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.All, false);
			UserInputService.MouseIconEnabled = false;

			scene.disable();
		} else {
			StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.All, true);
			StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);
			UserInputService.MouseIconEnabled = true;

			scene.enable();
		}
	};

	if (input.IsModifierKeyDown("Shift") && UserInputService.IsKeyDown(Enum.KeyCode.G)) {
		toggle();
	}
});

const parts: readonly Part[] = [
	Workspace.FindFirstChild("Baseplate") as Part,
	...Workspace.WaitForChild("Plots")
		.GetChildren()
		.map((p) => p.WaitForChild("BuildingArea") as Part),
];
const tr: (Part | Decal)[] = [];
for (const part of parts.map((p) => p.GetDescendants() as (Part | Decal)[])) {
	for (const p of part) {
		if (p.IsA("Part") || p.IsA("Decal")) {
			tr.push(p);
		}
	}
}

Players.LocalPlayer.CameraMaxZoomDistance = 512;

const transparencies = new Map([...parts, ...tr].map((p) => [p, p.Transparency]));

RunService.Heartbeat.Connect(() => {
	const maxDistance = 1024;

	for (const part of parts) {
		const distance =
			Players.LocalPlayer.Character?.GetPivot().Position.sub(part.GetPivot().Position).Magnitude ?? 0;

		for (const child of [part, ...part.GetDescendants()]) {
			if (child.IsA("Part") || child.IsA("Decal")) {
				child.Transparency = distance > maxDistance ? 1 : transparencies.get(child) ?? 0;
			}
		}
	}
});
