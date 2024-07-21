import { Players, RunService } from "@rbxts/services";
import { AdminMessageController } from "client/AdminMessageController";
import { LoadingController } from "client/controller/LoadingController";
import { InputTypeChangeEvent } from "client/event/InputTypeChangeEvent";
import { BSOD } from "client/gui/BSOD";
import { Gui } from "client/gui/Gui";
import { LogControl } from "client/gui/static/LogControl";
import { SandboxGame } from "client/SandboxGame";
import { ServerRestartController } from "client/ServerRestartController";
import { Game } from "shared/GameHost";
import { RemoteEvents } from "shared/RemoteEvents";
import { BulletProjectile } from "shared/weapons/BulletProjectileLogic";

LoadingController.show("Initializing");
Gui.getGameUI<{ VERSION: TextLabel }>().VERSION.Text = `v${RunService.IsStudio() ? "studio" : game.PlaceVersion}`;

const builder = Game.createHost();
try {
	SandboxGame.initialize(builder);
} catch (err) {
	BSOD.showWithDefaultText(err, "The game has failed to load.");
	throw err;
}

const host = builder.build();

host.run();

LoadingController.show("Loading the rest");

LogControl.instance.show();

InputTypeChangeEvent.subscribe();
RemoteEvents.initialize();
AdminMessageController.initialize();
ServerRestartController.initialize();

LoadingController.hide();
$log("Client loaded.");

//testing
if (RunService.IsStudio() && Players.LocalPlayer.Name === "samlovebutter") {
	while (true as boolean) {
		BulletProjectile.spawn.send({
			startPosition: new Vector3(359, -16360, 330),
			baseVelocity: new Vector3(
				0 + (math.random() - 0.5) * 10,
				20 + (math.random() - 0.5) * 10,
				5000 + (math.random() - 0.5) * 10,
			),
			baseDamage: 0,
		});
		task.wait(0.3);
	}
}
