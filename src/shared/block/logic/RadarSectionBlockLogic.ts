import { RunService } from "@rbxts/services";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export class RadarSectionBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.radarsection> {
	private closestDetectedPart: BasePart | undefined;

	private getDistanceTo(part: BasePart) {
		if (!this.closestDetectedPart) return -1;
		return this.instance.GetPivot().Position.sub(part.Position).Magnitude;
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
		print(view.Size);

		this.event.subscribe(RunService.Heartbeat, () => {
			if (!this.closestDetectedPart) return;
			this.output.distance.set(this.closestDetectedPart.Position.sub(view.Position).Magnitude);
		});

		this.event.subscribeObservable(this.input.detectionSize, (detectionSize) => {
			view.Size = new Vector3(detectionSize, view.Size.Y, detectionSize);
		});

		this.event.subscribeObservable(this.input.maxDistance, (maxDistance) => {
			const halfDistance = maxDistance / 2;
			view.Size = new Vector3(view.Size.X, halfDistance, view.Size.Z);
			view.Position = this.block.instance.GetPivot().Position.sub(new Vector3(0, halfDistance, 0));
		});

		this.event.subscribe(view.Touched, (part) => {
			if (!this.closestDetectedPart) return (this.closestDetectedPart = part);
			if (this.getDistanceTo(part) < this.getDistanceTo(this.closestDetectedPart))
				this.closestDetectedPart = part;
		});

		this.event.subscribe(view.TouchEnded, (part) => {
			if (part !== this.closestDetectedPart) return;
			this.closestDetectedPart = undefined;
			this.output.distance.set(-1);
		});

		this.onDescendantDestroyed(() => {
			this.disable();
		});
	}
}
