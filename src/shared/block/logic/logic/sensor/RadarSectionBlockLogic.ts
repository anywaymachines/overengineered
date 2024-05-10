import { RunService } from "@rbxts/services";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export class RadarSectionBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.radarsection> {
	private closestDetectedPart: BasePart | undefined = undefined;
	private readonly allTouchedBlocks: Set<BasePart> = new Set<BasePart>();

	private getDistanceTo(part: BasePart) {
		if (!this.closestDetectedPart) return -1;
		return this.instance.GetPivot().Position.sub(part.Position).Magnitude;
	}

	private getClosestPart() {
		const pos = this.block.instance.GetPivot().Position;
		let smallestDistance: number | undefined;
		let closestPart: BasePart | undefined;
		for (const bp of this.allTouchedBlocks) {
			const d = this.getDistanceTo(bp);
			if (smallestDistance === undefined || d < smallestDistance) [smallestDistance, closestPart] = [d, bp];
		}
		return closestPart;
	}

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.radarsection);

		const view = this.instance.WaitForChild("RadarView");
		if (!view) return;
		if (!view.IsA("BasePart")) return;

		view.Size = new Vector3(
			this.input.detectionSize.get(),
			this.input.maxDistance.get(),
			this.input.detectionSize.get(),
		);

		this.event.subscribe(RunService.Heartbeat, () => {
			if (this.closestDetectedPart === undefined) return;
			this.output.distance.set(this.getDistanceTo(this.closestDetectedPart));
		});

		this.event.subscribeObservable(this.input.visibility, (state) => {
			view.Transparency = state ? 0.8 : 1;
		});

		this.event.subscribeObservable(this.input.detectionSize, (detectionSize) => {
			view.Size = new Vector3(detectionSize, view.Size.Y, detectionSize);
		});

		this.event.subscribeObservable(this.input.maxDistance, (maxDistance) => {
			const halfDistance = maxDistance / 2;
			view.Size = new Vector3(view.Size.X, halfDistance, view.Size.Z);
		});

		this.event.subscribe(view.Touched, (part) => {
			if (part.CollisionGroup !== "Blocks") return;
			this.allTouchedBlocks.add(part);
			if (!this.closestDetectedPart) return (this.closestDetectedPart = part);
			if (this.getDistanceTo(part) > this.getDistanceTo(this.closestDetectedPart)) return;
			this.closestDetectedPart = part;
		});

		this.event.subscribe(view.TouchEnded, (part) => {
			this.allTouchedBlocks.delete(part);
			if (part !== this.closestDetectedPart) return;
			if ((this.closestDetectedPart = this.getClosestPart()) === undefined) this.output.distance.set(-1);
		});

		this.onDescendantDestroyed(() => {
			this.disable();
		});
	}
}
