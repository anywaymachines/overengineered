import { Players, RunService } from "@rbxts/services";
import SharedPlots from "shared/building/SharedPlots";
import PlayerController from "./PlayerController";
import PlayerDataStorage from "./PlayerDataStorage";
import ComponentContainer from "./base/ComponentContainer";
import BeaconController from "./controller/BeaconController";
import CharacterController from "./controller/CharacterController";
import GameEnvironmentController from "./controller/GameEnvironmentController";
import PlayModeController from "./controller/PlayModeController";
import SoundController from "./controller/SoundController";
import WindController from "./controller/WindController";
import WorldController from "./controller/WorldController";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import DebugControl from "./gui/static/DebugControl";
import LogControl from "./gui/static/LogControl";
import TooltipsControl from "./gui/static/TooltipsControl";

(async () => await PlayerDataStorage.init())();

PlayerController.initialize();

GameEnvironmentController.initialize();

TooltipsControl.instance.show();
LogControl.instance.show();
WorldController.generate();
WindController.initialize();

CharacterController.initialize();
InputTypeChangeEvent.subscribe();

if (RunService.IsStudio()) {
	DebugControl.instance.show();
}

SoundController.initialize();

const root = new ComponentContainer();
const playModeController = new PlayModeController();
root.add(playModeController);
root.enable();

Players.LocalPlayer.CameraMaxZoomDistance = 512;

let plot: PlotModel | undefined;
while (!plot) {
	plot = SharedPlots.tryGetPlotByOwnerID(Players.LocalPlayer.UserId);
	wait(0.1);
}
new BeaconController(plot!, "Plot");
