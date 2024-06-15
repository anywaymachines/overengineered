/* eslint-disable import/order */
$log("Starting");

import { LoadingController } from "client/controller/LoadingController";
LoadingController.show("Preparing the initialization");

import { SandboxGame } from "client/SandboxGame";
import { Game } from "shared/GameHost";
import { BSOD } from "client/gui/BSOD";

const builder = Game.createHost();
try {
	SandboxGame.initialize(builder);
} catch (err) {
	BSOD.showWithDefaultText(tostring(err ?? ""));
	throw err;
}

const host = builder.build();

host.run();

LoadingController.show("Loading the dependencies");

import { AdminMessageController } from "client/AdminMessageController";
import { ServerRestartController } from "client/ServerRestartController";
import { CharacterController } from "client/controller/CharacterController";
import { SoundController } from "client/controller/SoundController";
import { WindController } from "client/controller/WindController";
import { InputTypeChangeEvent } from "client/event/InputTypeChangeEvent";
import { Gui } from "client/gui/Gui";
import { LogControl } from "client/gui/static/LogControl";
import { RemoteEvents } from "shared/RemoteEvents";
import { GameDefinitions } from "shared/data/GameDefinitions";

LoadingController.show("Loading the game");

LogControl.instance.show();
WindController.initialize();

CharacterController.initialize();
InputTypeChangeEvent.subscribe();
RemoteEvents.initialize();
AdminMessageController.initialize();
ServerRestartController.initialize();

SoundController.initialize();

const updated = DateTime.fromUnixTimestamp($compileTime()).FormatUniversalTime("DDMMYY_HHmm", "en-us");
Gui.getGameUI<{ VERSION: TextLabel }>().VERSION.Text =
	GameDefinitions.PRODUCTION_PLACE_ID === game.PlaceId
		? GameDefinitions.VERSION
		: `v${game.PlaceVersion} | ${updated}`;

LoadingController.hide();
$log("Client loaded.");
