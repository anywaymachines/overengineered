export default class VectorUtils {
	static apply(vector: Vector3, func: (num: number) => number): Vector3;
	static apply(vector: Vector2, func: (num: number) => number): Vector2;
	static apply(vector: Vector2 | Vector3, func: (num: number) => number): Vector2 | Vector3 {
		if (typeIs(vector, "Vector3")) {
			return new Vector3(func(vector.X), func(vector.Y), func(vector.Z));
		}

		return new Vector2(func(vector.X), func(vector.Y));
	}

	static round(num: number, precision?: number) {
		precision = precision ?? 1;
		return math.floor(num + precision / 2) * precision;
	}

	static areCFrameEqual(cf1: CFrame, cf2: CFrame, precision?: number) {
		precision = precision ?? 0.05;
		let pos1 = cf1.Position;
		let rot1 = cf1.ToObjectSpace(new CFrame()).LookVector;
		let pos2 = cf2.Position;
		let rot2 = cf2.ToObjectSpace(new CFrame()).LookVector;

		pos1 = new Vector3(this.round(pos1.X, precision), this.round(pos1.Y, precision), this.round(pos1.Z, precision));
		rot1 = new Vector3(this.round(rot1.X, precision), this.round(rot1.Y, precision), this.round(rot1.Z, precision));

		pos2 = new Vector3(this.round(pos2.X, precision), this.round(pos2.Y, precision), this.round(pos2.Z, precision));
		rot2 = new Vector3(this.round(rot2.X, precision), this.round(rot2.Y, precision), this.round(rot2.Z, precision));

		return pos1 === pos2 && rot1 === rot2;
	}

	static normalizeVector2(vector: Vector2) {
		return vector.Unit;
	}
	static normalizeVector3(vector: Vector3) {
		return vector.Unit;
	}
	static normalize<T extends Vector3 | Vector2>(vector: T): T {
		return vector.Unit as T;
	}

	static readonly ofVec3 = {
		/** @returns Are all of the points of `left` less than those of `right` */
		lessThan: (left: Vector3, right: Vector3): boolean => {
			return left.X < right.X && left.Y < right.Y && left.Z < right.Z;
		},
		/** @returns Are all of the points of `left` less than those of `right` */
		lessThanOrEquals: (left: Vector3, right: Vector3): boolean => {
			return left.X <= right.X && left.Y <= right.Y && left.Z <= right.Z;
		},
		/** @returns Are all of the points of `left` greater than those of `right` */
		greaterThan: (left: Vector3, right: Vector3): boolean => {
			return left.X > right.X && left.Y > right.Y && left.Z > right.Z;
		},
		/** @returns Are all of the points of `left` greater than those of `right` */
		greaterThanOrEquals: (left: Vector3, right: Vector3): boolean => {
			return left.X >= right.X && left.Y >= right.Y && left.Z >= right.Z;
		},
	} as const;

	static roundVectorToBase(vector: Vector3, base: number): Vector3 {
		const x = math.floor(vector.X / base + 0.5) * base;
		const y = math.floor(vector.Y / base + 0.5) * base;
		const z = math.floor(vector.Z / base + 0.5) * base;
		return new Vector3(x, y, z);
	}

	static roundVectorToNearestHalf(vector: Vector3): Vector3 {
		const x = math.round(vector.X * 2) / 2;
		const y = math.round(vector.Y * 2) / 2;
		const z = math.round(vector.Z * 2) / 2;
		return new Vector3(x, y, z);
	}

	static normalIdToNormalVector(mouse_surface: Enum.NormalId, part: BasePart): { vector: Vector3; size: number } {
		switch (mouse_surface) {
			case Enum.NormalId.Top:
			case Enum.NormalId.Bottom:
				return { vector: Vector3.FromNormalId(mouse_surface), size: part.Size.Y };
			case Enum.NormalId.Front:
			case Enum.NormalId.Back:
				return { vector: Vector3.FromNormalId(mouse_surface), size: part.Size.Z };
			case Enum.NormalId.Right:
			case Enum.NormalId.Left:
			default:
				return { vector: Vector3.FromNormalId(mouse_surface), size: part.Size.X };
		}
	}
}
