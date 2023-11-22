import GuiController from "client/controller/GuiController";
import StaticWidgetsController from "client/controller/StaticWidgetsController";
import GuiAnimator from "client/gui/GuiAnimator";
import DeleteTool from "client/tools/DeleteTool";
import ToolWidget from "./ToolWidget";

export default class DeleteToolWidget extends ToolWidget<DeleteTool> {
	private gui: DeleteToolGui;

	constructor(tool: DeleteTool) {
		super(tool);
		this.gui = this.getGui();

		this.eventHandler.subscribe(tool.onClearAllRequested, () => this.suggestClearAll());
	}

	showWidget(hasAnimations: boolean): void {
		super.showWidget(hasAnimations);

		this.gui.Visible = true;
	}

	hideWidget(hasAnimations: boolean): void {
		super.hideWidget(hasAnimations);

		this.gui.Visible = false;
	}

	private getGui() {
		if (!(this.gui !== undefined && this.gui.Parent !== undefined)) {
			this.gui = GuiController.getGameUI().DeleteToolGui;
		}

		return this.gui;
	}

	isVisible(): boolean {
		return this.gui.Visible;
	}

	private suggestClearAll() {
		StaticWidgetsController.confirmWidget.display(
			"Confirmation",
			"Are you sure you want to clear all blocks?",
			async () => await this.tool.clearAll(),
		);
	}

	protected prepare(): void {
		this.gui.TouchControls.Visible = false;

		this.gui.DeleteAllButton.Visible = true;
		GuiAnimator.transition(this.gui.DeleteAllButton, 0.2, "down");

		super.prepare();
	}

	protected prepareDesktop(): void {
		// Prepare desktop events
		this.eventHandler.subscribe(this.gui.DeleteAllButton.MouseButton1Click, () => this.suggestClearAll());
	}

	protected prepareTouch(): void {
		GuiAnimator.transition(this.gui.TouchControls, 0.2, "left");

		// Touch controls
		this.inputHandler.onTouchTap(() => this.tool.updatePosition());

		// Prepare touch events
		this.eventHandler.subscribe(this.gui.TouchControls.DeleteButton.MouseButton1Click, () =>
			this.tool.deleteBlock(),
		);

		// Delete button
		this.eventHandler.subscribe(this.tool.highlight.Changed, () => {
			if (this.tool.highlight.Value !== undefined) {
				this.gui.TouchControls.Visible = true;
				GuiAnimator.transition(this.gui.TouchControls, 0.1, "left");
			} else {
				this.gui.TouchControls.Visible = false;
			}
		});

		this.eventHandler.subscribe(this.gui.DeleteAllButton.MouseButton1Click, () => this.suggestClearAll());
	}

	protected prepareGamepad(): void {
		this.gui.DeleteAllButton.Visible = false;
	}
}
