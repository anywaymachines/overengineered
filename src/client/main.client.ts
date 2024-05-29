/* eslint-disable import/order */
import { DIContainer } from "shared/DI";
import { SandboxGame } from "client/SandboxGame";
import { LoadingController } from "client/controller/LoadingController";
import { GameLoader } from "client/GameLoader";

const di = new DIContainer();
di.regResolve(SandboxGame);

import { PlayerDataStorage } from "client/PlayerDataStorage";

const dataLoading = PlayerDataStorage.init();
GameLoader.waitForEverything(LoadingController.show);
LoadingController.show("Loading the dependencies");

import { Players, TextChatService } from "@rbxts/services";
import { AdminMessageController } from "client/AdminMessageController";
import { ServerRestartController } from "client/ServerRestartController";
import { CharacterController } from "client/controller/CharacterController";
import { GameEnvironmentController } from "client/controller/GameEnvironmentController";
import { GraphicsSettingsController } from "client/controller/GraphicsSettingsController";
import { LocalPlayerController } from "client/controller/LocalPlayerController";
import { SoundController } from "client/controller/SoundController";
import { WindController } from "client/controller/WindController";
import { MusicController } from "client/controller/sound/MusicController";
import { InputTypeChangeEvent } from "client/event/InputTypeChangeEvent";
import { Gui } from "client/gui/Gui";
import { LogControl } from "client/gui/static/LogControl";
import { ClientBuildingValidation } from "client/modes/build/ClientBuildingValidation";
import { RemoteEvents } from "shared/RemoteEvents";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { BlocksInitializer } from "shared/init/BlocksInitializer";

LoadingController.show("Loading the game");

// TODO: remove delete
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

SoundController.initialize();
MusicController.initialize();
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

GameLoader.waitForServer();
PlayerDataStorage.refetchGameData().await();

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

GameLoader.mainLoaded = true;
