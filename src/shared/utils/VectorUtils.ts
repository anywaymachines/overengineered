export default class VectorUtils {
	static normalizeVector2(vector: Vector2) {
		const vectorLength = math.abs(math.sqrt(vector.X ** 2 + vector.Y ** 2));
		return vector.div(vectorLength);
	}

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

	static isInRegion3(region: Region3, point: Vector3): boolean {
		const relative = point.sub(region.CFrame.Position).div(region.Size);
		return (
			-0.5 <= relative.X &&
			relative.X <= 0.5 &&
			-0.5 <= relative.Y &&
			relative.Y <= 0.5 &&
			-0.5 <= relative.Z &&
			relative.Z <= 0.5
		);
	}

	static isRegion3InRegion3(region1: Region3, region2: Region3): boolean {
		// Get the corners of the first region
		const corners1 = [
			new Vector3(
				region1.CFrame.Position.X - region1.Size.X / 2,
				region1.CFrame.Position.Y - region1.Size.Y / 2,
				region1.CFrame.Position.Z - region1.Size.Z / 2,
			),
			new Vector3(
				region1.CFrame.Position.X + region1.Size.X / 2,
				region1.CFrame.Position.Y + region1.Size.Y / 2,
				region1.CFrame.Position.Z + region1.Size.Z / 2,
			),
		];

		// Check each corner of the first region
		for (const corner of corners1) {
			if (!this.isInRegion3(region2, corner)) {
				// If any corner is not in the second region, return false
				return false;
			}
		}

		// If all corners are in the second region, return true
		return true;
	}
}
