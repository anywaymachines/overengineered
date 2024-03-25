import { LoadingController } from "client/controller/LoadingController";

export const LoadingTests = {
	loading: () => LoadingController.show("Testing stuff"),
	nonLoading: () => LoadingController.hide(),
} as const;
