import { SharedPlot } from "shared/building/SharedPlot";

type LG = "Local" | "Global";

declare global {
	type CFrameLike<T extends LG> = {
		/** @deprecated @hidden */ readonly ___nominal: `${T}CFrame`;

		/** The 3D position of the CFrame */
		readonly Position: Vector3Like<T>;
		/** A copy of the CFrame with no translation. */
		readonly Rotation: CFrame;

		/** The x-coordinate of the position */
		readonly X: number;
		/** The y-coordinate of the position */
		readonly Y: number;
		/** The z-coordinate of the position */
		readonly Z: number;

		/** The forward-direction component of the CFrame’s orientation. */
		readonly LookVector: Vector3;
		/** The right-direction component of the CFrame’s orientation. */
		readonly RightVector: Vector3;
		/** The up-direction component of the CFrame’s orientation. */
		readonly UpVector: Vector3;
		/** Equivalent to the first/top row of the rotation matrix, or `Vector3.new(r00, r10, r20)` */
		readonly XVector: Vector3;
		/** Equivalent to the second/middle row of the rotation matrix, or `Vector3.new(r01, r11, r21)` */
		readonly YVector: Vector3;
		/** Equivalent to the third/bottom row of the rotation matrix, or `Vector3.new(r02, r12, r22)` */
		readonly ZVector: Vector3;

		toCFrame(): CFrame;

		add(v3: Vector3Like<T>): CFrameLike<T>;
		sub(v3: Vector3Like<T>): CFrameLike<T>;
		mul(cf: CFrameLike<T>): CFrameLike<T>;
		mul(v3: Vector3Like<T>): Vector3Like<T>;
		mul(other: CFrameLike<T> | Vector3Like<T>): CFrameLike<T> | Vector3Like<T>;

		toLocal(this: GlobalCFrame, plot: SharedPlot): LocalCFrame;
		toLocalRotation(this: GlobalCFrame, plot: SharedPlot): LocalCFrame;
		toGlobal(this: LocalCFrame, plot: SharedPlot): GlobalCFrame;
		toGlobalRotation(this: LocalCFrame, plot: SharedPlot): GlobalCFrame;
	};
	type LocalCFrame = CFrameLike<"Local">;
	type GlobalCFrame = CFrameLike<"Global">;

	//

	type Vector3Base = {
		toVector(): Vector3;
	};
	type Vector3Like<T extends LG> = Vector3Base & {
		/** @deprecated @hidden */ readonly ___nominal: `${T}Vector3`;

		readonly X: number;
		readonly Y: number;
		readonly Z: number;

		add(v3: Vector3Like<T>): Vector3Like<T>;
		sub(v3: Vector3Like<T>): Vector3Like<T>;
		mul(other: Vector3Like<T> | number): Vector3Like<T>;
		div(other: Vector3Like<T> | number): Vector3Like<T>;
		idiv(other: Vector3Like<T> | number): Vector3Like<T>;

		toGlobal(this: LocalVector3, plot: SharedPlot): GlobalVector3;
		toLocal(this: GlobalVector3, plot: SharedPlot): LocalVector3;
	};
	type LocalVector3 = Vector3Like<"Local">;
	type GlobalVector3 = Vector3Like<"Global">;
}

const e = new CFrame();

export namespace CFraming {
	class CustomCFrame<T extends LG> implements CFrameLike<T> {
		/** @deprecated @hidden */ readonly ___nominal = undefined!;

		readonly Position: Vector3Like<T>;
		readonly Rotation: CFrame;
		readonly X: number;
		readonly Y: number;
		readonly Z: number;
		readonly LookVector: Vector3;
		readonly RightVector: Vector3;
		readonly UpVector: Vector3;
		readonly XVector: Vector3;
		readonly YVector: Vector3;
		readonly ZVector: Vector3;
		private readonly cframe: CFrame;

		constructor(cframe: CFrame) {
			this.cframe = cframe;

			this.Position = new CustomVector(cframe.Position);
			this.Rotation = cframe.Rotation;
			this.X = cframe.X;
			this.Y = cframe.Y;
			this.Z = cframe.Z;
			this.LookVector = cframe.LookVector;
			this.RightVector = cframe.RightVector;
			this.UpVector = cframe.UpVector;
			this.XVector = cframe.XVector;
			this.YVector = cframe.YVector;
			this.ZVector = cframe.ZVector;

			setmetatable(this, {
				...(getmetatable(this) ?? {}),
				__tostring: (tis) => `${this.toCFrame()}`,
			});
		}

