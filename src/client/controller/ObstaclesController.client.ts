import { CollectionService, Workspace } from "@rbxts/services";
import { LocalPlayer } from "client/controller/LocalPlayer";
import { RemoteEvents } from "shared/RemoteEvents";
import { CustomDebrisService } from "shared/service/CustomDebrisService";

const initKillPlane = (instance: BasePart, onTouch?: (part: BasePart) => void) => {
	instance.Touched.Connect((part) => {
		let parent: Instance = part;
		while (true as boolean) {
			if (parent.FindFirstChild("Humanoid")) {
				const human = parent.WaitForChild("Humanoid") as Humanoid | undefined;
				if (human && human === LocalPlayer.humanoid.get()) {
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

Workspace.WaitForChild("Obstacles");

for (const lava of CollectionService.GetTagged("Lava")) {
	if (!lava.IsA("BasePart")) continue;

	initKillPlane(lava, (part) => {
		RemoteEvents.Burn.send([part]);
		part.AssemblyLinearVelocity = part.AssemblyLinearVelocity.add(
			new Vector3(math.random() * 18 - 6, 25, math.random() * 18 - 6),
		);
	});
}

for (const destroyer of CollectionService.GetTagged("Destroyer")) {
	if (!destroyer.IsA("BasePart")) continue;
	initKillPlane(destroyer);
}
