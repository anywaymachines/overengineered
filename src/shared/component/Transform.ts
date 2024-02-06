import { RunService, TweenService } from "@rbxts/services";
import SharedComponentContainer from "shared/component/SharedComponentContainer";
import SlimSignal from "shared/event/SlimSignal";
import Objects from "shared/fixes/objects";
import SharedComponentBase from "./SharedComponentBase";

interface Transform {
	/** @returns True if completed */
	runFrame(time: number, dt: number): boolean;

	/** Finish a transform immediately */
	finish(): void;
}

class FuncTransform implements Transform {
	constructor(private readonly func: () => void) {}

	runFrame(): boolean {
		this.func();
		return true;
	}
	finish(): void {
		this.func();
	}
}
class DelayTransform implements Transform {
	constructor(private readonly delay: number) {}

	runFrame(time: number, dt: number): boolean {
		return time > this.delay;
	}
	finish(): void {}
}

type TransformParams = {
	readonly duration?: number;
	readonly easing?: TransformEasing;
};
type Transformable = number | UDim2 | Color3;
export type TransformEasing = "OutQuad" | "InQuad";
export type TransformDirection = "up" | "down" | "left" | "right";

/** Transform that updates a value over time */
class TweenTransform<T extends Instance, TKey extends keyof ExtractMembers<T, Transformable>, TValue extends T[TKey]>
	implements Transform
{
	constructor(
		readonly instance: T,
		readonly key: TKey,
		readonly value: TValue,
		readonly duration: number,
		readonly easingStyle: Enum.EasingStyle,
		readonly easingDirection: Enum.EasingDirection,
	) {}

	private startValue?: TValue;

	static ease(time01: number, style: Enum.EasingStyle, direction: Enum.EasingDirection): number {
		return TweenService.GetValue(time01, style, direction);
	}

	static interpolate<T extends Transformable>(
		from: T,
		to: T,
		time01: number,
		style: Enum.EasingStyle,
		direction: Enum.EasingDirection,
	): T {
		const interpolate = <T extends Transformable>(from: T, to: T): T => {
			if (typeIs(from, "number") && typeIs(to, "number")) {
				return (from + (to - from) * time01) as T;
			}

			if (typeIs(from, "UDim2") && typeIs(to, "UDim2")) {
				return new UDim2(
					interpolate(from.X.Scale, to.X.Scale),
					interpolate(from.X.Offset, to.X.Offset),
					interpolate(from.Y.Scale, to.Y.Scale),
					interpolate(from.Y.Offset, to.Y.Offset),
				) as T;
			}

			if (typeIs(from, "Color3") && typeIs(to, "Color3")) {
				return new Color3(interpolate(from.R, to.R), interpolate(from.G, to.G), interpolate(from.B, to.B)) as T;
			}

			throw "Untweenable type";
		};

		time01 = this.ease(time01, style, direction);
		return interpolate(from, to);
	}

	/** @returns True if completed */
	runFrame(time: number, dt: number): boolean {
		if (time < 0) return false;
		if (this.duration === 0 || time > this.duration) {
			this.finish();
			return true;
		}

		this.startValue ??= this.instance[this.key] as TValue;
		this.instance[this.key] = TweenTransform.interpolate(
			this.startValue as Transformable,
			this.value as Transformable,
			time / this.duration,
			this.easingStyle,
			this.easingDirection,
		) as T[TKey];

		return false;
	}

	finish(): void {
		this.instance[this.key] = this.value;
	}
}
class TransformSequence implements Transform {
	private readonly sequence: Transform[];
	private time = 0;

	constructor(sequence: readonly Transform[]) {
		this.sequence = [...sequence];
	}

	runFrame(_: never, dt: number): boolean {
		if (this.sequence.size() === 0) {
			return true;
		}

		this.time += dt;
		for (const transform of [...this.sequence]) {
			const completed = transform.runFrame(this.time, dt);
			if (completed) {
				this.sequence.remove(this.sequence.indexOf(transform));
			}
		}

		return false;
	}

	finish(): void {
		for (const transform of this.sequence) {
			transform.finish();
		}

		this.sequence.clear();
	}
}
class TransformDoubleSequence implements Transform {
	private readonly sequence: (readonly (() => Transform)[])[];
	private current?: TransformSequence;

	constructor(sequence: readonly (readonly (() => Transform)[])[]) {
		this.sequence = [...sequence];
	}

	runFrame(_: never, dt: number): boolean {
		if (!this.current) {
			if (this.sequence.size() === 0) {
				return true;
			}

			this.current = new TransformSequence(this.sequence[0].map((s) => s()));
			this.sequence.remove(0);
		}

		const completed = this.current.runFrame(0 as never, dt);
		if (completed) {
			this.current = undefined;
		}

		return false;
	}

	finish() {
		if (this.current) {
			this.current.finish();
			this.sequence.remove(0);
		}

		for (const seq of this.sequence) {
			new TransformSequence(seq.map((s) => s())).finish();
		}
	}
}

class RunningTransform extends SharedComponentBase {
	readonly completed = new SlimSignal();
	private readonly sequence: TransformDoubleSequence;

	constructor(sequence: readonly (readonly (() => Transform)[])[]) {
		super();
		this.sequence = new TransformDoubleSequence(sequence);

		const run = (dt: number) => {
			const completed = this.sequence.runFrame(0 as never, dt);
			if (!completed) return;

			this.completed.Fire();
			this.disable();
		};

		let firstTime = true;
		this.event.onEnable(() => {
			if (!firstTime) return;

			firstTime = false;
			run(0);
		});
		this.event.subscribe(RunService.Heartbeat, run);
	}

