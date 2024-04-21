import { Players, RunService, Workspace } from "@rbxts/services";
import { RemoteEvents } from "shared/RemoteEvents";
import { Remotes } from "shared/Remotes";

export namespace ServerRestartController {
	export function restart() {
		const maxTime = 30;
		let timePassed = 0;

		const meteorsSpawnChance = 0.6;
		const meteorSpeed = new Vector3(math.random(150, 600), math.random(-250, -700), math.random(150, 600));
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
				if (timeLeft <= 1) Players.GetPlayers().forEach((p) => p.Kick("Got boned!"));
				Remotes.Server.GetNamespace("Admin")
					.Get("SendMessage")
					.SendToAllPlayers(
						`YOU ARE GOING TO BAD TO THE BONE IN ${timeLeft--}...`,
						textStartColor.Lerp(textEndColor, progress),
						0.5,
					);
				task.wait(1);
			}
		});

		RunService.Heartbeat.Connect((dt) => {
			timePassed += dt;
			progress = timePassed / maxTime;
			Remotes.Server.Get("ServerRestartProgress").SendToAllPlayers(progress);
			Players.GetPlayers().forEach((p) => {
				const pos = p.Character?.GetPivot();
				if (!pos) return;
				if (math.random() <= math.max(meteorsSpawnChance / progress, meteorsSpawnChance)) {
					const sz = 5 - (math.random() - 0.5) * 2;
					const clone = meteor.Clone();
					clone.Size = new Vector3(sz, sz, sz);
					clone.Position = pos.Position.add(
						new Vector3(math.random(-1500, 1500), math.random(150, 500), math.random(-1500, 1500)),
					);
					clone.Parent = Workspace;
					clone.AssemblyLinearVelocity = meteorSpeed;
					RemoteEvents.Burn.send([clone]);
					task.delay(10, () => clone.Destroy());
				}
			});
		});
	}
}
