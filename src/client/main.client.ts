import { RunService } from "@rbxts/services";
import { AdminMessageController } from "client/AdminMessageController";
import { LoadingController } from "client/controller/LoadingController";
import { SoundController } from "client/controller/SoundController";
import { WindController } from "client/controller/WindController";
import { InputTypeChangeEvent } from "client/event/InputTypeChangeEvent";
import { BSOD } from "client/gui/BSOD";
import { Gui } from "client/gui/Gui";
import { LogControl } from "client/gui/static/LogControl";
import { SandboxGame } from "client/SandboxGame";
import { ServerRestartController } from "client/ServerRestartController";
import { Game } from "shared/GameHost";
import { RemoteEvents } from "shared/RemoteEvents";

LoadingController.show("Initializing");
Gui.getGameUI<{ VERSION: TextLabel }>().VERSION.Text = `v${RunService.IsStudio() ? "studio" : game.PlaceVersion}`;

const builder = Game.createHost();
try {
	SandboxGame.initialize(builder);
} catch (err) {
	BSOD.showWithDefaultText(tostring(err ?? ""));
	throw err;
}

const host = builder.build();

host.run();

LoadingController.show("Loading the rest");

LogControl.instance.show();
WindController.initialize();

InputTypeChangeEvent.subscribe();
RemoteEvents.initialize();
AdminMessageController.initialize();
ServerRestartController.initialize();

LoadingController.hide();
$log("Client loaded.");

// WeaponProjectile.spawn.send({ position: new Vector3(0, 1, 2) });
