import { LoadingController } from "client/controller/LoadingController";

export namespace LoadingTests {
	export function loading() {
		LoadingController.show("Testing stuff");
	}
	export function nonLoading() {
		LoadingController.hide();
	}
}
