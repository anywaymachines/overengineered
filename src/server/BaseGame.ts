import { RunService } from "@rbxts/services";
import { ServerRestartController } from "server/ServerRestartController";
import { Component } from "shared/component/Component";
import type { DIContainer } from "shared/DI";

@injectable
export class BaseGame extends Component {
	constructor(@inject di: DIContainer) {
		super();

		if (!RunService.IsStudio()) {
			this.parent(di.regResolve(ServerRestartController));
		}
	}
}
