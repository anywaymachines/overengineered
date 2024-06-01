import { Workspace } from "@rbxts/services";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { RobloxUnit } from "shared/RobloxUnit";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class RadarSectionBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.radarsection> {
	private closestDetectedPart: BasePart | undefined = undefined;
	private readonly allTouchedBlocks: Set<BasePart> = new Set<BasePart>();

	private getDistanceTo(part: BasePart) {
		if (!this.closestDetectedPart) return -1;
		if (!part.IsDescendantOf(Workspace)) return;
		return this.instance.GetPivot().Position.sub(part.Position).Magnitude;
	}

	private getClosestPart() {
		const pos = this.block.instance.GetPivot().Position;
		let smallestDistance: number | undefined;
		let closestPart: BasePart | undefined;
		for (const bp of this.allTouchedBlocks) {
			const d = this.getDistanceTo(bp);
			if (d === undefined) {
				this.allTouchedBlocks.delete(bp);
				continue;
			}

			if (smallestDistance === undefined || d < smallestDistance) [smallestDistance, closestPart] = [d, bp];
		}
		return closestPart;
	}

	tick(tick: number): void {
		super.tick(tick);

		if (this.closestDetectedPart !== undefined)
			this.output.distance.set(RobloxUnit.Studs_To_Meters(this.getDistanceTo(this.closestDetectedPart) ?? -1));
	}

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.radarsection);

		const maxDist = blockConfigRegistry.radarsection.input.maxDistance.max;
		const halvedMaxDist = maxDist / 2;

		const view = this.instance.WaitForChild("RadarView");
		if (!view) return;
		if (!view.IsA("BasePart")) return;

		view.Size = new Vector3(
			this.input.detectionSize.get(),
			this.input.maxDistance.get(),
			this.input.detectionSize.get(),
		);

		const updateDistance = (detectionSize: number) => {
			const md = this.input.maxDistance.get();
			const ds = detectionSize * (detectionSize - math.sqrt(halvedMaxDist / (md + halvedMaxDist)));
			view.Size = new Vector3(ds, view.Size.Y, ds);
		};

		this.event.subscribeObservable(this.input.visibility, (state) => {
			view.Transparency = state ? 0.8 : 1;
		});

		this.event.subscribeObservable(this.input.detectionSize, updateDistance);

		this.event.subscribeObservable(this.input.maxDistance, (maxDistance) => {
			const halfDistance = maxDistance / 2;
			view.Size = new Vector3(view.Size.X, halfDistance, view.Size.Z);
			updateDistance(this.input.detectionSize.get());
		});

		this.event.subscribe(view.Touched, (part) => {
			if (part.CollisionGroup !== "Blocks") return;
			this.allTouchedBlocks.add(part);
			if (!this.closestDetectedPart) return (this.closestDetectedPart = part);
			const d1 = this.getDistanceTo(part);
			const d2 = this.getDistanceTo(this.closestDetectedPart);
			if (d1 === undefined) return;
			if (d2 === undefined) return (this.closestDetectedPart = part);
			if (d1 > d2) return;
			this.closestDetectedPart = part;
		});

		this.event.subscribe(view.TouchEnded, (part) => {
			this.allTouchedBlocks.delete(part);
			if (part !== this.closestDetectedPart) return;
			if ((this.closestDetectedPart = this.getClosestPart()) === undefined) this.output.distance.set(-1);
		});

		this.onDescendantDestroyed(() => {
			if (view) view.Transparency = 1;
			this.disable();
		});
	}
}
