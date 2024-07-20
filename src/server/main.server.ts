/* eslint-disable import/order */
import { TestFramework } from "shared/test/TestFramework";
if (!game.GetService("RunService").IsStudio()) {
	for (const testscript of TestFramework.findAllTestScripts()) {
		testscript.Destroy();
	}
}

import { Workspace } from "@rbxts/services";
import { RemoteEvents } from "shared/RemoteEvents";
import { SandboxGame } from "server/SandboxGame";
import { Game } from "shared/GameHost";
import { PlasmaProjectile } from "shared/weapons/PlasmaProjectileLogic";
import { BulletProjectile } from "shared/weapons/BulletProjectileLogic";

const builder = Game.createHost();
SandboxGame.initialize(builder);

const host = builder.build();
host.run();

// Initializing event workders
RemoteEvents.initialize();

$log("Server loaded.");
Workspace.AddTag("GameLoaded");

PlasmaProjectile; // initializing the remote events
BulletProjectile;
