import { RunService } from "@rbxts/services";
import { InstanceComponent } from "shared/component/InstanceComponent";
import Signal from "shared/event/Signal";

export class SharedPlot extends InstanceComponent<PlotModel> {
	/** @client */
	private static readonly _anyChanged = new Signal<(plot: SharedPlot) => void>();
	/** @client */
	static readonly anyChanged = this._anyChanged.asReadonly();

	readonly version;
	readonly ownerId;
	readonly whitelistedPlayers;
	readonly blacklistedPlayers;

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

	getBlocks(): readonly BlockModel[] {
		return this.instance.Blocks.GetChildren(undefined);
	}

	/** Is player allowed to build on this plot */
	isBuildingAllowed(player: Player): boolean {
		return this.ownerId.get() === player.UserId || this.whitelistedPlayers.get()?.includes(player.UserId) === true;
	}
}
