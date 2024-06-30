const rotateSize = (size: Vector3, rotation: CFrame) => {
	const [, , , R00, R01, R02, R10, R11, R12, R20, R21, R22] = rotation.GetComponents();
	const [sx, sy, sz] = [size.X, size.Y, size.Z];

	const wsx = math.abs(R00) * sx + math.abs(R01) * sy + math.abs(R02) * sz;
	const wsy = math.abs(R10) * sx + math.abs(R11) * sy + math.abs(R12) * sz;
	const wsz = math.abs(R20) * sx + math.abs(R21) * sy + math.abs(R22) * sz;
	return new Vector3(wsx, wsy, wsz);
};

/** Immutable bounding box */
export class BB {
	/** Get the {@link BB} of a {@link BasePart} */
	static fromPart(part: BasePart): BB {
		const [center, size] = [part.ExtentsCFrame, part.ExtentsSize];
		return new BB(center, size);
	}
	/** Get the {@link BB} of a {@link Model} */
	static fromModel(model: Model): BB {
		const [center, size] = model.GetBoundingBox();
		return new BB(center, size);
	}
	/** Get the {@link BB} of a multiple {@link Model} */
	static fromModels(models: readonly Model[], origin?: CFrame): BB {
		return this.fromBBs(
			models.map((m) => this.fromModel(m)),
			origin,
		);
	}
	/** Get the {@link BB} of a multiple {@link BB} */
	static fromBBs(regions: readonly BB[], origin?: CFrame): BB {
		if (regions.size() === 0) {
			throw "Not enough models";
		}

		origin ??= regions[regions.size() - 1].center;
		regions = regions.map((r) => r.withCenter((c) => origin.ToObjectSpace(c)));

		let localToOriginMin: Vector3 | undefined;
		let localToOriginMax: Vector3 | undefined;

		for (const localToOriginRegion of regions) {
			const rotatedSizeHalf = localToOriginRegion.getRotatedSize().div(2);

			const min = localToOriginRegion.center.Position.sub(rotatedSizeHalf);
			localToOriginMin = (localToOriginMin ?? min).min(min);

			const max = localToOriginRegion.center.Position.add(rotatedSizeHalf);
			localToOriginMax = (localToOriginMax ?? max).max(max);
		}

		assert(localToOriginMin);
		assert(localToOriginMax);

		return new BB(
			origin.ToWorldSpace(new CFrame(localToOriginMin.add(localToOriginMax).div(2))),
			localToOriginMax.sub(localToOriginMin),
		);
	}
	/** Create the {@link BB} from a {@link Region3} */
	static fromRegion3(region: Region3): BB {
		return new BB(region.CFrame, region.Size);
	}

	private rotatedSize?: Vector3;

	constructor(
		readonly center: CFrame,
		readonly originalSize: Vector3,
	) {
		setmetatable(this, {
			...(getmetatable(this) ?? {}),
			__tostring: () => `BB{ center: ${center}, size: ${originalSize} }`,
		});
	}

	getRotatedSize(): Vector3 {
		return (this.rotatedSize ??= rotateSize(this.originalSize, this.center));
	}
	toAxisAligned(): BB {
		return new BB(new CFrame(this.center.Position), this.getRotatedSize());
	}

	/** @returns Copy of this {@link BB} with the new center point */
	withCenter(position: CFrame | ((cf: CFrame) => CFrame)): BB {
		if (typeIs(position, "function")) {
			return new BB(position(this.center), this.originalSize);
		}

		return new BB(position, this.originalSize);
	}
	/** @returns Copy of this {@link BB} with the new size */
	withSize(size: Vector3 | ((size: Vector3) => Vector3)): BB {
		if (typeIs(size, "function")) {
			return new BB(this.center, size(this.originalSize));
		}

		return new BB(this.center, size);
	}

	isPointInside(globalPoint: Vector3): boolean {
		const localPoint = this.center.PointToObjectSpace(globalPoint);
		const size = this.originalSize.div(2);
		return math.abs(localPoint.X) <= size.X && math.abs(localPoint.Y) <= size.Y && math.abs(localPoint.Z) <= size.Z;
	}
	isBBInside(bb: BB): boolean {
		const localCenter = this.center.ToObjectSpace(bb.center);
		const size = rotateSize(bb.originalSize, localCenter).div(2);

		return (
			this.isPointInside(this.center.add(localCenter.Position).PointToWorldSpace(size.unm())) &&
			this.isPointInside(this.center.add(localCenter.Position).PointToWorldSpace(size))
		);
	}
}
