import { Players, ReplicatedStorage } from "@rbxts/services";
import Logger from "shared/Logger";
import { UnreliableRemotes } from "shared/Remotes";
import SharedPlots from "shared/building/SharedPlots";
import PartUtils from "shared/utils/PartUtils";

export default class ImpactController {
	private static debug = false;

	private static materialImpactSounds = {
		Default: ReplicatedStorage.Assets.Sounds.Impact.Materials.Metal,

		Wood: ReplicatedStorage.Assets.Sounds.Impact.Materials.Wood,
		Metal: ReplicatedStorage.Assets.Sounds.Impact.Materials.Metal,
	};

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
				? 1000
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
			const m1 = part.AssemblyLinearVelocity.Magnitude + part.AssemblyAngularVelocity.Magnitude;
			const m2 = secondPart.AssemblyLinearVelocity.Magnitude + secondPart.AssemblyAngularVelocity.Magnitude;

			// Material protection
			maxDiff *= math.max(0.5, part.CurrentPhysicalProperties.Density / 3.5);

			maxDiff = math.round(maxDiff);

			const diff = math.round(math.abs(m1 - m2));
			if (diff > maxDiff) {
				if (this.debug) {
					Logger.info(`Block Overload ${diff} of ${maxDiff} allowed`);
				}

				if (math.random(1, 20) === 1) {
					UnreliableRemotes.Burn.FireServer(part);
				}

				if (math.random(1, 2) === 1) {
					UnreliableRemotes.BreakJoints.FireServer(part);
					event.Disconnect();
				}

				const soundsFolder =
					ReplicatedStorage.Assets.Sounds.Impact.Materials.FindFirstChild(part.Material.Name) ??
					ReplicatedStorage.Assets.Sounds.Impact.Materials.Metal;
				const soundList = soundsFolder.GetChildren();
				const randomSound = soundList[math.random(0, soundList.size() - 1)] as Sound;
				const sound = randomSound.Clone();
				sound.RollOffMaxDistance = 1000;
				sound.Volume = 0.5;
				sound.Parent = math.random(1, 2) === 1 && secondPart.IsA("Terrain") ? secondPart : part;
				sound.Play();
				game.GetService("Debris").AddItem(sound, sound.TimeLength);
			} else if (diff + maxDiff * 0.2 > maxDiff) {
				UnreliableRemotes.CreateSparks.FireServer(part);
			}
		});
	}
}
