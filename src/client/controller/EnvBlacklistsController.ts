import { Workspace } from "@rbxts/services";
import { Component } from "shared/component/Component";
import { CustomRemotes } from "shared/Remotes";

export class EnvBlacklistsController extends Component {
	private readonly blacklistInstances: Map<BasePart, BasePart> = new Map();

	constructor() {
		super();

		CustomRemotes.environment.blacklistUpdate.invoked.Connect((data) => {
			if (data.isBanned && !this.blacklistInstances.has(data.plot)) {
				const shadowPart = new Instance("Part");
				shadowPart.Anchored = true;
				shadowPart.CastShadow = false;
				shadowPart.Size = new Vector3(data.plot.Size.X, 200, data.plot.Size.Z);
				shadowPart.Position = data.plot.Position.add(new Vector3(0, 100, 0));
				shadowPart.Color = new Color3(0.15, 0.15, 0.15);
				shadowPart.Parent = Workspace.FindFirstChild("Obstacles");

				this.blacklistInstances.set(data.plot, shadowPart);

				// shadowPart.Touched.Connect((hit) => {
				// 	// TODO: Teleport away blocks of player and player
				// });
			} else if (!data.isBanned && this.blacklistInstances.has(data.plot)) {
				const shadowPart = this.blacklistInstances.get(data.plot)!;
				this.blacklistInstances.delete(data.plot);
				shadowPart.Destroy();
			}
		});
	}
}
