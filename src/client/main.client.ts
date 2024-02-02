import { MarketplaceService, Players, ReplicatedStorage, RunService } from "@rbxts/services";
import RemoteEvents from "shared/RemoteEvents";
import SharedPlots from "shared/building/SharedPlots";
import PlayerDataStorage from "./PlayerDataStorage";
import ComponentContainer from "./component/ComponentContainer";
import BeaconController from "./controller/BeaconController";
import CharacterController from "./controller/CharacterController";
import GameEnvironmentController from "./controller/GameEnvironmentController";
import LocalPlayerController from "./controller/LocalPlayerController";
import SoundController from "./controller/SoundController";
import WindController from "./controller/WindController";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import Gui from "./gui/Gui";
import DebugControl from "./gui/static/DebugControl";
import LogControl from "./gui/static/LogControl";
import TooltipsControl from "./gui/static/TooltipsControl";
import PlayModeController from "./modes/PlayModeController";

// wait for assets to be copied
ReplicatedStorage.WaitForChild("Assets");

(async () => await PlayerDataStorage.init())();

GameEnvironmentController.initialize();

TooltipsControl.instance.show();
LogControl.instance.show();
WindController.initialize();

LocalPlayerController.initialize();
CharacterController.initialize();
InputTypeChangeEvent.subscribe();
RemoteEvents.initialize();

if (RunService.IsStudio()) {
	DebugControl.instance.show();
}

SoundController.initialize();

const root = new ComponentContainer();
const playModeController = new PlayModeController();
root.add(playModeController);
root.enable();

let plot: PlotModel | undefined;
while (!plot) {
	plot = SharedPlots.tryGetPlotByOwnerID(Players.LocalPlayer.UserId);
	wait(0.1);
}
new BeaconController(plot!, "Plot");

spawn(() => {
	const updated = MarketplaceService.GetProductInfo(game.PlaceId).Updated;
	Gui.getGameUI<{ VERSION: TextLabel }>().VERSION.Text = `DEVTEST | v${game.PlaceVersion} | ${updated}`;
});
