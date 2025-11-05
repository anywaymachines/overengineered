game.Workspace.WaitForChild("Assets").Parent = game.GetService("ReplicatedStorage");

import { Players, RunService, Workspace } from "@rbxts/services";
import { LaunchDataController } from "engine/server/network/LaunchDataController";
import { Component } from "engine/shared/component/Component";
import { BB } from "engine/shared/fixes/BB";
import { Instances } from "engine/shared/fixes/Instances";
import { GameHostBuilder } from "engine/shared/GameHostBuilder";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { SandboxGame } from "server/SandboxGame";
import { CreateSpawnVehicle } from "server/SpawnVehicle";
import { SharedMachine } from "shared/blockLogic/SharedMachine";
import { BlocksSerializer } from "shared/building/BlocksSerializer";
import { BuildingPlot } from "shared/building/BuildingPlot";
import { AutoPlotWelder } from "shared/building/PlotWelder";
import { gameInfo } from "shared/GameInfo";
import { RemoteEvents } from "shared/RemoteEvents";
import { TagUtils } from "shared/utils/TagUtils";
import { BulletProjectile } from "shared/weaponProjectiles/BulletProjectileLogic";
import { LaserProjectile } from "shared/weaponProjectiles/LaserProjectileLogic";
import { PlasmaProjectile } from "shared/weaponProjectiles/PlasmaProjectileLogic";

const builder = new GameHostBuilder(gameInfo);
SandboxGame.initialize(builder);

const host = builder.build();
host.run();

const initSpawnVehicle = () => {
	const component = new Component();
	component.enable();

	const vehicleSlot = BlocksSerializer.jsonToObject(CreateSpawnVehicle());

	const plotInstance = Instances.waitForChild<BasePart & { readonly Blocks: Folder }>(
		Workspace,
		"Obstacles",
		"Spawn",
		"VehiclePlot",
	);

	const plot = new BuildingPlot(
		plotInstance.Blocks,
		plotInstance.GetPivot(),
		BB.fromPart(plotInstance),
		host.services.resolve<BlockList>(),
	);
	component.parent(host.services.resolveForeignClass(AutoPlotWelder, [plot]));

	class SM extends SharedMachine {
		protected override createImpactControllerIfNeeded(): undefined {
			return undefined;
		}
	}

	BlocksSerializer.deserializeFromObject(vehicleSlot, plot, host.services.resolve<BlockList>());
	ServerPartUtils.switchDescendantsAnchor(plotInstance.Blocks, false);

	const machine = component.parent(host.services.resolveForeignClass(SM));
	machine.init(plot.getBlockDatas());
};
initSpawnVehicle();

// Initializing event workers
RemoteEvents.initialize();

// Game boot flags
LaunchDataController.initialize();

$log("Server loaded.");
Workspace.AddTag(TagUtils.allTags.GAME_LOADED);

PlasmaProjectile; // initializing the remote events
BulletProjectile;
LaserProjectile;

Players.PlayerAdded.Connect((plr) => {
	if (
		!RunService.IsStudio() &&
		plr.AccountAge < 10 &&
		game.CreatorId !== plr.UserId &&
		game.PrivateServerOwnerId === 0
	) {
		plr.Kick("Your account is too young, due to security reasons you must wait 10 days before you can play.");
	}
});
