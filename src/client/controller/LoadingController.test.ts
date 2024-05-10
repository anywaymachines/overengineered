import { LoadingController } from "client/controller/LoadingController";

export namespace _Tests {
	export namespace LoadingControllerTests {
		export function loading() {
			LoadingController.show("Testing stuff");
		}
		export function nonLoading() {
			LoadingController.hide();
		}
	}
}
