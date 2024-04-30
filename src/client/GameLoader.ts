import { Players, ReplicatedStorage, Workspace } from "@rbxts/services";
import { PlayerDataStorage } from "client/PlayerDataStorage";
import { Logger } from "shared/Logger";
import { SharedPlots } from "shared/building/SharedPlots";

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
		const pp = progress;
		progress = (operation) => {
			pp?.(operation);
			new Logger("GameLoader").info(operation);
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
