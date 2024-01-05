import { Players } from "@rbxts/services";
import Logger from "shared/Logger";
import { UnreliableRemotes } from "shared/Remotes";
import SharedPlots from "shared/building/SharedPlots";
import PartUtils from "shared/utils/PartUtils";

export default class ImpactController {
	private static debug = false;

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
				? 1500
				: secondPart.IsA("Terrain") || !secondPart.Anchored
				  ? 70
				  : 160;

			// Player character diff
			if (
				secondPart.IsA("BasePart") &&
				secondPart.Parent &&
				secondPart.Parent.IsA("Model") &&
				(secondPart.Parent as Model).PrimaryPart &&
				(secondPart.Parent as Model).PrimaryPart!.Name === "HumanoidRootPart"
			) {
				maxDiff *= 4;
			}

			// Magnitudes
			const m1 = part.AssemblyLinearVelocity.Magnitude + part.AssemblyAngularVelocity.Magnitude;
			const m2 = secondPart.AssemblyLinearVelocity.Magnitude + secondPart.AssemblyAngularVelocity.Magnitude;

			// Material protection
			maxDiff *= math.max(0.5, part.CurrentPhysicalProperties.Density / 3.5);

			maxDiff = math.round(maxDiff);

			const diff = math.round(math.abs(m1 - m2));
			if (diff > maxDiff * 5) {
				if (this.debug) {
					Logger.info(`Heavy Block Overload ${diff} of ${maxDiff} allowed`);
				}
				UnreliableRemotes.ImpactExplode.FireServer(part, 1 + diff / (2 * maxDiff * 5));
				event.Disconnect();
			} else if (diff > maxDiff) {
				if (this.debug) {
					Logger.info(`Block Overload ${diff} of ${maxDiff} allowed`);
				}

				if (math.random(1, 20) === 1) {
					UnreliableRemotes.Burn.FireServer(part);
				}

				if (math.random(1, 3) > 1) {
					UnreliableRemotes.ImpactBreak.FireServer(part);
					event.Disconnect();
				}
			} else if (diff + maxDiff * 0.2 > maxDiff) {
				UnreliableRemotes.CreateSparks.FireServer(part);
			}
		});
	}
}
