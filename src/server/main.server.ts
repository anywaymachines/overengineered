/* eslint-disable import/order */
import { TestFramework } from "shared/test/TestFramework";
if (!game.GetService("RunService").IsStudio()) {
	for (const testscript of TestFramework.findAllTestScripts()) {
		testscript.Destroy();
	}
}

import { Players, RunService, Workspace } from "@rbxts/services";
import { RemoteEvents } from "shared/RemoteEvents";
import { SandboxGame } from "server/SandboxGame";
import { Game } from "shared/GameHost";
import { PlasmaProjectile } from "shared/weapons/PlasmaProjectileLogic";
import { BulletProjectile } from "shared/weapons/BulletProjectileLogic";
//import { OutsideControl } from "server/OutsideControl";

const builder = Game.createHost();
SandboxGame.initialize(builder);
//OutsideControl.initialize();

const host = builder.build();
host.run();

// Initializing event workders
RemoteEvents.initialize();

$log("Server loaded.");
Workspace.AddTag("GameLoaded");

PlasmaProjectile; // initializing the remote events
BulletProjectile;

Players.PlayerAdded.Connect((plr) => {
	if (!RunService.IsStudio() && plr.AccountAge < 10) {
		plr.Kick("Your account is too young, due to security reasons you must wait 10 days before you can play.");
	}
});
