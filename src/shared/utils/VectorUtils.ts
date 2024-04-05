export namespace VectorUtils {
	export function apply(vector: Vector3, func: (num: number) => number): Vector3;
	export function apply(vector: Vector2, func: (num: number) => number): Vector2;
	export function apply(vector: Vector2 | Vector3, func: (num: number) => number): Vector2 | Vector3 {
		if (typeIs(vector, "Vector3")) {
			return new Vector3(func(vector.X), func(vector.Y), func(vector.Z));
		}

		return new Vector2(func(vector.X), func(vector.Y));
	}

	export function round(num: number, precision?: number) {
		precision = precision ?? 1;
		return math.floor(num + precision / 2) * precision;
	}

	export function areCFrameEqual(cf1: CFrame, cf2: CFrame, precision?: number) {
		precision = precision ?? 0.05;
		let pos1 = cf1.Position;
		let rot1 = cf1.ToObjectSpace(new CFrame()).LookVector;
		let pos2 = cf2.Position;
		let rot2 = cf2.ToObjectSpace(new CFrame()).LookVector;

		pos1 = new Vector3(round(pos1.X, precision), round(pos1.Y, precision), round(pos1.Z, precision));
		rot1 = new Vector3(round(rot1.X, precision), round(rot1.Y, precision), round(rot1.Z, precision));

		pos2 = new Vector3(round(pos2.X, precision), round(pos2.Y, precision), round(pos2.Z, precision));
		rot2 = new Vector3(round(rot2.X, precision), round(rot2.Y, precision), round(rot2.Z, precision));

		return pos1 === pos2 && rot1 === rot2;
	}

	export function normalizeVector2(vector: Vector2) {
		return vector.Unit;
	}
	export function normalizeVector3(vector: Vector3) {
		return vector.Unit;
	}
	export function normalize<T extends Vector3 | Vector2>(vector: T): T {
		return vector.Unit as T;
	}

	export namespace ofVec3 {
		/** @returns Are all of the points of `left` less than those of `right` */
		export function lessThan(left: Vector3, right: Vector3): boolean {
			return left.X < right.X && left.Y < right.Y && left.Z < right.Z;
		}
		/** @returns Are all of the points of `left` less than those of `right` */
		export function lessThanOrEquals(left: Vector3, right: Vector3): boolean {
			return left.X <= right.X && left.Y <= right.Y && left.Z <= right.Z;
		}
		/** @returns Are all of the points of `left` greater than those of `right` */
		export function greaterThan(left: Vector3, right: Vector3): boolean {
			return left.X > right.X && left.Y > right.Y && left.Z > right.Z;
		}
		/** @returns Are all of the points of `left` greater than those of `right` */
		export function greaterThanOrEquals(left: Vector3, right: Vector3): boolean {
			return left.X >= right.X && left.Y >= right.Y && left.Z >= right.Z;
		}
	}

	export function roundVectorToBase(vector: Vector3, base: number): Vector3 {
		const x = math.floor(vector.X / base + 0.5) * base;
		const y = math.floor(vector.Y / base + 0.5) * base;
		const z = math.floor(vector.Z / base + 0.5) * base;
		return new Vector3(x, y, z);
	}

	export function roundVectorToNearestHalf(vector: Vector3): Vector3 {
		const x = math.round(vector.X * 2) / 2;
		const y = math.round(vector.Y * 2) / 2;
		const z = math.round(vector.Z * 2) / 2;
		return new Vector3(x, y, z);
	}

	export function normalIdToNormalVector(
		mouse_surface: Enum.NormalId,
		part: BasePart,
	): { vector: Vector3; size: number } {
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
