import { RunService, TweenService } from "@rbxts/services";
import SharedComponent from "shared/component/SharedComponent";
import SharedComponentContainer from "shared/component/SharedComponentContainer";
import Objects from "shared/fixes/objects";

interface Transform {
	/** @returns True if completed */
	runFrame(time: number, dt: number): boolean;
}

class FuncTransform implements Transform {
	constructor(private readonly func: () => void) {}

	runFrame(): boolean {
		this.func();
		return true;
	}
}
class DelayTransform implements Transform {
	constructor(private readonly delay: number) {}

	runFrame(time: number, dt: number): boolean {
		return time > this.delay;
	}
}

type TransformParams = {
	readonly duration?: number;
	readonly easing?: TransformEasing;
};
type Transformable = number | UDim2;
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

			throw "Untweenable type";
		};

		time01 = this.ease(time01, style, direction);
		return interpolate(from, to);
	}

	/** @returns True if completed */
	runFrame(time: number, dt: number): boolean {
		if (time < 0) return false;
		if (time > this.duration) {
			this.instance[this.key] = this.value;
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
}

class TransformSequence extends SharedComponentContainer {
	private readonly sequence: (readonly (() => Transform)[])[];

	constructor(sequence: readonly (readonly (() => Transform)[])[]) {
		super();
		this.sequence = [...sequence];
	}

	enable() {
		super.enable();

		const createTransformSequence = (sequence: readonly Transform[]) => {
			sequence = [...sequence];
			let time = 0;

			return (dt: number): boolean => {
				if (sequence.size() === 0) {
					return true;
				}

				time += dt;
				for (const transform of [...sequence]) {
					const completed = transform.runFrame(time, dt);
					if (completed) {
						(sequence as Transform[]).remove(sequence.indexOf(transform));
					}
				}

				return false;
			};
		};

		let currentSequence: ((dt: number) => boolean) | undefined;
		const run = (dt: number) => {
			if (!currentSequence) {
				if (this.sequence.size() === 0) {
					this.destroy();
					return;
				}

				currentSequence = createTransformSequence(this.sequence[0].map((s) => s()));
				this.sequence.remove(0);
			}

			const completed = currentSequence(dt);
			if (completed) {
				currentSequence = undefined;
			}
		};

		run(0);
		this.event.subscribe(RunService.Heartbeat, run);
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

	/** Adds a transform that changes a value of an `Instance` over time */
	transform<TKey extends keyof ExtractMembers<T, Transformable>, TValue extends T[TKey]>(
		key: TKey,
		value: TValue | (() => TValue),
		params?: TransformParams,
	) {
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
	move(this: TransformBuilder<GuiObject>, position: UDim2, params?: TransformParams) {
		return this.transform("Position", position, params);
	}
	/** Resize the `GuiObject` */
	resize(this: TransformBuilder<GuiObject>, size: UDim2, params?: TransformParams) {
		return this.transform("Size", size, params);
	}

	/** Relatively move the `GuiObject` */
	moveRelative(this: TransformBuilder<GuiObject>, offset: UDim2, params?: TransformParams) {
		return this.transform("Position", () => this.instance.Position.add(offset), params);
	}
	/** Relatively resize the `GuiObject` */
	resizeRelative(this: TransformBuilder<GuiObject>, offset: UDim2, params?: TransformParams) {
		return this.transform("Size", () => this.instance.Size.add(offset), params);
	}
}

export class TransformContainer<T extends Instance> extends SharedComponent<T, TransformSequence> {
	constructor(instance: T) {
		super(instance);
	}

	run(setup: (transform: TransformBuilder<T>) => void): void {
		const transform = new TransformBuilder(this.instance);
		setup(transform);

		this.add(new TransformSequence(transform.sequence));
	}
	stop() {
		this.clear();
	}
}
