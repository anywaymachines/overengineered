import { RunService, Workspace } from "@rbxts/services";
import { InstanceComponent } from "shared/component/InstanceComponent";
import Signal from "shared/event/Signal";
import { AABB } from "shared/fixes/AABB";

export class SharedPlot extends InstanceComponent<PlotModel> {
	/** @client */
	private static readonly _anyChanged = new Signal<(plot: SharedPlot) => void>();
	/** @client */
	static readonly anyChanged = this._anyChanged.asReadonly();

	readonly version;
	readonly ownerId;
	readonly whitelistedPlayers;
	readonly blacklistedPlayers;
	readonly bounds;

	constructor(instance: PlotModel) {
		super(instance);

		this.version = this.event.observableFromAttribute<number>(instance, "version");
		if (RunService.IsClient()) {
			this.version.subscribe(() => SharedPlot._anyChanged.Fire(this));
		}

		this.ownerId = this.event.observableFromAttribute<number>(instance, "ownerid");
		this.whitelistedPlayers = this.event.observableFromAttributeJson<readonly number[]>(instance, "whitelisted");
		this.blacklistedPlayers = this.event.observableFromAttributeJson<readonly number[]>(instance, "blacklisted");
		this.whitelistedPlayers.set([5243461283]);
		this.bounds = SharedPlot.getPlotBuildingRegion(instance);

		if (RunService.IsClient()) {
			const subToBlocks = () => {
				this.event.subscribe(instance.Blocks.ChildAdded, (child) => {
					if (child.IsA("Model")) {
						while (!child.PrimaryPart) {
							task.wait();
						}
					}

					SharedPlot._anyChanged.Fire(this);
				});
				this.event.subscribe(instance.Blocks.ChildRemoved, () => {
					SharedPlot._anyChanged.Fire(this);
				});
			};

			this.instance.ChildAdded.Connect((child) => {
				if (!child.IsA("Model") || child.Name !== "Blocks") {
					return;
				}

				print("sub to blocks");
				subToBlocks();
			});
			if (this.instance.FindFirstChild("Blocks")) {
				subToBlocks();
			}
		}
	}

	/** Returns the {@link AABB} of the plot construction area */
	private static getPlotBuildingRegion(plot: PlotModel): AABB {
		const heightLimit = 400;
		const buildingPlane = plot.PrimaryPart;

		return AABB.fromMinMax(
			new Vector3(
				buildingPlane.Position.X - buildingPlane.Size.X / 2,
				buildingPlane.Position.Y + buildingPlane.Size.Y / 2,
				buildingPlane.Position.Z - buildingPlane.Size.Z / 2,
			),
			new Vector3(
				buildingPlane.Position.X + buildingPlane.Size.X / 2,
				buildingPlane.Position.Y + heightLimit - buildingPlane.Size.Y / 2,
				buildingPlane.Position.Z + buildingPlane.Size.Z / 2,
			),
		);
	}

	getBlocks(): readonly BlockModel[] {
		return this.instance.Blocks.GetChildren(undefined);
	}

	/** Is the provided `Instance` is a plot model */
	static isPlot(model: Instance | undefined): model is PlotModel {
		return model?.Parent === Workspace.Plots;
	}

	/** Is the provided instance a block on this plot */
	hasBlock(instance: BlockModel | BasePart): boolean {
		if (!instance) {
			return false;
		}

		const fastcheck = instance.IsA("Model") ? instance.Parent?.Parent : undefined;
		if (fastcheck && SharedPlot.isPlot(fastcheck)) {
			return true;
		}

		let parent = instance.Parent;
		while (parent) {
			if (SharedPlot.isPlot(parent)) {
				return true;
			}

			parent = parent.Parent;
		}

		return false;
	}

	/** Is player allowed to build on this plot */
	isBuildingAllowed(player: Player): boolean {
		return this.ownerId.get() === player.UserId || this.whitelistedPlayers.get()?.includes(player.UserId) === true;
	}

	/** Is model fully inside this plot */
	isModelInside(model: Model, pivot?: CFrame): boolean {
		const modelRegion = AABB.fromModel(model, pivot).withSize((s) => s.mul(0.99));
		return this.bounds.contains(modelRegion);
	}
}
