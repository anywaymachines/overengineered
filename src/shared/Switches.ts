import { Players, RunService } from "@rbxts/services";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { ObservableValue } from "shared/event/ObservableValue";
import { CustomRemotes } from "shared/Remotes";

export namespace Switches {
	const _registered = new Map<string, ObservableValue<boolean>>();
	export const registered: ReadonlyMap<string, ObservableValue<boolean>> = _registered;

	export function register(name: string, value: ObservableValue<boolean>) {
		_registered.set(name, value);

		if (RunService.IsClient() && GameDefinitions.isAdmin(Players.LocalPlayer)) {
			value.subscribe((value) => CustomRemotes.admin.setSwitch.send({ name, value }));
		}
	}

	export const isNewBlockLogic = new ObservableValue(
		RunService.IsClient() && RunService.IsStudio() && Players.LocalPlayer.Name === "i3ymm",
	);
	register("isNewBlockLogic", isNewBlockLogic);

	//

	if (RunService.IsServer()) {
		CustomRemotes.admin.setSwitch.subscribe((player, { name, value }) => {
			if (!GameDefinitions.isAdmin(player)) {
				return {
					success: false,
					message: "Not enough permissions",
				};
			}

			registered.get(name)?.set(value);
			return { success: true };
		});
	}
}
