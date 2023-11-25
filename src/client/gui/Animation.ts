import { TweenService } from "@rbxts/services";
import GuiAnimator from "./GuiAnimator";
import BuildingModeScene from "./scenes/BuildingModeScene";
import Control from "client/base/Control";

export type AnimationPart<T extends Instance = Instance> = {
	gui: T;
	properties: Readonly<Partial<ExtractMembers<T, Tweenable>>>;
	duration: number;
	easing?: Enum.EasingStyle;
	direction?: Enum.EasingDirection;
	delay?: number;

	exec: AnimationExec<T>;
};
export type AnimationExec<T extends Instance> = (gui: T) => void;

export default class Animation {
	private readonly parts: readonly AnimationPart[];

	constructor(parts: readonly AnimationPart[]) {
		this.parts = parts;
	}

	public run() {
		this.parts.forEach((part) => {
			const tween = TweenService.Create(
				part.gui,
				new TweenInfo(part.duration, part.easing, part.direction, 1, false, part.delay),
				part.properties,
			);

			tween.Play();
		});
	}

	public static builder<T extends Instance>(gui: T) {
		const parts: AnimationPart[] = [];

		return {
			resetProperties(keys: readonly (keyof Partial<ExtractMembers<T, Tweenable>>)[]) {
				const properties: Partial<
					Record<keyof Partial<ExtractMembers<T, Tweenable>>, T[keyof Partial<ExtractMembers<T, Tweenable>>]>
				> = {};

				for (const key of keys) {
					properties[key] = gui[key];
				}

				return this.tween(properties as Partial<ExtractMembers<T, Tweenable>>);
			},

			tween(properties: Readonly<Partial<ExtractMembers<T, Tweenable>>>, info?: TweenInfo) {
				return this.add((gui) => {
					TweenService.Create(gui, info ?? new TweenInfo(), properties).Play();
				});
			},

			add(exec: AnimationExec<T>) {
				//parts.push(exec);
				return this;
			},

			build() {
				return new Animation(parts);
			},
		} as const;
	}
}
