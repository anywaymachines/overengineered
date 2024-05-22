import { TweenService, Workspace } from "@rbxts/services";
import { GameEnvironmentController } from "client/controller/GameEnvironmentController";
import { GameEnvironment } from "shared/data/GameEnvironment";

export namespace WindController {
	export function initialize() {
		Workspace.GetAttributeChangedSignal("GlobalWindValue").Connect(updateWind);
		updateWind();
	}

	export function updateWind() {
		const windValue: Vector3 = (Workspace.GetAttribute("GlobalWindValue") as Vector3 | undefined) ?? Vector3.zero;
		const smoothTime = (Workspace.GetAttribute("GlobalWindSmoothTime") as number | undefined) ?? 0;

		const percentage = math.clamp(
			1 - GameEnvironmentController.currentHeight / GameEnvironment.ZeroAirHeight,
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
