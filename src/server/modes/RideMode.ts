import { Players } from "@rbxts/services";
import { SlotDatabase } from "server/database/SlotDatabase";
import { BlocksSerializer } from "server/plots/BlocksSerializer";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { BlockManager } from "shared/building/BlockManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { SlotsMeta } from "shared/SlotsMeta";
import type { PlayModeBase } from "server/modes/PlayModeBase";
import type { ServerPlots } from "server/plots/ServerPlots";
import type { BlockRegistry } from "shared/block/BlockRegistry";

@injectable
export class RideMode implements PlayModeBase {
	private readonly cache = new Map<Player, readonly BlockModel[]>();

	constructor(
		@inject private readonly serverPlots: ServerPlots,
		@inject private readonly blockRegistry: BlockRegistry,
	) {
		Players.PlayerRemoving.Connect((player) => {
			const blocks = this.cache.get(player);

			if (blocks) {
				for (const block of blocks) {
					block.Destroy();
				}

				this.cache.delete(player);
			}
		});
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
		SlotDatabase.instance.setBlocks(
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

		hrp.Sit = false;
		vehicleSeat.Sit(hrp);

		for (const block of blocksChildren) {
			// TODO: move `anchorblock` check somewhere
			if (BlockManager.manager.id.get(block) === "anchorblock") {
				ServerPartUtils.switchDescendantsAnchor(block, true);
			} else {
				ServerPartUtils.switchDescendantsAnchor(block, false);
			}
		}

		for (const block of blocksChildren) {
			if (block.PrimaryPart?.Anchored) continue;
			ServerPartUtils.switchDescendantsNetworkOwner(block, player);
		}

		return { success: true };
	}
	private rideStop(player: Player): Response {
		const controller = this.serverPlots.tryGetControllerByPlayer(player);
		if (!controller) throw "what";

		const plot = SharedPlots.getPlotComponentByOwnerID(player.UserId);
		const blocks = plot.instance.Blocks;

		for (const block of controller.blocks.getBlocks()) {
			block.Destroy();
			if (math.random(6) === 1) {
				task.wait();
			}
		}

		const cache = this.cache.get(player);
		if (cache) {
			const time = os.clock();
			for (const child of cache) {
				controller.blocks.justPlaceExisting(child);

				if (math.random(3) === 1) {
					task.wait();
				}
			}

			print(`Loaded the cached save in ${os.clock() - time}`);
		} else {
			controller.blocks.clearBlocks();

			const blocksToLoad = SlotDatabase.instance.getBlocks(player.UserId, SlotsMeta.autosaveSlotIndex);
			if (blocksToLoad !== undefined) {
				BlocksSerializer.deserialize(blocksToLoad, controller.blocks);
			}
		}

		this.cache.delete(player);
		return { success: true };
	}
}
