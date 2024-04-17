import { Debris, Workspace } from "@rbxts/services";
import { LocalPlayerController } from "client/controller/LocalPlayerController";
import { RemoteEvents } from "shared/RemoteEvents";

const initKillPlane = (instance: BasePart, onTouch?: (part: BasePart) => void) => {
	instance.Touched.Connect((part) => {
		const player = LocalPlayerController.humanoid?.Parent;
		if (player) {
			let parent: Instance = part;
			while (true as boolean) {
				if (parent === player) return;

				const nextparent = parent.Parent;
				if (!nextparent) break;

				parent = nextparent;
			}
		}

		part.BreakJoints();
		Debris.AddItem(part, 10);

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
