import { RunService } from "@rbxts/services";
import { Component } from "shared/component/Component";
import { ContainerComponent } from "shared/component/ContainerComponent";
import { Easing } from "shared/component/Easing";
import { SlimSignal } from "shared/event/SlimSignal";
import { Objects } from "shared/fixes/objects";
import type { Easable, EasingDirection, EasingStyle } from "shared/component/Easing";

interface Transform {
	/** @returns True if completed */
	runFrame(time: number): boolean;

	/** Immediately finish a transform */
	finish(): void;
}

class FuncTransform implements Transform {
	private readonly func: () => void;
	private finished = false;

	constructor(func: () => void) {
		this.func = func;
	}

	runFrame(_: never): boolean {
		if (this.finished) return true;

		this.finished = true;
		this.func();
		return true;
	}
	finish() {
		if (this.finished) return;

		this.func();
	}
}
class DelayTransform implements Transform {
	private readonly delay: number;

	constructor(delay: number) {
		this.delay = delay;
	}

	runFrame(time: number): boolean {
		return time >= this.delay;
	}
	finish() {}
}

export type TweenableProperties<T> = ExtractKeys<Required<T>, Easable>;
export type TransformProps = {
	readonly duration?: number;
	readonly style?: EasingStyle;
	readonly direction?: EasingDirection;
};
class TweenTransform<T, TKey extends TweenableProperties<T>> implements Transform {
	constructor(
		private readonly instance: T,
		private readonly key: TKey,
		private readonly value: T[TKey] | (() => T[TKey]),
		private readonly duration: number,
		private readonly style: EasingStyle,
		private readonly direction: EasingDirection,
	) {
		this.instance = instance;
		this.key = key;
		this.value = value;
	}

	private startValue?: T[TKey];
	private actualValue?: T[TKey];

	runFrame(time: number): boolean {
		if (time >= this.duration) {
			this.finish();
			return true;
		}

		this.startValue ??= this.instance[this.key];
		this.actualValue ??= typeIs(this.value, "function") ? this.value() : this.value;

		this.instance[this.key] = Easing.easeValue(
			time / this.duration,
			this.startValue as Easable,
			this.actualValue as Easable,
			this.style,
			this.direction,
		) as T[TKey];

		return false;
	}

	finish() {
		this.instance[this.key] = this.actualValue ?? (typeIs(this.value, "function") ? this.value() : this.value);
	}
}

class ParallelTransformSequence implements Transform {
	private readonly sequence: Transform[];

	constructor(sequence: readonly Transform[]) {
		this.sequence = [...sequence];
	}

	runFrame(time: number): boolean {
		if (this.sequence.size() === 0) {
			return true;
		}

		for (const transform of [...this.sequence]) {
			const completed = transform.runFrame(time);
			if (completed) {
				this.sequence.remove(this.sequence.indexOf(transform));

				if (this.sequence.size() === 0) {
					return true;
				}
			}
		}

		return false;
	}

	finish() {
		for (const transform of this.sequence) {
			transform.finish();
		}

		this.sequence.clear();
	}
}

class TransformSequence implements Transform {
	private readonly sequence: Transform[];
	private timeOffset = 0;

	constructor(sequence: readonly Transform[]) {
		this.sequence = [...sequence];
	}

	runFrame(time: number): boolean {
		if (this.sequence.size() === 0) {
			return true;
		}

		const completed = this.sequence[0].runFrame(time - this.timeOffset);
		if (completed) {
			this.sequence.remove(0);
			this.timeOffset = time;

			if (this.sequence.size() === 0) {
				return true;
			}
		}

		return false;
	}

	finish() {
		for (const transform of this.sequence) {
			transform.finish();
		}

		this.sequence.clear();
	}
}

//

class TransformRunner extends Component {
	readonly completed = new SlimSignal();
	readonly transform: Transform;
	private time = 0;

	constructor(transform: Transform) {
		super();
		this.transform = transform;

		const run = () => {
			const completed = transform.runFrame(this.time);
			if (completed) {
				this.completed.Fire();
				this.disable();
			}
		};

		this.event.subscribe(RunService.Heartbeat, (dt) => {
			this.time += dt;
			run();
		});

		let firstRan = false;
		this.event.onEnable(() => {
			if (firstRan) return;

			run();
			firstRan = true;
		});
	}

	/** Immediately finish the transform */
	finish() {
		this.transform.finish();
		this.disable();
	}

	/** Stop and disable the transform */
	cancel() {
		this.disable();
	}
}

//

type Direction = "top" | "bottom" | "left" | "right";
const directionToOffset = (direction: Direction, power: number) => {
	const offsets: Record<Direction, UDim2> = {
		top: new UDim2(0, 0, 0, power),
		bottom: new UDim2(0, 0, 0, -power),
		left: new UDim2(0, power, 0, 0),
		right: new UDim2(0, -power, 0, 0),
	};

	return offsets[direction];
};

export class TransformBuilder<T extends object> {
	readonly instance;
	private readonly transforms: Transform[][] = [[]];
	private savedProperties?: Partial<T>;

	constructor(instance: T) {
		this.instance = instance;
	}

	build(): TransformRunner {
		return new TransformRunner(this.buildSequence());
	}
	buildSequence(): TransformSequence {
		return new TransformSequence(this.transforms.map((seq) => new ParallelTransformSequence(seq)));
	}

	then(): this {
		this.transforms.push([]);
		return this;
	}

