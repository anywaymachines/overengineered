import { GuiService, RunService, StarterGui, UserInputService } from "@rbxts/services";
import PlayerDataStorage from "./PlayerDataStorage";
import ComponentContainer from "./base/ComponentContainer";
import BeaconController from "./controller/BeaconController";
import GameEnvironmentController from "./controller/GameEnvironmentController";
import LocalPlayerController from "./controller/LocalPlayerController";
import PlayModeController from "./controller/PlayModeController";
import SoundController from "./controller/SoundController";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import DebugControl from "./gui/static/DebugControl";
import LogControl from "./gui/static/LogControl";
import TooltipsControl from "./gui/static/TooltipsControl";

GuiService.SetGameplayPausedNotificationEnabled(false);

(async () => await PlayerDataStorage.init())();

GameEnvironmentController.initialize();

TooltipsControl.instance.show();
LogControl.instance.show();

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
			UserInputService.MouseIconEnabled = true;

			scene.enable();
		}
	};

	if (input.IsModifierKeyDown("Shift") && UserInputService.IsKeyDown(Enum.KeyCode.G)) {
		toggle();
	}
});
