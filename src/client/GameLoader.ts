import { Players, ReplicatedStorage, StarterGui, UserInputService, Workspace } from "@rbxts/services";
import { PlayerDataStorage } from "client/PlayerDataStorage";
import { LoadingController } from "client/controller/LoadingController";
import { Gui } from "client/gui/Gui";
import { ScaledScreenGui } from "client/gui/ScaledScreenGui";
import { SharedPlots } from "shared/building/SharedPlots";
import { InstanceComponent } from "shared/component/InstanceComponent";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { SharedGameLoader } from "shared/init/SharedGameLoader";

namespace BSOD {
	type BsodControlDefinition = ScreenGui & {
		readonly Background: GuiObject & {
			readonly PlaneEngineers: TextLabel;
			readonly Text: TextLabel;
			readonly Rejoin: TextLabel;
		};
	};
	class BsodControl extends InstanceComponent<BsodControlDefinition> {
		constructor(gui: BsodControlDefinition) {
			super(gui);

			let showLine = true;
			this.event.loop(1, () => {
				showLine = !showLine;
				this.instance.Background.Rejoin.Text = "Rejoin the game to continue " + (showLine ? "_" : " ");
			});

			const showAfter = (delay: number, instance: GuiObject) => {
				instance.Visible = false;
				task.delay(delay, () => (instance.Visible = true));
			};

			showAfter(0.5, gui.Background.PlaneEngineers);
			showAfter(1.5, gui.Background.Text);
			showAfter(1.9, gui.Background.Rejoin);
		}

		show(text: string) {
			this.instance.Background.Text.Text = text;
			this.instance.Enabled = true;
			this.enable();
		}
	}

	export function show(text: string) {
		const instance = Gui.getPlayerGui<{ BSOD: BsodControlDefinition }>().BSOD;

		for (const ui of Enum.CoreGuiType.GetEnumItems()) {
			StarterGui.SetCoreGuiEnabled(ui, false);
		}
		UserInputService.MouseIconEnabled = false;

		new ScaledScreenGui(instance).enable();
		new BsodControl(instance).show(text);

		for (const screen of Gui.getPlayerGui().GetChildren()) {
			if (screen === instance) {
				continue;
			}

			if (screen.IsA("ScreenGui")) {
				screen.Enabled = false;
			}
		}
	}
}

SharedGameLoader.loadingStarted.Connect((name) => {
	if (name !== undefined) {
		LoadingController.show(name);
	}
});
SharedGameLoader.loadingCompleted.Connect((name) => {
	LoadingController.hide();
});
SharedGameLoader.loadingError.Connect((err) => {
	const str = `
An error has occurred: The game has failed to load.

Screenshot this screen and send it to the developers in the official Discord server.

Press quit to return to Roblox, or
Press Alt+F4 to restart Roblox. If you do this, you will not lose any unsaved information in your slot.

Player: ${Players.LocalPlayer.UserId} ${Players.LocalPlayer.Name}
${GameDefinitions.getEnvironmentInfo().join("\n")}
Error: ${err}
`.gsub("^%s*(.-)%s*$", "%1")[0];

	BSOD.show(str);
});

print("`INGAMELOADER", debug.traceback());
export namespace GameLoader {
	export let mainLoaded = false;
	mainLoaded = false;

	export const { lazyLoader, wrapLoading } = SharedGameLoader;

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
