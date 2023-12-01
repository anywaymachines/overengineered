import { Players } from "@rbxts/services";
import SlotsDatabase from "server/SlotsDatabase";
import BlocksSerializer from "server/plots/BlocksSerializer";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import SlotsMeta from "shared/SlotsMeta";
import SharedPlots from "shared/building/SharedPlots";
import BlockRegistry from "shared/registry/BlocksRegistry";
import PartUtils from "shared/utils/PartUtils";
import PlayerUtils from "shared/utils/PlayerUtils";

export default class SetPlayModeEvent {
	private static readonly modes: Record<number, PlayModes | undefined> = {};

	static initialize(): void {
		Logger.info("Loading SetPlayModeEvent event listener...");

		Players.PlayerRemoving.Connect((plr) => delete this.modes[plr.UserId]);
		Players.PlayerAdded.Connect((plr) => {
			// on spawn
			plr.CharacterAdded.Connect((character) => {
				const response = this.setMode(plr, "build");
				if (!response.success) print(response.message);

				(character.WaitForChild("Humanoid") as Humanoid).Died.Connect(() => {
					const response = this.setMode(plr, undefined);
					if (!response.success) print(response.message);
				});
			});
		});

		Remotes.Server.GetNamespace("Ride").OnFunction("SetPlayMode", (player, mode) => this.setMode(player, mode));
	}

	private static setMode(player: Player, mode: PlayModes | undefined): Response {
		if (mode !== undefined && !PlayerUtils.isAlive(player)) {
			return { success: false, message: "Player is not alive" };
		}

		const transition = (prev: PlayModes | undefined) => {
			if (mode === undefined) {
				// player just died

				if (prev === "ride") {
					return this.rideStop(player);
				}
			} else if (prev === undefined && mode === "build") {
				// player just spawned
			} else if (prev === "build" && mode === "ride") {
				return this.rideStart(player);
			} else if (prev === "ride" && mode === "build") {
				return this.rideStop(player);
			} else {
				return { success: false, message: "Invalid play mode transition" };
			}
		};
		const transitionResult = transition(this.modes[player.UserId]);
		if (transitionResult?.success === false) {
			return transitionResult;
		}

		print("Player " + player.UserId + " changed his mode from " + this.modes[player.UserId] + " to " + mode);
		this.modes[player.UserId] = mode;
		Remotes.Server.GetNamespace("Ride").Get("SetPlayModeOnClient").CallPlayerAsync(player, mode);
		return { success: true };
	}

	private static rideStart(player: Player) {
		const plot = SharedPlots.getPlotByOwnerID(player.UserId);
		const blocks = SharedPlots.getPlotBlocks(plot);

		const blocksChildren = blocks.GetChildren();

		// Check is required blocks exist
		for (let i = 0; i < BlockRegistry.RequiredBlocks.size(); i++) {
			const requiredBlock = BlockRegistry.RequiredBlocks[i];
			if (!blocksChildren.find((model) => model.GetAttribute("id") === requiredBlock.id)) {
				return {
					success: false,
					message: requiredBlock.getDisplayName() + " not found",
				};
			}
		}

		SlotsDatabase.instance.setBlocks(player.UserId, SlotsMeta.autosaveSlotIndex, BlocksSerializer.serialize(plot));

		// Teleport player to seat
		// const hrp = player.Character?.WaitForChild("HumanoidRootPart") as Part;
		// const vehicleSeatModel = blocksChildren.find(
		// 	(model) => model.GetAttribute("id") === BlockRegistry.VEHICLE_SEAT.id,
		// ) as Model;
		// const vehicleSeat = vehicleSeatModel.FindFirstChild("VehicleSeat") as VehicleSeat;
		// hrp.PivotTo(vehicleSeat.GetPivot());

		PartUtils.switchDescendantsAnchor(blocks, false);
		PartUtils.switchDescendantsNetworkOwner(blocks, player);

		return { success: true };
	}
	private static rideStop(player: Player) {
		const plot = SharedPlots.getPlotByOwnerID(player.UserId);
		const blocks = SharedPlots.getPlotBlocks(plot);

		blocks.ClearAllChildren();

		const blocksToLoad = SlotsDatabase.instance.getBlocks(player.UserId, SlotsMeta.autosaveSlotIndex);
		if (blocksToLoad) BlocksSerializer.deserialize(plot, blocksToLoad);

		return { success: true };
	}
}
