import { Players, RunService } from "@rbxts/services";
import { ObservableValue } from "shared/event/ObservableValue";

export namespace Switches {
	export const isNewBlockLogic = new ObservableValue(
		RunService.IsClient() && RunService.IsStudio() && Players.LocalPlayer.Name === "i3ymm",
	);
}
