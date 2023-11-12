import { Lighting, TweenService } from "@rbxts/services";
import Scene from "./Scene";

export default abstract class PopupScene extends Scene {
	private readonly blur: BlurEffect = new Instance("BlurEffect", Lighting);

	constructor() {
		super();

		this.blur.Size = 0;
	}

	/** Function for hiding the scene */
	hideScene(): void {
		// Unblurring
		const info = { Size: 0 };
		const tween = TweenService.Create(this.blur, new TweenInfo(2), info);
		tween.Play();
	}
	/** Function for displaying the scene */
	showScene(): void {
		// Blurring
		const info: Partial<ExtractMembers<BlurEffect, Tweenable>> = { Size: 15 };
		const tween = TweenService.Create(this.blur, new TweenInfo(2), info);
		tween.Play();
	}
}
