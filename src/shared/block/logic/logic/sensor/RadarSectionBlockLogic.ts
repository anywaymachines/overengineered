import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { RobloxUnit } from "shared/RobloxUnit";
import { VectorUtils } from "shared/utils/VectorUtils";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class RadarSectionBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.radarsection> {
	private triggerDistanceListUpdate: boolean = false;
	private closestDetectedPart: BasePart | undefined = undefined;
	private readonly allTouchedBlocks: Set<BasePart> = new Set<BasePart>();

	private getDistanceTo = (part: BasePart) => {
		if (this.instance === undefined) return Vector3.zero;
		if (part === undefined) return Vector3.zero;
		return VectorUtils.apply(part.GetPivot().Position.sub(this.instance.GetPivot().Position), (v) =>
			RobloxUnit.Studs_To_Meters(v),
		);
		//bring back relative positioning if needed vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
		/* 
		return VectorUtils.apply(this.instance.GetPivot().ToObjectSpace(part.GetPivot()).Position, (v) =>
			RobloxUnit.Studs_To_Meters(v),
		);*/
	};

	private findClosestPart() {
		let smallestDistance: number | undefined;
		let closestPart: BasePart | undefined;
		const minDist = this.input.minimalDistance.get();
		for (const bp of this.allTouchedBlocks) {
			const d = this.getDistanceTo(bp).Magnitude;

			if (smallestDistance === undefined) {
				[smallestDistance, closestPart] = [d, bp];
				continue;
			}

			if (d > smallestDistance || d < minDist) continue;
			[smallestDistance, closestPart] = [d, bp];
		}
		return closestPart;
	}

	tick(tick: number): void {
		super.tick(tick);

		if (this.closestDetectedPart?.Parent === undefined || this.triggerDistanceListUpdate) {
			this.triggerDistanceListUpdate = false;
			this.closestDetectedPart = this.findClosestPart();
		}

		this.output.distance.set(
			this.closestDetectedPart ? this.getDistanceTo(this.closestDetectedPart) : Vector3.zero,
		);
	}

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.radarsection);

		const view = this.instance.WaitForChild("RadarView");
		const metalPlate = this.instance.WaitForChild("MetalPlate");
		const maxDist = blockConfigRegistry.radarsection.input.maxDistance.max;
		const halvedMaxDist = maxDist / 2;

		if (!view) return;
		if (!view.IsA("BasePart")) return;

		if (!metalPlate) return;
		if (!metalPlate.IsA("BasePart")) return;

		const updateDistance = (detectionSize: number) => {
			const md = this.input.maxDistance.get();
			const ds = detectionSize * (detectionSize - math.sqrt(halvedMaxDist / (md + halvedMaxDist))) * 10;
			view.Size = new Vector3(ds, view.Size.Y, ds);
			this.triggerDistanceListUpdate = true;
		};

		this.event.subscribeObservable(this.input.visibility, (state) => {
			view.Transparency = state ? 0.8 : 1;
		});

		this.event.subscribeObservable(this.input.detectionSize, updateDistance);

		this.event.subscribeObservable(this.input.maxDistance, (maxDistance) => {
			const sizeStuds = RobloxUnit.Meters_To_Studs(maxDistance);
			const pivo = metalPlate.GetPivot();
			view.Position = pivo.PointToWorldSpace(Vector3.xAxis.mul(sizeStuds / 2 + 0.5));
			view.Size = new Vector3(view.Size.X, sizeStuds, view.Size.Z);
			updateDistance(this.input.detectionSize.get());
		});

		this.event.subscribe(view.Touched, (part) => {
			if (part.HasTag("RADARVIEW")) return;
			if (this.getDistanceTo(part).Magnitude < this.input.minimalDistance.get()) return;
			this.allTouchedBlocks.add(part);
			if (this.closestDetectedPart === undefined) return (this.closestDetectedPart = part);
			this.triggerDistanceListUpdate = true;
		});

		this.event.subscribe(view.TouchEnded, (part) => {
			this.allTouchedBlocks.delete(part);
			this.triggerDistanceListUpdate = part === this.closestDetectedPart;
		});

		this.onDescendantDestroyed(() => {
			if (view) view.Transparency = 1;
			this.allTouchedBlocks.clear();
			this.disable();
		});
	}
}
