import { TweenService, Workspace } from "@rbxts/services";
import GameEnvironmentController from "./GameEnvironmentController";

export default class WindController {
	static updateWater() {
		const coefficientWWSpeed = 1; // changes the scale of how much you want wind to affect WaterWaveSpeed

		const currentWind = Workspace.GlobalWind.add(new Vector3(0.1, 0.1, 0.1));
		Workspace.Terrain.WaterWaveSpeed =
			6 + (coefficientWWSpeed * currentWind.X ** ((2 + currentWind.Z) ** 2)) ** 0.5;

		const WWsize = 0.1 + currentWind.X ** ((2 + currentWind.Z) ** (2 ** (0.5 ** 0.85))) / 75;
		Workspace.Terrain.WaterWaveSize = WWsize;
	}

	static initialize() {
		Workspace.GetAttributeChangedSignal("GlobalWindValue").Connect(() => this.updateWind());

		Workspace.GetPropertyChangedSignal("GlobalWind").Connect(() => {
			this.updateWater();
		});

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