		toLocal(this: GlobalCFrame, plot: SharedPlot): LocalCFrame {
			return asLocal(plot.instance.BuildingArea.GetPivot().ToObjectSpace(this.toCFrame()));
		}
		toLocalRotation(this: GlobalCFrame, plot: SharedPlot): LocalCFrame {
			return asLocal(plot.instance.BuildingArea.GetPivot().Rotation.ToObjectSpace(this.toCFrame()));
		}
		toGlobal(this: LocalCFrame, plot: SharedPlot): GlobalCFrame {
			return asGlobal(plot.instance.BuildingArea.GetPivot().ToWorldSpace(this.toCFrame()));
		}
		toGlobalRotation(this: LocalCFrame, plot: SharedPlot): GlobalCFrame {
			return asGlobal(plot.instance.BuildingArea.GetPivot().Rotation.ToWorldSpace(this.toCFrame()));
		}

		add(other: Vector3Base): CFrameLike<T> {
			return new CustomCFrame(this.toCFrame().add(other.toVector()));
		}
		sub(other: Vector3Base): CFrameLike<T> {
			return new CustomCFrame(this.toCFrame().sub(other.toVector()));
		}

		mul(other: CFrameLike<T>): CFrameLike<T>;
		mul(other: Vector3Like<T>): Vector3Like<T>;
		mul(other: Vector3Like<T> | CFrameLike<T>): Vector3Like<T> | CFrameLike<T> {
			const val = this.toCFrame().mul("toVector" in other ? other.toVector() : other.toCFrame());
			return typeIs(val, "Vector3") ? new CustomVector(val) : new CustomCFrame(val);
		}

		toCFrame(): CFrame {
			return this.cframe;
		}
	}

	class CustomVector<T extends LG> implements Vector3Like<T> {
		/** @deprecated @hidden */ readonly ___nominal = undefined!;
		readonly X: number;
		readonly Y: number;
		readonly Z: number;
		private readonly vector: Vector3;

		constructor(x: Vector3);
		constructor(x: number, y: number, z: number);
		constructor(x: number | Vector3, y?: number, z?: number) {
			if (typeIs(x, "Vector3")) {
				this.vector = x;
				[this.X, this.Y, this.Z] = [x.X, x.Y, x.Z];
			} else {
				this.X = x;
				this.Y = y!;
				this.Z = z!;
				this.vector = new Vector3(x, y, z);
			}

			setmetatable(this, {
				...(getmetatable(this) ?? {}),
				__tostring: (tis) => `${this.toVector()}`,
			});
		}

		toLocal(this: GlobalVector3, plot: SharedPlot): LocalVector3 {
			return asLocal(plot.instance.BuildingArea.GetPivot().PointToObjectSpace(this.toVector()));
		}
		toGlobal(this: LocalVector3, plot: SharedPlot): GlobalVector3 {
			return asGlobal(plot.instance.BuildingArea.GetPivot().PointToWorldSpace(this.toVector()));
		}

		add(other: Vector3Like<T>): Vector3Like<T> {
			return new CustomVector<T>(this.toVector().add(other.toVector()));
		}
		sub(other: Vector3Like<T>): Vector3Like<T> {
			return new CustomVector<T>(this.toVector().sub(other.toVector()));
		}
		mul(other: Vector3Like<T> | number): Vector3Like<T> {
			return new CustomVector<T>(this.toVector().mul(typeIs(other, "number") ? other : other.toVector()));
		}
		div(other: Vector3Like<T> | number): Vector3Like<T> {
			return new CustomVector<T>(this.toVector().div(typeIs(other, "number") ? other : other.toVector()));
		}
		idiv(other: Vector3Like<T> | number): Vector3Like<T> {
			return new CustomVector<T>(this.toVector().idiv(typeIs(other, "number") ? other : other.toVector()));
		}

		toVector() {
			return this.vector;
		}
	}

	export function asLocal(vector: Vector3): LocalVector3;
	export function asLocal(vector: CFrame): LocalCFrame;
	export function asLocal(vector: Vector3 | CFrame): LocalVector3 | LocalCFrame {
		if (typeIs(vector, "CFrame")) {
			return new CustomCFrame(vector);
		}

		return new CustomVector(vector);
	}

	export function asGlobal(vector: Vector3): GlobalVector3;
	export function asGlobal(vector: CFrame): GlobalCFrame;
	export function asGlobal(vector: Vector3 | CFrame): GlobalVector3 | GlobalCFrame {
		if (typeIs(vector, "CFrame")) {
			return new CustomCFrame(vector);
		}

		return new CustomVector(vector);
	}
}
