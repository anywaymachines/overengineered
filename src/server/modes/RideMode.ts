import SlotsDatabase from "server/SlotsDatabase";
import BlocksSerializer from "server/plots/BlocksSerializer";
import Logger from "shared/Logger";
import { blockList } from "shared/Registry";
import SlotsMeta from "shared/SlotsMeta";
import SharedPlots from "shared/building/SharedPlots";
import PartUtils from "shared/utils/PartUtils";
import PlayModeBase from "./PlayModeBase";

export default class RideMode implements PlayModeBase {
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
		Logger.info("TimeRSB " + DateTime.now());
		const plot = SharedPlots.getPlotByOwnerID(player.UserId);
		const blocks = SharedPlots.getPlotBlocks(plot);

		const blocksChildren = blocks.GetChildren() as unknown as readonly Model[];

		const requiredBlocks = blockList.filter((value) => value.required);
		for (const block of requiredBlocks) {
			if (!blocksChildren.find((value) => value.GetAttribute("id") === block.id)) {
				return {
					success: false,
					message: block.displayName + " not found",
				};
			}
		}

		SlotsDatabase.instance.setBlocks(
			player.UserId,
			SlotsMeta.autosaveSlotIndex,
			BlocksSerializer.serialize(plot),
			SharedPlots.getPlotBlocks(plot).GetChildren().size(),
		);

		const hrp = player.Character?.WaitForChild("Humanoid") as Humanoid;
		const vehicleSeatModel = blocksChildren.find((model) => model.GetAttribute("id") === "vehicleseat") as Model;
		const vehicleSeat = vehicleSeatModel.FindFirstChild("VehicleSeat") as VehicleSeat;
		vehicleSeat.Sit(hrp);

		PartUtils.switchDescendantsAnchor(blocks, false);
		PartUtils.switchDescendantsNetworkOwner(blocks, player);

		return { success: true };
	}
	private rideStop(player: Player): Response {
		const plot = SharedPlots.getPlotByOwnerID(player.UserId);
		const blocks = SharedPlots.getPlotBlocks(plot);

		blocks.ClearAllChildren();

		const blocksToLoad = SlotsDatabase.instance.getBlocks(player.UserId, SlotsMeta.autosaveSlotIndex);
		if (blocksToLoad !== undefined) {
			BlocksSerializer.deserialize(blocksToLoad, plot);
		}

		return { success: true };
	}
}
