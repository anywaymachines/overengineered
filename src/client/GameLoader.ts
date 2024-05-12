import { Players, ReplicatedStorage, Workspace } from "@rbxts/services";
import { PlayerDataStorage } from "client/PlayerDataStorage";
import { SharedPlots } from "shared/building/SharedPlots";

print("`INGAMELOADER", debug.traceback());
export namespace GameLoader {
	export function waitForDataStorage() {
		while (!PlayerDataStorage.data.get()) {
			task.wait();
		}

		return PlayerDataStorage.data.get()!;
	}
	export function waitForPlot() {
		const userid = Players.LocalPlayer.UserId;
		while (!SharedPlots.tryGetPlotByOwnerID(userid)) {
			task.wait(0.2);
		}

		return SharedPlots.getPlotComponentByOwnerID(userid);
	}
	export function waitForServer() {
		while (!(Workspace.GetAttribute("loaded") as boolean | undefined)) {
			task.wait();
		}
	}

	export function waitForEverything(progress?: (operation: string) => void) {
		print("`waiting for EVERYUTHGUING", debug.traceback());
		const pp = progress;
		progress = (operation) => {
			pp?.(operation);
			$log(operation);
		};

		progress?.("Waiting for the assets");
		ReplicatedStorage.WaitForChild("Assets");

		progress?.("Waiting for the data");
		waitForDataStorage();

		progress?.("Waiting for the plot");
		waitForPlot();

		progress?.("Waiting for the server");
		waitForServer();
	}
}
