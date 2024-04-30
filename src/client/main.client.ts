import { GameLoader } from "client/GameLoader";
import { PlayerDataStorage } from "client/PlayerDataStorage";
import { LoadingController } from "client/controller/LoadingController";

const dataLoading = PlayerDataStorage.init();
GameLoader.waitForEverything(LoadingController.show);
LoadingController.show("Loading the dependencies");

import { Players, RunService, TextChatService } from "@rbxts/services";
import { ServerRestartController } from "client/ServerRestartController";
import { CharacterController } from "client/controller/CharacterController";
import { GameEnvironmentController } from "client/controller/GameEnvironmentController";
import { GraphicsSettingsController } from "client/controller/GraphicsSettingsController";
import { LocalPlayerController } from "client/controller/LocalPlayerController";
import { SoundController } from "client/controller/SoundController";
import { WindController } from "client/controller/WindController";
import { InputTypeChangeEvent } from "client/event/InputTypeChangeEvent";
import { Gui } from "client/gui/Gui";
import { DebugControl } from "client/gui/static/DebugControl";
import { LogControl } from "client/gui/static/LogControl";
import { PlayModeController } from "client/modes/PlayModeController";
import { ClientBuildingValidation } from "client/modes/build/ClientBuildingValidation";
import { $compileTime } from "rbxts-transformer-macros";
import { BlocksInitializer } from "shared/BlocksInitializer";
import { RemoteEvents } from "shared/RemoteEvents";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { AdminMessageController } from "./AdminMessageController";
import { ClientContainerComponent } from "./component/ClientContainerComponent";
import { rootComponents } from "./test/RootComponents";

LoadingController.show("Loading the game");

BlocksInitializer.initialize();
GameEnvironmentController.initialize();

LogControl.instance.show();
WindController.initialize();

LocalPlayerController.initialize();
CharacterController.initialize();
InputTypeChangeEvent.subscribe();
RemoteEvents.initialize();
AdminMessageController.initialize();
ServerRestartController.initialize();
ClientBuildingValidation.initialize();

if (RunService.IsStudio()) {
	DebugControl.instance.show();
}

SoundController.initialize();
GraphicsSettingsController.initialize();

const updated = DateTime.fromUnixTimestamp($compileTime()).FormatUniversalTime("DDMMYY_HHmm", "en-us");
Gui.getGameUI<{ VERSION: TextLabel }>().VERSION.Text =
	GameDefinitions.PRODUCTION_PLACE_ID === game.PlaceId
		? GameDefinitions.VERSION
		: `v${game.PlaceVersion} | ${updated}`;

{
	const [success, result] = dataLoading.await();
	if (!success) {
		throw result;
	}
}
GameLoader.waitForDataStorage();

const root = new ClientContainerComponent();
rootComponents.push(root);
const playModeController = new PlayModeController();
root.add(playModeController);
root.enable();

GameLoader.waitForServer();

LoadingController.hide();

// Prefixes
TextChatService.OnIncomingMessage = function (message: TextChatMessage) {
	const props = new Instance("TextChatMessageProperties");

	if (message.TextSource) {
		const player = Players.GetPlayerByUserId(message.TextSource.UserId);

		if (player && GameDefinitions.isAdmin(player)) {
			props.PrefixText = `<font color='#ff5555'>[Developer]</font> ` + message.PrefixText;
		}
	}

	return props;
};
