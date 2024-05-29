import { RunService } from "@rbxts/services";
import { ServerRestartController } from "server/ServerRestartController";
import { Controller } from "shared/component/Controller";
import type { DIContainer } from "shared/DI";

@injectable
export class BaseGame extends Controller {
	constructor(@inject di: DIContainer) {
		super();

		if (!RunService.IsStudio()) {
			this.parent(di.regResolve(ServerRestartController));
		}
	}
}
