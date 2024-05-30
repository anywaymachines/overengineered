import { Workspace } from "@rbxts/services";
import { LoadingController } from "client/controller/LoadingController";
import { GameLoader } from "client/GameLoader";
import { ClientBuildingValidationController } from "client/modes/build/ClientBuildingValidationController";
import { PlayModeController } from "client/modes/PlayModeController";
import { Controller } from "shared/component/Controller";
import { BlocksInitializer } from "shared/init/BlocksInitializer";

@injectable
export class SandboxGame extends Controller {
	constructor(@inject di: DIContainer) {
		super();

		const load = <T extends new (...args: never) => unknown>(
			clazz: T,
			args?: Partial<[...ConstructorParameters<T>]>,
		): T extends new (...args: never) => infer R ? R : never => {
			return di.regResolve(clazz, args);
		};

		LoadingController.show("Waiting for server");

		while (!(Workspace.GetAttribute("loaded") as boolean | undefined)) {
			task.wait();
		}

		GameLoader.waitForServer();
		LoadingController.show("Loading the game");

		di.registerSingleton(BlocksInitializer.create());
		this.parent(di.regResolve(PlayModeController));
		this.parent(di.regResolve(ClientBuildingValidationController));
	}
}
