import { Lighting, RunService, Workspace } from "@rbxts/services";
import { LocalPlayer } from "client/controller/LocalPlayer";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { GameEnvironment } from "shared/data/GameEnvironment";

export namespace Atmosphere {
	const clouds = Workspace.Terrain.FindFirstChildOfClass("Clouds")!;
	const darknessSkyboxID = "rbxassetid://34644652";

	const normalSkyboxData = {
		SkyboxBk: Lighting.Sky.SkyboxBk,
		SkyboxDn: Lighting.Sky.SkyboxDn,
		SkyboxFt: Lighting.Sky.SkyboxFt,
		SkyboxLf: Lighting.Sky.SkyboxLf,
		SkyboxRt: Lighting.Sky.SkyboxRt,
		SkyboxUp: Lighting.Sky.SkyboxUp,
	};

	const normalAtmosphereDensity = Lighting.Atmosphere.Density;
	const normalCloudsDensity = clouds.Density;

	export function initialize() {
		Workspace.Atmosphere.Surface.Size = new Vector3(32, 32, 32);

		// Rotation animation
		RunService.Heartbeat.Connect((dT) => {
			const playerPosition = LocalPlayer.character.get()?.GetPivot().Position;

			// Position and rotation animation
			Workspace.Atmosphere.Surface.CFrame = new CFrame(
				playerPosition?.X ?? 0,
				GameDefinitions.HEIGHT_OFFSET,
				playerPosition?.Z ?? 0,
			).mul(Workspace.Atmosphere.Surface.CFrame.Rotation);
			Workspace.Atmosphere.Surface.CFrame = Workspace.Atmosphere.Surface.CFrame.mul(
				CFrame.fromEulerAnglesXYZ(0, (dT * math.pi) / 75, 0),
			);

			const darknessReachPercent = math.clamp(
				((playerPosition?.Y ?? 0) - GameDefinitions.HEIGHT_OFFSET) / GameEnvironment.ZeroGravityHeight,
				0,
				1,
			);

			const zeroAirReachPercent = math.clamp(
				((playerPosition?.Y ?? 0) - GameDefinitions.HEIGHT_OFFSET) / (GameEnvironment.ZeroAirHeight * 0.6),
				0,
				1,
			);

			clouds.Density = (1 - zeroAirReachPercent) * normalCloudsDensity;
			Lighting.Atmosphere.Density = (1 - zeroAirReachPercent) * normalAtmosphereDensity;

			// Skybox replacements
			if (darknessReachPercent >= 1 && Lighting.Sky.SkyboxBk !== darknessSkyboxID) {
				Lighting.Sky.SkyboxBk = darknessSkyboxID;
				Lighting.Sky.SkyboxDn = darknessSkyboxID;
				Lighting.Sky.SkyboxFt = darknessSkyboxID;
				Lighting.Sky.SkyboxLf = darknessSkyboxID;
				Lighting.Sky.SkyboxRt = darknessSkyboxID;
				Lighting.Sky.SkyboxUp = darknessSkyboxID;
			} else if (darknessReachPercent < 1 && Lighting.Sky.SkyboxBk !== normalSkyboxData.SkyboxBk) {
				Lighting.Sky.SkyboxBk = normalSkyboxData.SkyboxBk;
				Lighting.Sky.SkyboxDn = normalSkyboxData.SkyboxDn;
				Lighting.Sky.SkyboxFt = normalSkyboxData.SkyboxFt;
				Lighting.Sky.SkyboxLf = normalSkyboxData.SkyboxLf;
				Lighting.Sky.SkyboxRt = normalSkyboxData.SkyboxRt;
				Lighting.Sky.SkyboxUp = normalSkyboxData.SkyboxUp;
			}
		});
	}
}
