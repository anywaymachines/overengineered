import { Workspace } from "@rbxts/services";
import { LocalPlayerController } from "client/controller/LocalPlayerController";
import { RemoteEvents } from "shared/RemoteEvents";
import { CustomDebrisService } from "shared/service/CustomDebrisService";

const initKillPlane = (instance: BasePart, onTouch?: (part: BasePart) => void) => {
	instance.Touched.Connect((part) => {
		let parent: Instance = part;
		while (true as boolean) {
			if (parent.FindFirstChild("Humanoid")) {
				const human = parent.WaitForChild("Humanoid") as Humanoid | undefined;
				if (human && human === LocalPlayerController.humanoid) {
					human.Health -= human.MaxHealth * 0.1;
				}

				return;
			}

			const nextparent = parent.Parent;
			if (!nextparent) break;

			parent = nextparent;
		}

		part.BreakJoints();
		CustomDebrisService.set(part, math.random(20, 60));

		onTouch?.(part);
	});
};

const obstacles = Workspace.WaitForChild("Obstacles") as Folder;

const lava = obstacles.WaitForChild("Ramps").WaitForChild("lava") as BasePart;
initKillPlane(lava, (part) => {
	RemoteEvents.Burn.send([part]);
	part.AssemblyLinearVelocity = part.AssemblyLinearVelocity.add(
		new Vector3(math.random() * 18 - 6, 25, math.random() * 18 - 6),
	);
});

initKillPlane(obstacles.WaitForChild("Crashing Wheels Course").WaitForChild("Breaker") as BasePart);
