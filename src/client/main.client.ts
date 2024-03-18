import { Players, ReplicatedStorage, RunService } from "@rbxts/services";
import PlayerDataStorage from "client/PlayerDataStorage";
import CharacterController from "client/controller/CharacterController";
import GameEnvironmentController from "client/controller/GameEnvironmentController";
import LocalPlayerController from "client/controller/LocalPlayerController";
import SoundController from "client/controller/SoundController";
import WindController from "client/controller/WindController";
import InputTypeChangeEvent from "client/event/InputTypeChangeEvent";
import Gui from "client/gui/Gui";
import DebugControl from "client/gui/static/DebugControl";
import LogControl from "client/gui/static/LogControl";
import PlayModeController from "client/modes/PlayModeController";
import { $compileTime } from "rbxts-transform-debug";
import { BlocksInitializer } from "shared/BlocksInitializer";
import RemoteEvents from "shared/RemoteEvents";
import SharedPlots from "shared/building/SharedPlots";
import { AdminMessageController } from "./AdminMessageController";
import { ClientContainerComponent } from "./component/ClientContainerComponent";
import { rootComponents } from "./test/RootComponents";

// wait for assets to be copied
ReplicatedStorage.WaitForChild("Assets");
while (!SharedPlots.tryGetPlotByOwnerID(Players.LocalPlayer.UserId)) {
	task.wait(0.2);
}

(async () => await PlayerDataStorage.init())();

BlocksInitializer.initialize();
GameEnvironmentController.initialize();

LogControl.instance.show();
WindController.initialize();

LocalPlayerController.initialize();
CharacterController.initialize();
InputTypeChangeEvent.subscribe();
RemoteEvents.initialize();
AdminMessageController.initialize();

if (RunService.IsStudio()) {
	DebugControl.instance.show();
}

SoundController.initialize();

const root = new ClientContainerComponent();
rootComponents.push(root);
const playModeController = new PlayModeController();
root.add(playModeController);
root.enable();

const updated = DateTime.fromUnixTimestamp($compileTime("UnixTimestamp")).FormatUniversalTime("DDMMYY_HHmm", "en-us");
Gui.getGameUI<{ VERSION: TextLabel }>().VERSION.Text = `DEVTEST | v${game.PlaceVersion} | ${updated}`;
