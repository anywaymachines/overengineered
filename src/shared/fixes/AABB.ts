import VectorUtils from "shared/utils/VectorUtils";

interface CenterSizeData {
	readonly center: Vector3;
	readonly size: Vector3;
}
interface MinMaxData {
	readonly min: Vector3;
	readonly max: Vector3;
}

/** Lazily initialized immutable {@link https://wikipedia.org/wiki/AABB Axis-Aligned Bounding Box} */
export class AABB {
	private centerSizeData?: CenterSizeData;
	private minMaxData?: MinMaxData;

	/** Get the {@link AABB} of a model */
	static fromModel(block: Model): AABB {
		const [cf, size] = block.GetBoundingBox();
		const sx = size.X;
		const sy = size.Y;
		const sz = size.Z;

		const [x, y, z, R00, R01, R02, R10, R11, R12, R20, R21, R22] = cf.GetComponents();

		const wsx = 0.5 * (math.abs(R00) * sx + math.abs(R01) * sy + math.abs(R02) * sz);
		const wsy = 0.5 * (math.abs(R10) * sx + math.abs(R11) * sy + math.abs(R12) * sz);
		const wsz = 0.5 * (math.abs(R20) * sx + math.abs(R21) * sy + math.abs(R22) * sz);
		return this.fromMinMax(new Vector3(x - wsx, y - wsy, z - wsz), new Vector3(x + wsx, y + wsy, z + wsz));
	}
	/** Create an {@link AABB} that contains all of the provided models */
	static fromModels(models: readonly Model[]): AABB {
		return this.combine(models.map((m) => this.fromModel(m)));
	}
	/** Create an {@link AABB} that contains all of the provided {@link AABB}s */
	static combine(regions: readonly AABB[]): AABB {
		const min = (v1: Vector3, v2: Vector3): Vector3 =>
			new Vector3(math.min(v1.X, v2.X), math.min(v1.Y, v2.Y), math.min(v1.Z, v2.Z));
		const max = (v1: Vector3, v2: Vector3): Vector3 =>
			new Vector3(math.max(v1.X, v2.X), math.max(v1.Y, v2.Y), math.max(v1.Z, v2.Z));

		let minpos = new Vector3(math.huge, math.huge, math.huge);
		let maxpos = new Vector3(-math.huge, -math.huge, -math.huge);

		for (const rg of regions) {
			minpos = min(minpos, rg.getMin());
			maxpos = max(maxpos, rg.getMax());
		}

		return this.fromMinMax(minpos, maxpos);
	}

	/** Create an {@link AABB} from the center position and a size */
	static fromCenterSize(center: Vector3, size: Vector3): AABB {
		return new AABB({ center, size });
	}
	/** Create an {@link AABB} from the minimum and the maximum positions */
	static fromMinMax(min: Vector3, max: Vector3): AABB {
		[min, max] = [
			new Vector3(math.min(min.X, max.X), math.min(min.Y, max.Y), math.min(min.Z, max.Z)),
			new Vector3(math.max(min.X, max.X), math.max(min.Y, max.Y), math.max(min.Z, max.Z)),
		];
		return new AABB({ min, max });
	}

	private constructor(data: CenterSizeData | MinMaxData) {
		if ("min" in data) {
			this.minMaxData = data;
		} else {
			this.centerSizeData = data;
		}

		setmetatable(this, {
			...(getmetatable(this) ?? {}),
			__tostring: (tis) => `AABB{ center: { ${tis.getCenter()} }, size: { ${tis.getSize()} } }`,
		});
	}

	private getCenterSizeData(): CenterSizeData {
		if (this.centerSizeData) {
			return this.centerSizeData;
		}

		if (!this.minMaxData) {
			throw "Invalid AABB state";
		}

		const size = this.minMaxData.max.sub(this.minMaxData.min);
		const center = this.minMaxData.min.add(size.div(2));
		return (this.centerSizeData = { center, size });
	}
	/** Get the center point of the {@link AABB} */
	getCenter(): Vector3 {
		return this.getCenterSizeData().center;
	}
	/** Get the size of the {@link AABB} */
	getSize(): Vector3 {
		return this.getCenterSizeData().size;
	}

	private getMinMaxData(): MinMaxData {
		if (this.minMaxData) {
			return this.minMaxData;
		}

		if (!this.centerSizeData) {
			throw "Invalid AABB state";
		}

		const halfsize = this.centerSizeData.size.div(2);
		const min = this.centerSizeData.center.sub(halfsize);
		const max = this.centerSizeData.center.add(halfsize);
		return (this.minMaxData = { min, max });
	}
	/** Get the minimum point of the {@link AABB} */
	getMin(): Vector3 {
		return this.getMinMaxData().min;
	}
	/** Get the maximum point of the {@link AABB} */
	getMax(): Vector3 {
		return this.getMinMaxData().max;
	}

	/** @returns Copy of this {@link AABB} with the new center point, applying the rotation if {@link CFrame} */
	withCenter(position: Vector3 | CFrame | ((position: Vector3) => Vector3)): AABB {
		if (typeIs(position, "Vector3")) {
			return AABB.fromCenterSize(position, this.getSize());
		}
		if (typeIs(position, "function")) {
			return AABB.fromCenterSize(position(this.getCenter()), this.getSize());
		}

		const halfSize = this.getSize().div(2);
		const minPoint = position.Rotation.mul(halfSize.mul(-1)).add(position.Position);
		const maxPoint = position.Rotation.mul(halfSize).add(position.Position);
		return AABB.fromMinMax(minPoint, maxPoint);
	}
	/** @returns Copy of this {@link AABB} with the new size */
	withSize(size: Vector3 | ((size: Vector3) => Vector3)): AABB {
		if (typeIs(size, "Vector3")) {
			return AABB.fromCenterSize(this.getCenter(), size);
		}

		return AABB.fromCenterSize(this.getCenter(), size(this.getSize()));
	}

	/** @returns AABB that contains both `this` and the provided {@link AABB}s */
	expanded(region: AABB): AABB {
		const min = (v1: Vector3, v2: Vector3): Vector3 =>
			new Vector3(math.min(v1.X, v2.X), math.min(v1.Y, v2.Y), math.min(v1.Z, v2.Z));
		const max = (v1: Vector3, v2: Vector3): Vector3 =>
			new Vector3(math.max(v1.X, v2.X), math.max(v1.Y, v2.Y), math.max(v1.Z, v2.Z));

		return AABB.fromMinMax(min(this.getMin(), region.getMin()), max(this.getMax(), region.getMax()));
	}

	/** @returns Is the provided value fully inside of this {@link AABB} */
	contains(other: Vector3 | AABB): boolean {
		if (typeIs(other, "Vector3")) {
			return (
				VectorUtils.ofVec3.lessThanOrEquals(this.getMin(), other) &&
				VectorUtils.ofVec3.greaterThanOrEquals(this.getMax(), other)
			);
		}

		return (
			VectorUtils.ofVec3.lessThanOrEquals(this.getMin(), other.getMin()) &&
			VectorUtils.ofVec3.greaterThanOrEquals(this.getMax(), other.getMax())
		);
	}
}
