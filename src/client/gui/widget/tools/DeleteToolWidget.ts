import Widget from "client/base/Widget";
import GuiController from "client/controller/GuiController";
import PopupWidgetsController from "client/controller/PopupWidgetsController";
import GuiAnimator from "client/gui/GuiAnimator";
import DeleteTool from "client/tools/DeleteTool";

export default class DeleteToolWidget extends Widget {
	private gui: DeleteToolGui;
	private tool: DeleteTool;

	constructor(deleteTool: DeleteTool) {
		super();

		this.tool = deleteTool;
		this.gui = this.getGui();
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

	public suggestClearAll() {
		PopupWidgetsController.ConfirmPopupWidget.display(
			"Confirmation",
			"Are you sure to clear all blocks?",
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
