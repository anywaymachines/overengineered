import { Players, RunService } from "@rbxts/services";
import SharedPlots from "shared/building/SharedPlots";
import PlayerDataStorage from "./PlayerDataStorage";
import ComponentContainer from "./base/ComponentContainer";
import BeaconController from "./controller/BeaconController";
import GameEnvironmentController from "./controller/GameEnvironmentController";
import initializeHideInterfaceController from "./controller/HideInterfaceController";
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

let plot: PlotModel | undefined;
while (!plot) {
	plot = SharedPlots.tryGetPlotByOwnerID(Players.LocalPlayer.UserId);
	wait(0.1);
}
new BeaconController(plot!, "not a plot");

if (RunService.IsStudio()) {
	DebugControl.instance.show();
}

SoundController.initialize();

const root = new ComponentContainer();
const playModeController = new PlayModeController();
root.add(playModeController);
root.enable();

initializeHideInterfaceController(playModeController);

Players.LocalPlayer.CameraMaxZoomDistance = 512;
