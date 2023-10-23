import { TweenService } from "@rbxts/services";

export default class TweenUtils {
	public static tweenTransparency(gui: Instance, transparency: number, time: number) {
		const info = { Transparency: transparency } as Partial<ExtractMembers<GuiBase, Tweenable>>;
		const tween = TweenService.Create(gui, new TweenInfo(time), info);
		tween.Play();
	}
}
