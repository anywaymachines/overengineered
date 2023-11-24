import { TweenService } from "@rbxts/services";
import GuiAnimator from "./GuiAnimator";
import BuildingModeScene from "./scenes/BuildingModeScene";

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

	static start() {
		/*const anim = Animation.builder(BuildingModeScene.instance.getGui().ActionBarGui)
			.add({
				gui: BuildingModeScene.instance.getGui().ActionBarGui,
				properties: { Position: new UDim2(2, 0, 0, 0) },
				duration: 10,
				delay: 1,
				easing: Enum.EasingStyle.Quad,
				direction: Enum.EasingDirection.Out,
			})
			.build();*/

		Animation.builder(BuildingModeScene.instance.getGui().ActionBarGui).resetProperties(["Position"]);
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

				this.setProperties(properties as Partial<ExtractMembers<T, Tweenable>>);
			},
			setProperties(properties: Readonly<Partial<ExtractMembers<T, Tweenable>>>) {
				this.add((gui) => {
					TweenService.Create(gui, new TweenInfo(), properties).Play();
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
