import { Players } from "@rbxts/services";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { BlockManager } from "shared/building/BlockManager";
import { BlocksSerializer } from "shared/building/BlocksSerializer";
import { CustomRemotes } from "shared/Remotes";
import { SlotsMeta } from "shared/SlotsMeta";
import { Throttler } from "shared/Throttler";
import type { SlotDatabase } from "server/database/SlotDatabase";
import type { PlayModeBase } from "server/modes/PlayModeBase";
import type { ServerPlots } from "server/plots/ServerPlots";
import type { BlockRegistry } from "shared/block/BlockRegistry";

@injectable
export class RideMode implements PlayModeBase {
	private readonly cache = new Map<Player, Instance>();

	constructor(
		@inject private readonly serverPlots: ServerPlots,
		@inject private readonly blockRegistry: BlockRegistry,
		@inject private readonly slots: SlotDatabase,
	) {
		Players.PlayerRemoving.Connect((player) => {
			const blocks = this.cache.get(player);

			if (blocks) {
				blocks.Destroy();
				this.cache.delete(player);
			}
		});

		CustomRemotes.modes.ride.teleportOnSeat.invoked.Connect(this.sit.bind(this));
	}
	private sit(player: Player) {
		const hrp = player.Character!.WaitForChild("Humanoid") as Humanoid;
		if (hrp.Sit) return;
		if (hrp.Health <= 0) return;

		const plot = this.serverPlots.plots.getPlotByOwnerID(player.UserId);
		const blocks = this.serverPlots.plots.getPlotComponent(plot).getBlocks();

		const vehicleSeatModel = blocks.find((model) => BlockManager.manager.id.get(model) === "vehicleseat") as Model;
		const vehicleSeat = vehicleSeatModel.FindFirstChild("VehicleSeat") as VehicleSeat;
		if (vehicleSeat.Occupant && vehicleSeat.Occupant !== player.Character?.FindFirstChild("Humanoid")) {
			vehicleSeat.Occupant.Sit = false;
			task.wait(0.5);
		}

		vehicleSeat.Sit(hrp);
	}

	onTransitionFrom(player: Player, prevmode: PlayModes | undefined): Response | undefined {
		if (prevmode === "build") {
			return this.rideStart(player);
		}
	}
	onTransitionTo(player: Player, nextmode: PlayModes | undefined): Response | undefined {
		if (nextmode === undefined || nextmode === "build") {
			return this.rideStop(player);
		}
	}

	private initializePhysics(owner: Player, blocks: readonly BlockModel[]) {
		const data = blocks.flatmap((value) => value.GetChildren());

		const rootParts: BasePart[] = [];
		for (const instance of data) {
			if (instance.IsA("BasePart") && instance.AssemblyRootPart === instance) {
				rootParts.push(instance);
			}
		}

		const players = Players.GetPlayers().filter((p) => p !== owner);
		CustomRemotes.physics.normalizeRootparts.send(players, { parts: rootParts });
	}

	private rideStart(player: Player): Response {
		const controller = this.serverPlots.tryGetControllerByPlayer(player);
		if (!controller) throw "what";

		const blocksChildren = controller.blocks.getBlocks();

		for (const block of this.blockRegistry.required) {
			if (!blocksChildren.find((value) => BlockManager.manager.id.get(value) === block.id)) {
				return {
					success: false,
					message: block.displayName + " not found",
				};
			}
		}

		const copy = controller.blocks.cloneBlocks();
		this.cache.set(player, copy);

		const serialized = BlocksSerializer.serialize(controller.blocks);
		this.slots.setBlocks(
			player.UserId,
			SlotsMeta.autosaveSlotIndex,
			serialized,
			controller.blocks.getBlocks().size(),
		);

		const hrp = player.Character?.WaitForChild("Humanoid") as Humanoid;
		const vehicleSeatModel = blocksChildren.find(
			(model) => BlockManager.manager.id.get(model) === "vehicleseat",
		) as Model;
		const vehicleSeat = vehicleSeatModel.FindFirstChild("VehicleSeat") as VehicleSeat;
		if (vehicleSeat.Occupant && vehicleSeat.Occupant !== player.Character?.FindFirstChild("Humanoid")) {
			vehicleSeat.Occupant.Sit = false;
			task.wait(0.5);
		}

		if (vehicleSeat.Occupant !== player.Character?.FindFirstChild("Humanoid")) {
			vehicleSeat.Occupant!.Sit = false;
			vehicleSeat.Sit(hrp);
		}

		for (const block of blocksChildren) {
			ServerPartUtils.switchDescendantsAnchor(block, false);
		}

		for (const block of blocksChildren) {
			ServerPartUtils.switchDescendantsNetworkOwner(block, player);
		}

		// TODO: move this somewhere
		for (const block of blocksChildren) {
			if (BlockManager.manager.id.get(block) === "anchorblock") {
				ServerPartUtils.switchDescendantsAnchor(block, true);
			}
		}

		this.initializePhysics(player, controller.blocks.getBlocks());

		return { success: true };
	}
	private rideStop(player: Player): Response {
		const controller = this.serverPlots.tryGetControllerByPlayer(player);
		if (!controller) throw "what";

		Throttler.forEach(6, controller.blocks.getBlocks(), (b) => b.Destroy());

		const cache = this.cache.get(player);
		if (cache) {
			const time = os.clock();
			Throttler.forEach(3, cache.GetChildren() as BlockModel[], (child) =>
				controller.blocks.justPlaceExisting(child),
			);

			cache.Destroy();
			print(`Loaded the cached save in ${os.clock() - time}`);
		} else {
			controller.blocks.deleteOperation.execute("all");

			const blocksToLoad = this.slots.getBlocks(player.UserId, SlotsMeta.autosaveSlotIndex);
			if (blocksToLoad !== undefined) {
				BlocksSerializer.deserialize(blocksToLoad, controller.blocks);
			}
		}

		this.cache.delete(player);
		return { success: true };
	}
}