	private push(transform: Transform): this {
		this.transforms[this.transforms.size() - 1].push(transform);
		return this;
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
			if (this.savedProperties === undefined) return;

			Objects.assign(this.instance, this.savedProperties);
			this.savedProperties = undefined;
		});
	}

	func(func: () => void): this {
		return this.push(new FuncTransform(func));
	}

	wait(delay: number): this {
		return this.push(new DelayTransform(delay)).then();
	}

	parallel(...funcs: ((transform: TransformBuilder<T>) => void)[]): this {
		const seq = funcs.map((func) => {
			const transform = new TransformBuilder<T>(this.instance);
			func(transform);

			return transform.buildSequence();
		});

		return this.push(new ParallelTransformSequence(seq));
	}

	repeat(amount: number, func: (transform: TransformBuilder<T>) => void): this {
		const transform = new TransformBuilder<T>(this.instance);
		for (let i = 0; i < amount; i++) {
			func(transform);
			transform.then();
		}

		return this.push(transform.buildSequence());
	}

	transformMulti<TKey extends TweenableProperties<T>>(
		value: { readonly [k in TKey]?: T[TKey] & defined },
		params?: TransformProps,
	) {
		for (const [key, val] of pairs(value)) {
			this.transform(key, val, params);
		}
	}
	transform<TKey extends TweenableProperties<T>>(
		key: TKey,
		value: (T[TKey] & defined) | (() => T[TKey] & defined),
		params?: TransformProps,
	) {
		return this.push(
			new TweenTransform(
				this.instance,
				key,
				value,
				params?.duration ?? 0,
				params?.style ?? "Quad",
				params?.direction ?? "Out",
			),
		);
	}

	/** Move the `GuiObject` */
	move(this: TransformBuilder<GuiObject>, position: UDim2, params?: TransformProps): TransformBuilder<T> {
		return this.transform("Position", position, params) as unknown as TransformBuilder<T>;
	}
	/** Move the `GuiObject` by X */
	moveX(this: TransformBuilder<GuiObject>, position: UDim, params?: TransformProps): TransformBuilder<T> {
		return this.transform(
			"Position",
			() => new UDim2(position, this.instance.Position.Y),
			params,
		) as unknown as TransformBuilder<T>;
	}
	/** Move the `GuiObject` by Y */
	moveY(this: TransformBuilder<GuiObject>, position: UDim, params?: TransformProps): TransformBuilder<T> {
		return this.transform(
			"Position",
			() => new UDim2(this.instance.Position.X, position),
			params,
		) as unknown as TransformBuilder<T>;
	}

	/** Resize the `GuiObject` */
	resize(this: TransformBuilder<GuiObject>, size: UDim2, params?: TransformProps): TransformBuilder<T> {
		return this.transform("Size", size, params) as unknown as TransformBuilder<T>;
	}

	/** Relatively move the `GuiObject` */
	moveRelative(this: TransformBuilder<GuiObject>, offset: UDim2, params?: TransformProps) {
		return this.transform(
			"Position",
			() => this.instance.Position.add(offset),
			params,
		) as unknown as TransformBuilder<T>;
	}
	/** Relatively resize the `GuiObject` */
	resizeRelative(this: TransformBuilder<GuiObject>, offset: UDim2, params?: TransformProps): TransformBuilder<T> {
		return this.transform("Size", () => this.instance.Size.add(offset), params) as unknown as TransformBuilder<T>;
	}

	slideIn(this: TransformBuilder<GuiObject>, from: Direction, power: number, props?: TransformProps) {
		return this.func(() => (this.instance.Visible = true))
			.moveRelative(new UDim2().sub(directionToOffset(from, power)))
			.move(this.instance.Position, {
				duration: 0.5,
				style: "Quad",
				direction: "Out",
				...props,
			}) as unknown as TransformBuilder<T>;
	}
	slideOut(this: TransformBuilder<GuiObject>, direction: Direction, power: number, props?: TransformProps) {
		return this.moveRelative(new UDim2().sub(directionToOffset(direction, power)), {
			duration: 0.5,
			style: "Quad",
			direction: "Out",
			...props,
		})
			.then()
			.func(() => (this.instance.Visible = false))
			.move(this.instance.Position) as unknown as TransformBuilder<T>;
	}
	flash<TKey extends TweenableProperties<T>>(
		this: TransformBuilder<T>,
		value: T[TKey] & defined,
		property: TKey,
		props?: TransformProps,
	) {
		return this.transform(property, value, { style: "Quad", direction: "Out", ...props })
			.then()
			.transform(property, this.instance[property]!, {
				duration: 0.4,
				style: "Quad",
				direction: "Out",
				...props,
			});
	}

	flashColor<TKey extends ExtractKeys<T & GuiObject, Color3>>(
		this: TransformBuilder<GuiObject>,
		color: Color3,
		property: TKey | "BackgroundColor3" = "BackgroundColor3",
		props?: TransformProps,
	) {
		return this.flash(color as never, property as never, props) as unknown as TransformBuilder<T>;
	}
}

//

export type RunningTransform = {
	cancel(): void;
	finish(): void;
};
export class TransformContainer<T extends object>
	extends ContainerComponent<TransformRunner>
	implements RunningTransform
{
	private readonly instance;

	constructor(instance: T) {
		super();
		this.instance = instance;
	}

	run(setup: (transform: TransformBuilder<T>, instance: T) => void): void {
		this.finish();

		const transform = new TransformBuilder(this.instance);
		setup(transform, this.instance);

		const sequence = transform.build();
		sequence.completed.Connect(() => {
			// spawn is to not call this.remove() right inside this.add()
			spawn(() => this.remove(sequence));
		});

		this.add(sequence);
	}

	finish() {
		for (const transform of this.getChildren()) {
			transform.finish();
		}

		this.clear();
	}

	cancel() {
		this.clear();
	}

	disable(): void {
		this.finish();
		super.disable();
	}

	private destroying = false;
	destroy(): void {
		if (this.destroying) return;

		this.destroying = true;
		this.finish();
		super.destroy();
	}
}
