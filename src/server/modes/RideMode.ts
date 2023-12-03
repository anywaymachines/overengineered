import SlotsDatabase from "server/SlotsDatabase";
import BlocksSerializer from "server/plots/BlocksSerializer";
import SlotsMeta from "shared/SlotsMeta";
import SharedPlots from "shared/building/SharedPlots";
import BlockRegistry from "shared/registry/BlocksRegistry";
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

		const blocksChildren = blocks.GetChildren();

		// Check is required blocks exist
		for (let i = 0; i < BlockRegistry.RequiredBlocks.size(); i++) {
			const requiredBlock = BlockRegistry.RequiredBlocks[i];

			const vehicleSeat = blocksChildren.find((model) => model.GetAttribute("id") === requiredBlock.id);
			if (!vehicleSeat) {
				return {
					success: false,
					message: requiredBlock.getDisplayName() + " not found",
				};
			}
		}

		SlotsDatabase.instance.setBlocks(player.UserId, SlotsMeta.autosaveSlotIndex, BlocksSerializer.serialize(plot));

		const hrp = player.Character?.WaitForChild("Humanoid") as Humanoid;
		const vehicleSeatModel = blocksChildren.find(
			(model) => model.GetAttribute("id") === BlockRegistry.VEHICLE_SEAT.id,
		) as Model;
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
