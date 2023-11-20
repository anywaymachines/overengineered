import { GuiService, Players, Workspace } from "@rbxts/services";
import Signal from "@rbxts/signal";
import ToolBase from "client/base/ToolBase";
import GuiController from "client/controller/GuiController";
import InputController from "client/controller/InputController";
import StaticWidgetsController from "client/controller/StaticWidgetsController";
import Signals from "client/event/Signals";
import ConfigToolWidget from "client/gui/widget/tools/ConfigToolWidget";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";
import BlockRegistry from "shared/registry/BlocksRegistry";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import PlayerUtils from "shared/utils/PlayerUtils";

export default class ConfigTool extends ToolBase {
	public readonly selectedBlocksChanged = new Signal<(selected: Highlight[]) => void>();

	private readonly selected: Highlight[] = [];
	private highlight?: Highlight;

	// GUI
	private readonly widget: ConfigToolWidget = new ConfigToolWidget(this);

	protected prepare(): void {
		super.prepare();

		this.eventHandler.subscribe(Signals.BLOCKS.ADDED, () => this.updatePosition());
		this.eventHandler.subscribe(Signals.BLOCKS.REMOVED, () => this.updatePosition());

		this.eventHandler.subscribe(Signals.BLOCKS.REMOVED, (model) => {
			const removed = this.selected.filter((sel) => sel.Parent === model);

			for (const sel of removed) {
				sel.Destroy();
				this.selected.remove(this.selected.indexOf(sel));
			}

			this.selectedBlocksChanged.Fire(this.selected);
		});
	}

	protected prepareDesktop(): void {
		this.eventHandler.subscribe(this.mouse.Button1Down, () =>
			this.selectBlock(true, InputController.isShiftPressed()),
		);
		this.eventHandler.subscribe(this.mouse.Move, () => this.updatePosition());
	}

	protected prepareTouch(): void {
		// Touch controls
		this.inputHandler.onTouchTap(() => this.updatePosition());
	}

	protected prepareGamepad(): void {
		// Gamepad buttons controls
		this.inputHandler.onKeyPressed(Enum.KeyCode.ButtonX, () => this.selectBlock());

		// Prepare console events
		this.eventHandler.subscribe(Signals.CAMERA.MOVED, () => this.updatePosition());
	}

	public updatePosition() {
		// ERROR: If ESC menu is open - freeze movement
		if (GuiService.MenuIsOpen) {
			return;
		}

		// ERROR: Non-alive players bypass
		if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
			return;
		}

		// ERROR: Fix buttons positions
		if (GuiController.isCursorOnVisibleGui()) {
			return;
		}

		const target = this.mouse.Target;

		this.destroyHighlight();

		// ERROR: Mouse is in space
		if (target === undefined) {
			return;
		}

		// ERROR: Useless parts
		if (target.Parent === undefined || !target.IsDescendantOf(Workspace.Plots)) {
			return;
		}

		const parentPlot = SharedPlots.getPlotByBlock(target.Parent as Model);

		// ERROR: No plot?
		if (parentPlot === undefined) {
			return;
		}

		// ERROR: Plot is forbidden
		if (!BuildingManager.isBuildingAllowed(parentPlot, Players.LocalPlayer)) {
			return;
		}

		function isConfigurableBlock(block: AbstractBlock): block is ConfigurableBlock & AbstractBlock {
			return "getConfigDefinitions" in block;
		}
		if (!isConfigurableBlock(BlockRegistry.getBlockByID(target.Parent.GetAttribute("id") as string)!)) {
			return;
		}

		// Create highlight
		this.createHighlight(target);
	}

	private selectBlock(pc = false, add = true) {
		if (pc && !add) {
			for (const sel of this.selected) sel.Destroy();

			this.selected.clear();
			this.selectedBlocksChanged.Fire(this.selected);
		}

		const block = this.highlight?.Parent;
		if (!block) {
			if (!pc) StaticWidgetsController.logStaticWidget.addLine("Block is not targeted!");
			return;
		}

		const addHighlight = () => {
			const instance = new Instance("Highlight");
			instance.Parent = block;
			instance.Adornee = block;
			instance.FillColor = Color3.fromRGB(0, 0, 255);

			this.selected.push(instance);
			this.selectedBlocksChanged.Fire(this.selected);
		};
		const removeOrAddHighlight = () => {
			const existing = this.selected.findIndex((sel) => sel.Parent === block);
			if (existing !== -1) {
				this.selected[existing].Destroy();
				this.selected.remove(existing);
				this.selectedBlocksChanged.Fire(this.selected);
			} else addHighlight();
		};

		if (pc) removeOrAddHighlight();
		else {
			if (add) addHighlight();
			else removeOrAddHighlight();
		}
	}

	public createHighlight(target: BasePart) {
		this.highlight = new Instance("Highlight");
		this.highlight.Parent = target.Parent;
		this.highlight.Adornee = target.Parent;
	}

	public destroyHighlight() {
		this.highlight?.Destroy();
		this.highlight = undefined;
	}

	public unselectAll() {
		this.selected.forEach((element) => {
			element.Destroy();
		});
		this.selected.clear();
	}

	getDisplayName(): string {
		return "Configuration Mode";
	}

	getImageID(): string {
		return "http://www.roblox.com/asset/?id=15414751900";
	}

	getShortDescription(): string {
		return "Configure blocks";
	}

	public getGamepadTooltips(): { image: string; text: string }[] {
		return [];
	}

	public getKeyboardTooltips() {
		return [];
	}

	activate(): void {
		super.activate();
		this.updatePosition();
	}

	deactivate(): void {
		super.deactivate();

		this.destroyHighlight();
		this.unselectAll();
	}
}
