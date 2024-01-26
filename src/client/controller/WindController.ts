import { TweenService, Workspace } from "@rbxts/services";
import GameEnvironmentController from "./GameEnvironmentController";

export default class WindController {
	static initialize() {
		Workspace.GetAttributeChangedSignal("GlobalWindValue").Connect(() => this.updateWind());

		this.updateWind();
	}

	static updateWind() {
		const windValue: Vector3 = (Workspace.GetAttribute("GlobalWindValue") as Vector3 | undefined) ?? Vector3.zero;
		const smoothTime = (Workspace.GetAttribute("GlobalWindSmoothTime") as number | undefined) ?? 0;

		const percentage = math.clamp(
			1 - GameEnvironmentController.currentHeight / GameEnvironmentController.ZeroAirHeight,
			0,
			1,
		);

		const convertedWindValue = windValue.mul(percentage);
		const convertedSmoothTime = percentage < 0.2 ? 5 : smoothTime;

		const windTween = TweenService.Create(Workspace, new TweenInfo(convertedSmoothTime), {
			GlobalWind: convertedWindValue,
		});
		windTween.Play();
	}
}
