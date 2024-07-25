import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { RobloxUnit } from "shared/RobloxUnit";
import { VectorUtils } from "shared/utils/VectorUtils";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class RadarSectionBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.radarsection> {
	private closestDetectedPart: BasePart | undefined = undefined;
	private readonly allTouchedBlocks: Set<BasePart> = new Set<BasePart>();
	private getDistanceTo = (part: BasePart) => {
		if (this.instance === undefined) return Vector3.zero;
		if (part === undefined) return Vector3.zero;
		return VectorUtils.apply(this.instance.GetPivot().ToObjectSpace(part.GetPivot()).Position, (v) =>
			RobloxUnit.Studs_To_Meters(v),
		);
	};

	private findClosestPart() {
		let smallestDistance: number | undefined;
		let closestPart: BasePart | undefined;
		for (const bp of this.allTouchedBlocks) {
			const d = this.getDistanceTo(bp).Magnitude;
			if (bp?.Parent === undefined) {
				this.allTouchedBlocks.delete(bp);
				continue;
			}

			if (smallestDistance === undefined) {
				[smallestDistance, closestPart] = [d, bp];
				continue;
			}

			if (d > smallestDistance) continue;
			if (d < this.input.minimalDistance.get()) continue;
			[smallestDistance, closestPart] = [d, bp];
		}
		return closestPart;
	}

	private isCloser(part: BasePart) {
		const d1 = this.getDistanceTo(part)?.Magnitude;
		if (d1 < this.input.minimalDistance.get()) return false;
		const d2 = this.getDistanceTo(this.closestDetectedPart!)?.Magnitude;
		return d1 < d2;
	}

	tick(tick: number): void {
		super.tick(tick);

		if (this.closestDetectedPart === undefined) return;
		if (this.closestDetectedPart?.Parent === undefined) this.closestDetectedPart = this.findClosestPart();
		this.output.distance.set(this.getDistanceTo(this.closestDetectedPart!) ?? Vector3.zero);
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
		/*
		this.event.subscribeObservable(this.input.angleOffset, (angle, prev) => {
			const maxAngle = 45;
			prev = new Vector3(
				math.clamp(prev.X, -maxAngle, maxAngle),
				math.clamp(prev.Y, -maxAngle, maxAngle),
				math.clamp(prev.Z, -maxAngle, maxAngle),
			);
			angle = new Vector3(
				math.clamp(angle.X, -maxAngle, maxAngle),
				math.clamp(angle.Y, -maxAngle, maxAngle),
				math.clamp(angle.Z, -maxAngle, maxAngle),
			);

			view.Rotation = view.Rotation.sub(prev).add(angle);
			this.justMoved = true;
		});
		*/
		this.event.subscribe(view.Touched, (part) => {
			if (part.CollisionGroup !== "Blocks") return;
			if (part.HasTag("RADARVIEW")) return;
			//if (part.IsDescendantOf(this.instance)) return; //removed check because never going to happen
			if (this.getDistanceTo(part).Magnitude < this.input.minimalDistance.get()) return;
			this.allTouchedBlocks.add(part);
			if (this.closestDetectedPart === undefined) return (this.closestDetectedPart = part);
			if (!this.isCloser(part)) return;
			this.closestDetectedPart = part;
		});

		this.event.subscribe(view.TouchEnded, (part) => {
			this.allTouchedBlocks.delete(part);
			if (part !== this.closestDetectedPart) return;
			this.closestDetectedPart = this.findClosestPart();
			this.output.distance.set(
				this.closestDetectedPart ? this.getDistanceTo(this.closestDetectedPart) : Vector3.zero,
			);
		});

		this.onDescendantDestroyed(() => {
			if (view) view.Transparency = 1;
			this.disable();
		});
	}
}
