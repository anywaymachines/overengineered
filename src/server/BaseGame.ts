import { RunService } from "@rbxts/services";
import { ServerRestartController } from "server/ServerRestartController";

export namespace BaseGame {
	export function initialize(host: GameHostBuilder) {
		if (!RunService.IsStudio()) {
			host.services.registerService(ServerRestartController);
		}
	}
}
