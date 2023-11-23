import Scene from "client/base/Scene";
import DeleteTool from "client/tools/DeleteTool";
import GuiAnimator from "../GuiAnimator";

export type DeleteToolSceneDefinition = GuiObject & {
	TouchControls: Frame & {
		DeleteButton: TextButton;
	};
	DeleteAllButton: GuiButton;
};

export default class DeleteToolScene extends Scene<DeleteToolSceneDefinition> {
	private tool: DeleteTool;

	constructor(gui: DeleteToolSceneDefinition, tool: DeleteTool) {
		super(gui);
		this.tool = tool;
	}

	protected prepare(): void {
		super.prepare();

		this.gui.DeleteAllButton.Visible = true;
		this.gui.TouchControls.Visible = false;
	}

	protected prepareDesktop(): void {
		// Events
		this.eventHandler.subscribe(this.gui.DeleteAllButton.MouseButton1Click, () => this.suggestClearAll());
	}

	protected prepareTouch(): void {
		this.gui.TouchControls.Visible = true;
		GuiAnimator.transition(this.gui.TouchControls, 0.2, "left");

		// Events
		this.eventHandler.subscribe(this.gui.DeleteAllButton.MouseButton1Click, () => this.suggestClearAll());

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
	}

	protected prepareGamepad(): void {
		this.gui.DeleteAllButton.Visible = false;
	}

	private suggestClearAll() {}
}
