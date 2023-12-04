import SlotsDatabase from "server/SlotsDatabase";
import BlocksSerializer from "server/plots/BlocksSerializer";
import SlotsMeta from "shared/SlotsMeta";
import SharedPlots from "shared/building/SharedPlots";
import BlockRegistry from "shared/registry/BlockRegistry";
import PartUtils from "shared/utils/PartUtils";
import PlayModeBase from "./PlayModeBase";

export default class RideMode implements PlayModeBase {
	onTransitionFrom(player: Player, prevmode: PlayModes | undefined) {
		if (prevmode === "build") {
			return this.rideStart(player);
		}
	}
	onTransitionTo(player: Player, nextmode: PlayModes | undefined) {
		if (nextmode === undefined || nextmode === "build") {
			return this.rideStop(player);
		}
	}

	private rideStart(player: Player) {
		const plot = SharedPlots.getPlotByOwnerID(player.UserId);
		const blocks = SharedPlots.getPlotBlocks(plot);

		const blocksChildren = blocks.GetChildren() as unknown as readonly Model[];

		const requiredBlocks = BlockRegistry.blockList.filter((value) => value.required);
		for (const block of requiredBlocks) {
			if (!blocksChildren.find((value) => value.GetAttribute("id") === block.id)) {
				return {
					success: false,
					message: block.displayName + " not found",
				};
			}
		}

		SlotsDatabase.instance.setBlocks(player.UserId, SlotsMeta.autosaveSlotIndex, BlocksSerializer.serialize(plot));

		const hrp = player.Character?.WaitForChild("Humanoid") as Humanoid;
		const vehicleSeatModel = blocksChildren.find((model) => model.GetAttribute("id") === "vehicleseat") as Model;
		const vehicleSeat = vehicleSeatModel.FindFirstChild("VehicleSeat") as VehicleSeat;
		vehicleSeat.Sit(hrp);

		PartUtils.switchDescendantsAnchor(blocks, false);
		PartUtils.switchDescendantsNetworkOwner(blocks, player);

		return { success: true };
	}
	private rideStop(player: Player) {
		const plot = SharedPlots.getPlotByOwnerID(player.UserId);
		const blocks = SharedPlots.getPlotBlocks(plot);

		blocks.ClearAllChildren();

		const blocksToLoad = SlotsDatabase.instance.getBlocks(player.UserId, SlotsMeta.autosaveSlotIndex);
		if (blocksToLoad) BlocksSerializer.deserialize(plot, blocksToLoad);

		return { success: true };
	}
}