	finish() {
		this.sequence.finish();
	}
}

/** Builder for `Instance` transformations */
export class TransformBuilder<T extends Instance> {
	readonly instance: T;
	readonly sequence: (() => Transform)[][] = [[]];
	private savedProperties?: Partial<T>;

	constructor(instance: T) {
		this.instance = instance;
	}

	/** Makes the next added transforms wait for the completion of all the previous ones */
	then(): this {
		this.sequence.push([]);
		return this;
	}

	/** Add a transform into the sequence */
	push(ctor: () => Transform) {
		this.sequence[this.sequence.size() - 1].push(ctor);
	}

	/** Adds a transform that saves the provided properties' values to restore them in future using `this.restore()` */
	save(...keys: readonly (keyof T)[]): this {
		return this.func(() => {
			const props: Partial<T> = {};
			for (const key of keys) {
				props[key] = this.instance[key];
			}
			this.savedProperties = props;
		});
	}

	/** Adds a transform that restores all previously saved (via `this.save()`) properties */
	restore(): this {
		return this.func(() => {
			if (!this.savedProperties) return;

			Objects.assign(this.instance, this.savedProperties);
			this.savedProperties = undefined;
		});
	}

	/** Adds a transform that delays the execution */
	wait(delay: number): this {
		this.push(() => new DelayTransform(delay));
		return this.then();
	}

	/** Adds a transform that invokes a provided function */
	func(func: () => void): this {
		this.push(() => new FuncTransform(func));
		return this;
	}

	/** Adds a transform that runs multiple transforms in parallel */
	parallel(...funcs: ((transform: TransformBuilder<T>) => void)[]): this {
		for (const func of funcs) {
			const f = new TransformBuilder(this.instance);
			func(f);

			this.push(() => new TransformDoubleSequence(f.sequence));
		}

		return this;
	}

	/** Adds a transform that runs the provided transform N times */
	repeat(times: number, func: (transform: TransformBuilder<T>) => void): this {
		const f = new TransformBuilder(this.instance);
		for (let i = 0; i < times; i++) {
			func(f);
			f.then();
		}

		this.push(() => new TransformDoubleSequence(f.sequence));
		return this;
	}

	/** Adds a transform that changes a value of an `Instance` over time */
	transform<TKey extends keyof ExtractMembers<T, Transformable>, TValue extends T[TKey]>(
		key: TKey,
		value: TValue | (() => TValue),
		params?: TransformParams,
	): TransformBuilder<T> {
		const toStyle = (
			easing: TransformEasing,
		): readonly [direction: Enum.EasingDirection, style: Enum.EasingStyle] => {
			if (easing === "InQuad") return [Enum.EasingDirection.In, Enum.EasingStyle.Quad];
			if (easing === "OutQuad") return [Enum.EasingDirection.Out, Enum.EasingStyle.Quad];

			throw "Unknown style";
		};

		const [easingDirection, easingStyle] = toStyle(params?.easing ?? "OutQuad");
		const ctor = () =>
			new TweenTransform(
				this.instance,
				key,
				typeIs(value, "function") ? value() : value,
				params?.duration ?? 0,
				easingStyle,
				easingDirection,
			);
		this.push(ctor);

		return this;
	}

	/** Move the `GuiObject` */
	move(this: TransformBuilder<GuiObject>, position: UDim2, params?: TransformParams): TransformBuilder<T> {
		return this.transform("Position", position, params) as unknown as TransformBuilder<T>;
	}
	/** Move the `GuiObject` by X */
	moveX(this: TransformBuilder<GuiObject>, position: UDim, params?: TransformParams): TransformBuilder<T> {
		return this.transform(
			"Position",
			() => new UDim2(position, this.instance.Position.Y),
			params,
		) as unknown as TransformBuilder<T>;
	}
	/** Move the `GuiObject` by Y */
	moveY(this: TransformBuilder<GuiObject>, position: UDim, params?: TransformParams): TransformBuilder<T> {
		return this.transform(
			"Position",
			() => new UDim2(this.instance.Position.X, position),
			params,
		) as unknown as TransformBuilder<T>;
	}

	/** Resize the `GuiObject` */
	resize(this: TransformBuilder<GuiObject>, size: UDim2, params?: TransformParams): TransformBuilder<T> {
		return this.transform("Size", size, params) as unknown as TransformBuilder<T>;
	}

	/** Relatively move the `GuiObject` */
	moveRelative(this: TransformBuilder<GuiObject>, offset: UDim2, params?: TransformParams) {
		return this.transform(
			"Position",
			() => this.instance.Position.add(offset),
			params,
		) as unknown as TransformBuilder<T>;
	}
	/** Relatively resize the `GuiObject` */
	resizeRelative(this: TransformBuilder<GuiObject>, offset: UDim2, params?: TransformParams): TransformBuilder<T> {
		return this.transform("Size", () => this.instance.Size.add(offset), params) as unknown as TransformBuilder<T>;
	}
}

export class TransformContainer<T extends Instance> extends SharedComponentContainer<RunningTransform> {
	readonly instance;

	constructor(instance: T) {
		super();
		this.instance = instance;
	}

	run(setup: (transform: TransformBuilder<T>, instance: T) => void): void {
		this.finish();

		const transform = new TransformBuilder(this.instance);
		setup(transform, this.instance);

		const sequence = this.add(new RunningTransform(transform.sequence));
		sequence.completed.Connect(() => this.remove(sequence));
	}
	finish() {
		for (const transform of this.getChildren()) {
			transform.finish();
		}

		this.stop();
	}
	stop() {
		this.clear();
	}
}
