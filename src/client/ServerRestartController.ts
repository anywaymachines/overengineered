import { ReplicatedFirst } from "@rbxts/services";
import { Remotes } from "shared/Remotes";

type t = {
	["3D Atmosphere"]: {
		Customize: {
			AltitudeOffset: NumberValue;
			AtmosphereColor: Color3Value;
			AtmosphereTransparency: NumberValue;
		};
	};
};
const atmo = (ReplicatedFirst as unknown as t)["3D Atmosphere"];
const atmoStartColor = atmo.Customize.AtmosphereColor.Value;
const atmoEndColor = Color3.fromRGB(200, 25, 25);

Remotes.Client.Get("ServerRestartProgress").Connect((progress) => {
	atmo.Customize.AtmosphereColor.Value = atmoStartColor.Lerp(atmoEndColor, progress);
	atmo.Customize.AtmosphereTransparency.Value = 1 - progress;
});

export namespace ServerRestartController {
	// empty method to trigger subscription
	export function initialize() {}

	export function sendToServer() {
		Remotes.Client.GetNamespace("Admin").Get("Restart").SendToServer();
	}
}
