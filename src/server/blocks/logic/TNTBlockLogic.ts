import { Workspace } from "@rbxts/services";
import SpreadingFireController from "server/SpreadingFireController";
import { registerOnRemoteEvent2 } from "server/network/event/RemoteHandler";
import PartUtils from "shared/utils/PartUtils";

export default class TNTBlockLogic {
	static init() {
		registerOnRemoteEvent2("Blocks", "TNTBlock", "Explode", (player, block, radius, pressure, isFlammable) => {
			if (!block) {
				return;
			}

			if (!block.IsDescendantOf(Workspace)) {
				return;
			}

			if (block.PrimaryPart!.GetNetworkOwner() !== player) {
				player.Kick();
				return;
			}

			// temporary until block configuration moved to shared
			radius = math.clamp(radius, 0, 12);
			pressure = math.clamp(pressure, 0, 2500);

			// Explosion
			const explosion = new Instance("Explosion");
			explosion.ExplosionType = Enum.ExplosionType.NoCraters;
			explosion.BlastRadius = radius;
			explosion.BlastPressure = 0;
			explosion.DestroyJointRadiusPercent = 0;
			explosion.Position = block.GetPivot().Position;

			// Flame explosion
			if (isFlammable) {
				const flameExplosion = explosion.Clone();
				flameExplosion.BlastRadius *= 1.5;
				flameExplosion.Parent = Workspace;
				flameExplosion.Hit.Connect((part, distance) => {
					SpreadingFireController.burn(part);
				});
			}

			explosion.Parent = Workspace;
			explosion.Hit.Connect((part, distance) => {
				if (part.Anchored || !part.IsDescendantOf(Workspace.Plots) || part.GetAttribute("Burn")) {
					return;
				}

				if (math.random(1, 2) === 1) {
					part.BreakJoints();
				}

				part.Velocity = new Vector3(
					math.random(0, pressure / 100),
					math.random(0, pressure / 100),
					math.random(0, pressure / 100),
				);
			});

			PartUtils.applyToAllDescendantsOfType("Decal", block.PrimaryPart!, (decal) => {
				decal.Destroy();
			});

			// Explosion sound
			const sound = block.PrimaryPart!.FindFirstChild("Sound") as Sound;
			sound.Play();
			sound.Ended.Once(() => {
				sound.Destroy();
			});
		});
	}
}
