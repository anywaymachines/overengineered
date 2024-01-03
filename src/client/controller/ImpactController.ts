import { Players } from "@rbxts/services";
import { UnreliableRemotes } from "shared/Remotes";
import SharedPlots from "shared/building/SharedPlots";
import PartUtils from "shared/utils/PartUtils";

export default class ImpactController {
	static blacklist = ["wheel"];

	static initializeBlocks() {
		const blocks = SharedPlots.getPlotBlocks(
			SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId),
		).GetChildren();

		blocks.forEach((value) => {
			PartUtils.applyToAllDescendantsOfType("BasePart", value, (part) => {
				if (!part.CanTouch || part.Transparency === 1 || part.IsA("VehicleSeat")) {
					return;
				}
				this.initializeBlock(part);
			});
		});
	}

	private static initializeBlock(part: BasePart) {
		const event = part.Touched.Connect((secondPart: BasePart) => {
			if (secondPart.IsA("BasePart") && !secondPart.CanCollide) {
				return;
			}

			const id = (part.Parent as Model).GetAttribute("id") as string;
			let maxDiff = this.blacklist.includes(id)
				? 400
				: secondPart.IsA("Terrain") || !secondPart.Anchored
				  ? 70
				  : 160;

			// Player character diff
			if (
				secondPart.IsA("BasePart") &&
				secondPart.Parent &&
				(secondPart.Parent as Model).PrimaryPart &&
				(secondPart.Parent as Model).PrimaryPart!.Name === "HumanoidRootPart"
			) {
				maxDiff *= 2;
			}

			// Magnitudes
			const m1 = part.AssemblyLinearVelocity.Magnitude;
			const m2 = secondPart.AssemblyLinearVelocity.Magnitude;

			// Material protection
			maxDiff *= math.max(0.5, part.CurrentPhysicalProperties.Density / 3.5);

			const diff = math.round(math.abs(m1 - m2));
			if (diff > maxDiff) {
				if (math.random(1, 20) === 1) {
					UnreliableRemotes.Burn.FireServer(part);
				}
				if (math.random(1, 2) === 1) {
					UnreliableRemotes.BreakJoints.FireServer(part);
					event.Disconnect();
				}
			} else if (diff + maxDiff * 0.2 > maxDiff) {
				UnreliableRemotes.CreateSparks.FireServer(part);
			}
		});
	}
}
