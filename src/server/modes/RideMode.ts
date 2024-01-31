import SlotsDatabase from "server/SlotsDatabase";
import BlocksSerializer from "server/plots/BlocksSerializer";
import ServerPartUtils from "server/plots/ServerPartUtils";
import { blockList } from "shared/Registry";
import SlotsMeta from "shared/SlotsMeta";
import SharedMachine from "shared/block/SharedMachine";
import SharedPlots from "shared/building/SharedPlots";
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
		if (vehicleSeat.Occupant && vehicleSeat.Occupant !== player.Character?.FindFirstChild("Humanoid")) {
			vehicleSeat.Occupant.Sit = false;
			task.wait(0.5);
		}

		vehicleSeat.Sit(hrp);

		const currentMachine = new SharedMachine();
		currentMachine.init(SharedPlots.getPlotBlockDatas(plot));

		ServerPartUtils.switchDescendantsAnchor(blocks, false);
		//ServerPartUtils.switchDescendantsNetworkOwner(blocks, player);

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
