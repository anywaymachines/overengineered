import { TweenService } from "@rbxts/services";
import ComponentEventHolder from "client/base/ComponentEventHolder";
import Objects from "shared/_fixes_/objects";
import { ReadonlyObservableValue } from "shared/event/ObservableValue";
import GuiAnimator from "./GuiAnimator";

export type AnimationPartTween<T extends Instance> = {
	gui: T;
	properties: Readonly<Partial<ExtractMembers<T, Tweenable>>>;
	duration: number;
	easing?: Enum.EasingStyle;
	direction?: Enum.EasingDirection;
	delay?: number;
};
export type AnimationPart<T extends Instance = Instance> = AnimationPartTween<T>;
export type AnimationExec<T extends Instance> = (gui: T) => void;

export type AnimationPart1 = {
	reset(): void;
	run(): void;
};

export default class Animation {
	private readonly parts: readonly AnimationPart1[];

	constructor(parts: readonly AnimationPart1[]) {
		this.parts = parts;
	}

	/** Reset the properties to their default positions, non-animated. */
	public reset() {
		this.parts.forEach((part) => {
			part.reset();
		});
	}

	public run() {
		this.parts.forEach((part) => {
			//TweenService.Create(gui, new TweenInfo(1), properties).Play();

			part.run();

			/*
			const tween = TweenService.Create(
				part.gui,
				new TweenInfo(part.duration, part.easing, part.direction, 1, false, part.delay),
				part.properties,
			);

			tween.Play();
			*/
		});
	}

	/**
	 * Subscribes to the observable changed event and tweens the gui when it's changed.
	 * Also immediately sets the properties on prepare.
	 */
	public static value<T extends Instance, TValue>(
		event: ComponentEventHolder,
		gui: T,
		value: ReadonlyObservableValue<TValue>,
		converter: (value: TValue) => Partial<ExtractMembers<T, Tweenable>>,
		tweenInfo: TweenInfo,
	) {
		event.onPrepare(() => Objects.assign(gui, converter(value.get())), true);
		event.subscribeObservable(value, (value) => GuiAnimator.tween(gui, converter(value), tweenInfo));
	}

	public static hideShow<T extends GuiObject>(
		event: ComponentEventHolder,
		gui: T,
		opened: ReadonlyObservableValue<boolean>,
		offset: UDim2,
	) {
		const pos = gui.Position;

		return this.value(
			event,
			gui as GuiObject,
			opened,
			(value) => {
				return {
					Position: value ? pos.add(offset) : pos,
				};
			},
			new TweenInfo(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		);
	}

	public static builder<T extends Instance>(gui: T) {
		const parts: AnimationPart1[] = [];

		return {
			setProperties(properties: Partial<ExtractMembers<T, Tweenable>>) {
				return this.add({
					run() {
						for (const [key, value] of Objects.entries(properties)) {
							gui[key] = value;
						}
					},
					reset() {
						for (const [key, value] of Objects.entries(properties)) {
							gui[key] = value;
						}
					},
				});
			},
			resetProperties(keys: readonly (keyof Partial<ExtractMembers<T, Tweenable>>)[]) {
				const properties: Partial<ExtractMembers<T, Tweenable>> = {};
				for (const key of keys) {
					properties[key] = gui[key];
				}

				return this.setProperties(properties);
			},

			tween(properties: Readonly<Partial<ExtractMembers<T, Tweenable>>>, info?: TweenInfo) {
				return this.add({
					run() {
						TweenService.Create(gui, info ?? new TweenInfo(0), properties).Play();
					},
					reset() {
						TweenService.Create(gui, new TweenInfo(0), properties).Play();
					},
				});
			},

			add(exec: AnimationPart1) {
				parts.push(exec);
				return this;
			},

			build() {
				return new Animation(parts);
			},
		} as const;
	}
}
