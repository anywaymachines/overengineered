import Signal from "@rbxts/signal";
import { InstanceComponent } from "shared/component/InstanceComponent";

export class SharedPlot extends InstanceComponent<PlotModel> {
	readonly blockAdded = new Signal<(block: BlockModel) => void>();
	readonly blockRemoved = new Signal<(block: BlockModel) => void>();

	readonly ownerId;
	readonly whitelistedPlayers;
	readonly blacklistedPlayers;

	constructor(instance: PlotModel) {
		super(instance);

		this.ownerId = this.event.observableFromAttribute<number>(instance, "ownerid");
		this.whitelistedPlayers = this.event.observableFromAttributeJson<readonly number[]>(instance, "whitelisted");
		this.blacklistedPlayers = this.event.observableFromAttributeJson<readonly number[]>(instance, "blacklisted");
		this.whitelistedPlayers.set([5243461283]);

		const subToBlocks = () => {
			this.event.subscribe(instance.Blocks.ChildAdded, (child) => {
				this.blockAdded.Fire(child as BlockModel);
			});
			this.event.subscribe(instance.Blocks.ChildRemoved, (child) => {
				this.blockRemoved.Fire(child as BlockModel);
			});
		};
		this.event.subscribe(this.instance.ChildAdded, (child) => {
			if (!child.IsA("Model") || child.Name !== "Blocks") {
				return;
			}

			subToBlocks();
		});
		if (this.instance.FindFirstChild("Blocks")) {
			subToBlocks();
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
