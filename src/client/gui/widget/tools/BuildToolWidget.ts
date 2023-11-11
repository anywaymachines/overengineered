import Widget from "client/base/Widget";
import GuiAnimator from "client/gui/GuiAnimator";
import BuildTool from "client/tools/BuildTool";

export default class BuildToolWidget extends Widget {
	private gui: BuildToolGui;
	private tool: BuildTool;

	// Templates
	private categoryTemplate: TextButton & { Frame: Frame & { ImageLabel: ImageLabel }; TextLabel: TextLabel };
	private blockTemplate: TextButton & { Frame: Frame & { LimitLabel: TextLabel }; TextLabel: TextLabel };

	constructor(buildTool: BuildTool, gui: BuildToolGui) {
		super();

		this.gui = gui;
		this.tool = buildTool;

		// Prepare templates
		this.categoryTemplate = this.gui.Selection.Buttons.CategoryTemplate.Clone();
		this.blockTemplate = this.gui.Selection.Buttons.BlockTemplate.Clone();
		this.gui.Selection.Buttons.CategoryTemplate.Destroy();
		this.gui.Selection.Buttons.BlockTemplate.Destroy();
	}

	hideWidget(hasAnimations: boolean): void {
		super.hideWidget(hasAnimations);

		this.gui.Visible = false;
	}

	showWidget(hasAnimations: boolean): void {
		super.showWidget(hasAnimations);

		this.gui.Visible = true;
		GuiAnimator.transition(this.gui.Selection, 0.1, "right");
	}

	protected prepareDesktop(): void {
		// Empty
	}

	protected prepareGamepad(): void {
		// Empty
	}

	protected prepareTouch(): void {
		// Touchscreen controls
		// this.eventHandler.subscribe(this.gui.TouchControls.PlaceButton.MouseButton1Click, () => this.tool.place());
		// this.eventHandler.subscribe(this.gui.TouchControls.RotateRButton.MouseButton1Click, () =>
		// 	this.tool.rotate("x", true),
		// );
		// this.eventHandler.subscribe(this.gui.TouchControls.RotateTButton.MouseButton1Click, () =>
		// 	this.tool.rotate("y", true),
		// );
		// this.eventHandler.subscribe(this.gui.TouchControls.RotateYButton.MouseButton1Click, () =>
		// 	this.tool.rotate("z", true),
		// );
	}
}
