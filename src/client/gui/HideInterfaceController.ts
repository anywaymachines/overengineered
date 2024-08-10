import { ReplicatedStorage, StarterGui, UserInputService, Workspace } from "@rbxts/services";
import { ButtonControl } from "client/gui/controls/Button";
import { Gui } from "client/gui/Gui";
import { ScaledScreenGui } from "client/gui/ScaledScreenGui";
import { ObservableValue } from "shared/event/ObservableValue";
import { HostedService } from "shared/GameHost";

export class HideInterfaceController extends HostedService {
	readonly visible = new ObservableValue(true);
	private readonly guis = [Gui.getGameUI(), Gui.getUnscaledGameUI()] as const;

	constructor() {
		super();

		this.onEnable(() => {
			type HiddenUi = ScreenGui & {
				readonly Action: GuiObject & {
					readonly Hide: GuiButton;
				};
			};
			const hiddenUiOriginal = Gui.getPlayerGui<{ GameUIHidden: HiddenUi }>().GameUIHidden;
			hiddenUiOriginal.Enabled = false;

			const hiddenUi = new ScaledScreenGui(hiddenUiOriginal.Clone());
			hiddenUi.onEnable(() => (hiddenUi.instance.Enabled = true));
			hiddenUi.onDisable(() => (hiddenUi.instance.Enabled = false));
			this.onDestroy(() => hiddenUi.destroy());

			hiddenUi.add(new ButtonControl(hiddenUi.instance.Action.Hide, () => this.visible.set(true)));
			hiddenUi.instance.Parent = hiddenUiOriginal.Parent;
			hiddenUi.enable();

			this.visible.subscribe((visible) => hiddenUi.setEnabled(!visible), true);
		});

		this.event.subscribe(UserInputService.InputBegan, (input) => {
			if (input.UserInputType !== Enum.UserInputType.Keyboard) {
				return;
			}

			if (UserInputService.GetFocusedTextBox()) {
				return;
			}

			if (!input.IsModifierKeyDown("Shift") || !UserInputService.IsKeyDown(Enum.KeyCode.G)) {
				return;
			}

			this.visible.set(!this.visible.get());
		});

		this.visible.subscribe((visible) => {
			// hide screen guis
			for (const ui of this.guis) {
				ui.Enabled = visible;
			}

			// Hide core gui (excluding backpack)
			StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.All, visible);
			StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);

			// Plot owner gui hide
			Workspace.Plots.GetChildren().forEach((plot) => {
				const ownerGui = plot.FindFirstChild(ReplicatedStorage.Assets.PlotOwnerGui.Name) as
					| BillboardGui
					| undefined;
				if (ownerGui) {
					ownerGui.Enabled = visible;
				}
			});
		});
	}
}
