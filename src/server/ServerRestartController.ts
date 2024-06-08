import { MessagingService, Players, RunService, Workspace } from "@rbxts/services";
import { registerOnRemoteEvent } from "server/network/event/RemoteHandler";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { SpreadingFireController } from "server/SpreadingFireController";
import { BlockManager } from "shared/building/BlockManager";
import { HostedService } from "shared/GameHost";
import { RemoteEvents } from "shared/RemoteEvents";
import { Remotes } from "shared/Remotes";
import { ReplicatedAssets } from "shared/ReplicatedAssets";
import { PartUtils } from "shared/utils/PartUtils";

export class ServerRestartController extends HostedService {
	constructor() {
		super();

		this.onEnable(() => {
			task.spawn(() => {
				this.event.eventHandler.register(MessagingService.SubscribeAsync("Restart", () => this.restart(true)));
			});

			registerOnRemoteEvent("Admin", "Restart", () => this.restart(false));
		});
	}

	restart(networkReceived: boolean) {
		if (!networkReceived && !RunService.IsStudio()) {
			task.spawn(() => {
				MessagingService.PublishAsync("Restart", undefined);
			});
		}

		const maxTime = 30;
		let timePassed = 0;
		const meteorsSpawnChance = 0.3;
		const meteorSpeed = new Vector3(math.random(150, 600), math.random(-750, -200), math.random(150, 600));
		const meteor = new Instance("Part");
		meteor.Material = Enum.Material.CrackedLava;
		meteor.Color = Color3.fromRGB(255, 0, 0);
		meteor.Shape = Enum.PartType.Ball;

		const textStartColor = Color3.fromRGB(255, 255, 255);
		const textEndColor = Color3.fromRGB(255, 0, 0);
		let progress = timePassed / maxTime;

		task.spawn(() => {
			let timeLeft = maxTime;

			while (true as boolean) {
				if (timeLeft <= 1) {
					Players.GetPlayers().forEach((p) => p.Kick("Got boned!"));
					task.wait(1);
					continue;
				}

				// if (timeLeft % 10 === 0 || timeLeft < 10) {
				// 	Remotes.Server.GetNamespace("Admin")
				// 		.Get("SendMessage")
				// 		.SendToAllPlayers(
				// 			`YOU ARE GOING TO BAD TO THE BONE IN ${timeLeft}...`,
				// 			textStartColor.Lerp(textEndColor, progress),
				// 			0.5,
				// 		);
				// }

				task.wait(1);
				timeLeft--;
			}
		});

		RunService.Heartbeat.Connect((dt) => {
			timePassed += dt;
			progress = timePassed / maxTime;
			Remotes.Server.Get("ServerRestartProgress").SendToAllPlayers(progress);
			const pl = Players.GetPlayers();
			pl.forEach((p) => {
				const pos = p.Character?.GetPivot();
				if (!pos) return;
				const newChance = meteorsSpawnChance * pl.size();
				if (math.random() <= newChance / (1 + progress)) {
					const sz = 5 - (math.random() - 0.5) * 2;
					const clone = meteor.Clone();
					clone.Size = new Vector3(sz, sz, sz);
					clone.Position = pos.Position.add(
						new Vector3(math.random(-1500, 1500), math.random(150, 500), math.random(-1500, 1500)),
					);
					clone.Parent = Workspace;
					clone.AssemblyLinearVelocity = meteorSpeed;
					for (const child of ReplicatedAssets.get<{
						Effects: { Fire: Folder };
					}>().Effects.Fire.GetChildren()) {
						child.Clone().Parent = clone;
					}

					clone.Touched.Connect(() => explode(clone, true, 123456, 456));
				}
			});
		});

		const explode = (part: BasePart, isFlammable: boolean, pressure: number, radius: number) => {
			radius = math.clamp(radius, 0, 16);
			pressure = math.clamp(pressure, 0, 2500);

			const hitParts = Workspace.GetPartBoundsInRadius(part.Position, radius);

			if (isFlammable) {
				const flameHitParts = Workspace.GetPartBoundsInRadius(part.Position, radius * 1.5);

				flameHitParts.forEach((part) => {
					if (math.random(1, 3) === 1) SpreadingFireController.burn(part);
				});
			}

			hitParts.forEach((part) => {
				if (!BlockManager.isActiveBlockPart(part)) {
					return;
				}

				if (math.random(1, 2) === 1) {
					ServerPartUtils.BreakJoints(part);
				}

				part.Velocity = new Vector3(
					math.random(0, pressure / 40),
					math.random(0, pressure / 40),
					math.random(0, pressure / 40),
				);
			});

			part.Transparency = 1;
			PartUtils.applyToAllDescendantsOfType("Decal", part, (decal) => {
				decal.Destroy();
			});

			// Explosion sound
			RemoteEvents.Effects.Explosion.send("everyone", {
				part: part,
				index: undefined,
			});
		};
	}
}
