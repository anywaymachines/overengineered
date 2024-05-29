import { LoadingController } from "client/controller/LoadingController";
import { GameLoader } from "client/GameLoader";
import { PlayModeController } from "client/modes/PlayModeController";
import { Controller } from "shared/component/Controller";
import { BlocksInitializer } from "shared/init/BlocksInitializer";

@injectable
export class SandboxGame extends Controller {
	constructor(@inject di: DIContainer) {
		super();

		LoadingController.show("Waiting for server");
		GameLoader.waitForServer();
		LoadingController.show("Loading the game");

		di.registerSingleton(BlocksInitializer.create());
		this.parent(di.regResolve(PlayModeController));
	}
}
