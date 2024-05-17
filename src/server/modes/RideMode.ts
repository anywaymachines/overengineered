import { Players } from "@rbxts/services";
import { SlotDatabase } from "server/database/SlotDatabase";
import { BlocksSerializer } from "server/plots/BlocksSerializer";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { SlotsMeta } from "shared/SlotsMeta";
import { BlockRegistry } from "shared/block/BlockRegistry";
import { BlockManager } from "shared/building/BlockManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { PlayModeBase } from "./PlayModeBase";

export class RideMode implements PlayModeBase {
	private readonly cache = new Map<Player, PlotBlocks>();

	constructor() {
		Players.PlayerRemoving.Connect((player) => this.cache.delete(player));
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
		const plot = SharedPlots.getPlotByOwnerID(player.UserId);
		const blocks = plot.Blocks;

		const blocksChildren = blocks.GetChildren(undefined);

		for (const block of BlockRegistry.required) {
			if (!blocksChildren.find((value) => BlockManager.manager.id.get(value) === block.id)) {
				return {
					success: false,
					message: block.displayName + " not found",
				};
			}
		}

		const copy = blocks.Clone();
		this.cache.set(player, copy);

		const serialized = BlocksSerializer.serialize(plot);
		SlotDatabase.instance.setBlocks(
			player.UserId,
			SlotsMeta.autosaveSlotIndex,
			serialized,
			SharedPlots.getPlotComponent(plot).getBlocks().size(),
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

		//const currentMachine = new SharedMachine();
		//currentMachine.init(SharedPlots.getPlotBlockDatas(plot));

		ServerPartUtils.switchDescendantsAnchor(blocks, false);
		if (true as boolean) {
			ServerPartUtils.switchDescendantsNetworkOwner(blocks, player);
		} else {
			ServerPartUtils.switchDescendantsNetworkOwner(blocks, /*player*/ undefined);
		}

		for (const block of blocksChildren) {
			if (BlockManager.manager.id.get(block) === "anchorblock") {
				ServerPartUtils.switchDescendantsAnchor(block, true);
			}
		}

		return { success: true };
	}
	private rideStop(player: Player): Response {
		const plot = SharedPlots.getPlotComponentByOwnerID(player.UserId);
		const blocks = plot.instance.Blocks;

		for (const block of plot.getBlocks()) {
			block.Destroy();
			if (math.random(6) === 1) {
				task.wait();
			}
		}

		const cache = this.cache.get(player);
		if (cache) {
			const time = os.clock();
			for (const child of cache.GetChildren()) {
				child.Parent = blocks;
				if (math.random(3) === 1) {
					task.wait();
				}
			}

			print(`Loaded the cached save in ${os.clock() - time}`);
		} else {
			const blocksToLoad = SlotDatabase.instance.getBlocks(player.UserId, SlotsMeta.autosaveSlotIndex);
			if (blocksToLoad !== undefined) {
				BlocksSerializer.deserialize(blocksToLoad, plot.instance);
			}
		}

		this.cache.delete(player);
		return { success: true };
	}
}
