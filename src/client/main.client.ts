/* eslint-disable import/order */
$log("Starting");

import { LoadingController } from "client/controller/LoadingController";
LoadingController.show("Preparing the initialization");

import { SandboxGame } from "client/SandboxGame";
import { GameLoader } from "client/GameLoader";
import { Game } from "shared/GameHost";

const builder = Game.createHost();
try {
	SandboxGame.initialize(builder);
} catch (err) {
	GameLoader.showBSOD(tostring(err ?? ""));
	throw err;
}

const host = builder.build();

host.run();

GameLoader.waitForEverything(LoadingController.show);
LoadingController.show("Loading the dependencies");

import { Players, TextChatService } from "@rbxts/services";
import { AdminMessageController } from "client/AdminMessageController";
import { ServerRestartController } from "client/ServerRestartController";
import { CharacterController } from "client/controller/CharacterController";
import { GameEnvironmentController } from "client/controller/GameEnvironmentController";
import { LocalPlayerController } from "client/controller/LocalPlayerController";
import { SoundController } from "client/controller/SoundController";
import { WindController } from "client/controller/WindController";
import { MusicController } from "client/controller/sound/MusicController";
import { InputTypeChangeEvent } from "client/event/InputTypeChangeEvent";
import { Gui } from "client/gui/Gui";
import { LogControl } from "client/gui/static/LogControl";
import { RemoteEvents } from "shared/RemoteEvents";
import { GameDefinitions } from "shared/data/GameDefinitions";

LoadingController.show("Loading the game");

GameEnvironmentController.initialize();

LogControl.instance.show();
WindController.initialize();

LocalPlayerController.initialize();
CharacterController.initialize();
InputTypeChangeEvent.subscribe();
RemoteEvents.initialize();
AdminMessageController.initialize();
ServerRestartController.initialize();

SoundController.initialize();
MusicController.initialize();

const updated = DateTime.fromUnixTimestamp($compileTime()).FormatUniversalTime("DDMMYY_HHmm", "en-us");
Gui.getGameUI<{ VERSION: TextLabel }>().VERSION.Text =
	GameDefinitions.PRODUCTION_PLACE_ID === game.PlaceId
		? GameDefinitions.VERSION
		: `v${game.PlaceVersion} | ${updated}`;

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

LoadingController.hide();
$log("Client loaded.");
