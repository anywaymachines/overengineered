import { RunService, Workspace } from "@rbxts/services";
import { BlockManager, PlacedBlockData } from "shared/building/BlockManager";
import { InstanceComponent } from "shared/component/InstanceComponent";
import { Signal } from "shared/event/Signal";
import { AABB } from "shared/fixes/AABB";

export class SharedPlot extends InstanceComponent<PlotModel> {
	/** @client */
	private static readonly _anyChanged = new Signal<(plot: SharedPlot) => void>();
	/** @client */
	static readonly anyChanged = this._anyChanged.asReadonly();

	/** @client */
	readonly changed = new Signal();

	readonly version;
	readonly ownerId;
	readonly whitelistedPlayers;
	readonly blacklistedPlayers;
	readonly bounds;

	constructor(instance: PlotModel) {
		super(instance);

		this.changed.Connect(() => SharedPlot._anyChanged.Fire(this));

		this.version = this.event.observableFromAttribute<number>(instance, "version");
		if (RunService.IsClient()) {
			this.version.subscribe(() => this.changed.Fire());
		}

		this.ownerId = this.event.observableFromAttribute<number>(instance, "ownerid");
		this.whitelistedPlayers = this.event.observableFromAttributeJson<readonly number[]>(instance, "whitelisted");
		this.blacklistedPlayers = this.event.observableFromAttributeJson<readonly number[]>(instance, "blacklisted");
		this.whitelistedPlayers.set([5243461283]);
		this.bounds = SharedPlot.getPlotBuildingRegion(instance);
	}

	/** Returns the {@link AABB} of the plot construction area */
	private static getPlotBuildingRegion(plot: PlotModel): AABB {
		const heightLimit = 400;
		const buildingPlane = plot.BuildingArea;

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
		).withSize((s) => new Vector3(s.X + 0.02, s.Y + 0.02, s.Z + 0.02));
	}

	getBlockDatas(): readonly PlacedBlockData[] {
		return this.getBlocks().map(BlockManager.getBlockDataByBlockModel);
	}
	getBlocks(): readonly BlockModel[] {
		return this.instance.Blocks.GetChildren(undefined);
	}
	getBlock(uuid: BlockUuid): BlockModel {
		return (this.instance.Blocks as unknown as Record<BlockUuid, BlockModel>)[uuid];
	}

	getSpawnPosition() {
		return this.instance.BuildingArea.GetPivot().Position.add(
			new Vector3(this.instance.BuildingArea.ExtentsSize.X / 2 + 2, 10, 0),
		);
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
		const modelRegion = AABB.fromModel(model, pivot);
		return this.bounds.contains(modelRegion);
	}
}
