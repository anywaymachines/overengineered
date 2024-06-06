import { Players, StarterGui, UserInputService } from "@rbxts/services";
import { Gui } from "client/gui/Gui";
import { ScaledScreenGui } from "client/gui/ScaledScreenGui";
import { InstanceComponent } from "shared/component/InstanceComponent";
import { GameDefinitions } from "shared/data/GameDefinitions";

export namespace BSOD {
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

	export function showWithDefaultText(text: string) {
		const str = `
An error has occurred: The game has failed to load.

Screenshot this screen and send it to the developers in the official community server.

Press quit to return to Roblox, or
Press Alt+F4 to restart Roblox. If you do this, you will not lose any unsaved information in your slot.

Player: ${Players.LocalPlayer.UserId} ${Players.LocalPlayer.Name}
${GameDefinitions.getEnvironmentInfo().join("\n")}
Error: ${text}
`.gsub("^%s*(.-)%s*$", "%1")[0];

		show(str);
	}
	function show(text: string) {
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
