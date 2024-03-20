import { Players } from "@rbxts/services";
import SlotDatabase from "server/database/SlotDatabase";
import BlocksSerializer from "server/plots/BlocksSerializer";
import ServerPartUtils from "server/plots/ServerPartUtils";
import { BlocksInitializer } from "shared/BlocksInitializer";
import SlotsMeta from "shared/SlotsMeta";
import BlockManager from "shared/building/BlockManager";
import SharedPlots from "shared/building/SharedPlots";
import PlayModeBase from "./PlayModeBase";

export default class RideMode implements PlayModeBase {
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

		for (const block of BlocksInitializer.blocks.required) {
			if (!blocksChildren.find((value) => BlockManager.manager.id.get(value) === block.id)) {
				return {
					success: false,
					message: block.displayName + " not found",
				};
			}
		}

		const copy = blocks.Clone();
		this.cache.set(player, copy);

		SlotDatabase.instance.setBlocks(
			player.UserId,
			SlotsMeta.autosaveSlotIndex,
			BlocksSerializer.serialize(plot),
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

		vehicleSeat.Sit(hrp);

		//const currentMachine = new SharedMachine();
		//currentMachine.init(SharedPlots.getPlotBlockDatas(plot));

		ServerPartUtils.switchDescendantsAnchor(blocks, false);
		if (true as boolean) {
			ServerPartUtils.switchDescendantsNetworkOwner(blocks, player);
		} else {
			ServerPartUtils.switchDescendantsNetworkOwner(blocks, /*player*/ undefined);
		}

		return { success: true };
	}
	private rideStop(player: Player): Response {
		const plot = SharedPlots.getPlotByOwnerID(player.UserId);
		const blocks = plot.Blocks;

		blocks.ClearAllChildren();

		const cache = this.cache.get(player);
		if (cache) {
			const time = os.clock();
			for (const child of cache.GetChildren()) {
				child.Parent = blocks;
			}

			print(`Loaded the cached save in ${os.clock() - time}`);
		} else {
			const blocksToLoad = SlotDatabase.instance.getBlocks(player.UserId, SlotsMeta.autosaveSlotIndex);
			if (blocksToLoad !== undefined) {
				BlocksSerializer.deserialize(blocksToLoad, plot);
			}
		}

		this.cache.delete(player);
		return { success: true };
	}
}
