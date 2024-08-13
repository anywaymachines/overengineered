import { Players, Workspace } from "@rbxts/services";
import { Component } from "shared/component/Component";
import { BB } from "shared/fixes/BB";
import type { SharedPlot } from "shared/building/SharedPlot";
import type { SharedPlots } from "shared/building/SharedPlots";

@injectable
export class EnvBlacklistsController extends Component {
	private readonly blacklistInstances: Map<BasePart, BasePart> = new Map();

	constructor(@inject ownPlot: SharedPlot, @inject plots: SharedPlots) {
		super();

		const update = (plot: BasePart, isBanned: boolean) => {
			if (isBanned && !this.blacklistInstances.has(plot)) {
				const shadowPart = new Instance("Part");
				shadowPart.Anchored = true;
				shadowPart.CastShadow = false;
				shadowPart.Size = new Vector3(plot.Size.X, 400, plot.Size.Z);
				shadowPart.Position = plot.Position.add(new Vector3(0, 100, 0));
				shadowPart.Color = new Color3(0.15, 0.15, 0.15);
				shadowPart.Parent = Workspace.FindFirstChild("Obstacles");

				this.blacklistInstances.set(plot, shadowPart);

				shadowPart.Touched.Connect((hit) => {
					if (Players.LocalPlayer.Character) {
						if (
							!hit.IsDescendantOf(Players.LocalPlayer.Character) &&
							!hit.IsDescendantOf(ownPlot.instance)
						) {
							return;
						}
					} else if (!hit.IsDescendantOf(ownPlot.instance)) {
						return;
					}

					if (
						!BB.fromPart(shadowPart)
							.withSize((s) => s.mul(new Vector3(0.9, 1, 0.9)))
							.isPointInside(hit.Position)
					) {
						return;
					}

					hit.PivotTo(new CFrame(ownPlot.getSpawnPosition().add(new Vector3(0, 5, 0))));
					hit.AssemblyLinearVelocity = Vector3.zero;
					hit.AssemblyAngularVelocity = Vector3.zero;
				});
			} else if (!isBanned && this.blacklistInstances.has(plot)) {
				const shadowPart = this.blacklistInstances.get(plot)!;
				this.blacklistInstances.delete(plot);
				shadowPart.Destroy();
			}
		};

		for (const plot of plots.plots) {
			if (plot === ownPlot) continue;

			this.event.subscribeObservable(
				plot.blacklistedPlayers,
				(blacklist) => {
					if (!blacklist) return;

					update(plot.instance.BuildingArea, blacklist.includes(Players.LocalPlayer.UserId));

					// const oldBlacklist = plot.plot.blacklistedPlayers.get() ?? [];
					// const diff = [
					// 	...oldBlacklist.filter((value) => !newBlacklist.includes(value)),
					// 	...newBlacklist.filter((value) => !oldBlacklist.includes(value)),
					// ];

					// for (const userId of diff) {
					// 	const plr = Players.GetPlayerByUserId(userId);
					// 	if (!plr) continue;

					// 	CustomRemotes.environment.blacklistUpdate.send(plr, {
					// 		isBanned: newBlacklist.includes(userId),
					// 		plot: plot.plot.instance.BuildingArea,
					// 	});
					// }
				},
				true,
			);
		}

		// CustomRemotes.environment.blacklistUpdate.invoked.Connect((data) => update(data.plot, data.isBanned));
	}
}
