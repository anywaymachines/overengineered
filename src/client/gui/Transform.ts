import { RunService, TweenService } from "@rbxts/services";
import SharedComponentBase from "shared/component/SharedComponentBase";
import Objects from "shared/fixes/objects";

export type TransformDirection = "up" | "down" | "left" | "right";
export type TransformEasing = "OutQuad" | "InQuad";

type Tweenable = number | UDim2;

export type TransformParams = {
	readonly duration?: number;
	readonly delay?: number;
	readonly easing?: TransformEasing;
};

type TransformFunc = {
	readonly type: "func";
	readonly func: () => void;
};

type FullTransformParams<T extends Instance, TKey extends keyof T, TValue extends T[TKey] & Tweenable> = {
	readonly type: "tween";
	readonly instance: T;
	readonly key: TKey;
	readonly value: TValue;
	readonly startsAt: number;
	readonly duration: number;
	readonly easingStyle: Enum.EasingStyle;
	readonly easingDirection: Enum.EasingDirection;
};

type PossibleTransforms =
	| TransformFunc
	| FullTransformParams<Instance, keyof Instance, Instance[keyof Instance] & Tweenable>;

interface Transforms {
	/** @returns True if completed */
	runFrame(time: number, dt: number): boolean;
}

abstract class TransformBase implements Transforms {
	private started = false;

	constructor(
		readonly startsAt: number,
		readonly duration: number,
	) {}

	runFrame(time: number, dt: number): boolean {
		time -= this.startsAt;
		if (time < 0) return false;

		if (this.duration === 0) {
			this.onStart();
			return true;
		}
		if (time > this.duration) {
			this.onEnd();
			return true;
		}

		if (!this.started) {
			this.onStart();
			this.started = true;
		}

		this.onFrame(time, dt);
		return false;
	}

	protected abstract onStart(): void;
	protected abstract onEnd(): void;
	protected abstract onFrame(time: number, dt: number): void;
}

class FuncTransform extends TransformBase {
	private readonly func: () => void;

	constructor(func: () => void, startsAt: number) {
		super(startsAt, 0);
		this.func = func;
	}

	protected onStart(): void {
		this.func();
	}
	protected onEnd(): void {}
	protected onFrame(time: number, dt: number): void {}
}
class TweenTransform<T extends Instance, TKey extends keyof ExtractMembers<T, Tweenable>, TValue extends T[TKey]>
	implements Transforms
{
	constructor(
		readonly instance: T,
		readonly key: TKey,
		readonly value: TValue,
		readonly startsAt: number,
		readonly duration: number,
		readonly easingStyle: Enum.EasingStyle,
		readonly easingDirection: Enum.EasingDirection,
	) {}

	private startValue?: TValue;

	static ease(time01: number, style: Enum.EasingStyle, direction: Enum.EasingDirection): number {
		return TweenService.GetValue(time01, style, direction);
	}

	static interpolate<T extends Tweenable>(
		from: T,
		to: T,
		time01: number,
		style: Enum.EasingStyle,
		direction: Enum.EasingDirection,
	): T {
		const interpolate = <T extends Tweenable>(from: T, to: T): T => {
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
		time -= this.startsAt;
		if (time < 0) return false;
		if (time > this.duration) {
			this.instance[this.key] = this.value;
			return true;
		}

		this.startValue ??= this.instance[this.key] as TValue;
		this.instance[this.key] = TweenTransform.interpolate(
			this.startValue as Tweenable,
			this.value as Tweenable,
			time / this.duration,
			this.easingStyle,
			this.easingDirection,
		) as T[TKey];

		return false;
	}
}

export class Transform<T extends Instance> extends SharedComponentBase {
	readonly instance: T;

	private readonly sequence: Transforms[] = [];
	private savedProperties?: Partial<T>;
	private maxDuration = 0;
	private delayOffset = 0;

	private time = 0;

	constructor(instance: T) {
		super();
		this.instance = instance;
	}

	enable() {
		super.enable();

		//

		const sequence = [...this.sequence];

		const run = (dt: number) => {
			if (sequence.size() === 0) {
				this.destroy();
			}

			for (const transform of [...sequence]) {
				const completed = transform.runFrame(this.time, dt);
				if (completed) {
					sequence.remove(sequence.indexOf(transform));
				}
			}
		};

		run(0);
		this.event.subscribe(RunService.Heartbeat, (dt) => {
			this.time += dt;
			run(dt);
		});
	}

	//

	save(...keys: readonly (keyof T)[]): this {
		return this.func(() => {
			const props: Partial<T> = {};
			for (const key of keys) {
				props[key] = this.instance[key];
			}
			this.savedProperties = props;
		});
	}

	restore(): this {
		return this.func(() => {
			if (!this.savedProperties) return;

			Objects.assign(this.instance, this.savedProperties);
			this.savedProperties = undefined;
		});
	}

	wait(delay: number): this {
		this.delayOffset += delay;
		this.maxDuration += delay;

		return this;
	}

	then(): this {
		this.delayOffset = this.maxDuration;
		return this;
	}

	func(func: () => void): this {
		const transform = new FuncTransform(func, this.delayOffset);
		this.sequence.push(transform);

		return this;
	}

	transform<TKey extends keyof ExtractMembers<T, Tweenable>, TValue extends T[TKey]>(
		key: TKey,
		value: TValue,
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
		const transform = new TweenTransform(
			this.instance,
			key,
			value,
			(params?.delay ?? 0) + this.delayOffset,
			params?.duration ?? 0,
			easingStyle,
			easingDirection,
		);
		this.sequence.push(transform);
		this.maxDuration = math.max(
			this.maxDuration,
			(params?.duration ?? 0) + (params?.delay ?? 0) + this.delayOffset,
		);

		return this;
	}

	moveTo(this: Transform<GuiObject>, position: UDim2, params?: TransformParams) {
		return this.transform("Position", position, params);
	}
	moveRelative(this: Transform<GuiObject>, offset: UDim2, params?: TransformParams) {
		return this.transform("Position", this.instance.Position.add(offset), params);
	}

	resizeRelative(this: Transform<GuiObject>, offset: UDim2, params?: TransformParams) {
		return this.transform("Size", this.instance.Size.add(offset), params);
	}
}
