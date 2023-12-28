import Control from "client/base/Control";
import PopupController from "client/controller/PopupController";
import DeleteTool from "client/tools/DeleteTool";
import GuiAnimator from "../../GuiAnimator";
import { ButtonControl } from "../../controls/Button";

export type DeleteToolSceneDefinition = GuiObject & {
	TouchControls: Frame & {
		DeleteButton: TextButton;
	};
	DeleteAllButton: GuiButton;
};

export default class DeleteToolScene extends Control<DeleteToolSceneDefinition> {
	private tool: DeleteTool;

	constructor(gui: DeleteToolSceneDefinition, tool: DeleteTool) {
		super(gui);
		this.tool = tool;

		// TODO: do something
		const e = (element: GuiObject, duration = 0.2) => {
			return {
				startPos: element.Position,
				offset: new UDim2(0, 100, 0, 0),
				show() {
					element.Position = this.startPos.add(this.offset);
					element.Visible = true;
					GuiAnimator.tween(
						element,
						{ Position: this.startPos },
						new TweenInfo(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
					);
				},
				hide() {
					element.Position = this.startPos;
					GuiAnimator.tween(
						element,
						{ Position: this.startPos.add(this.offset) },
						new TweenInfo(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
					);

					spawn(() => {
						wait(duration);
						element.Visible = false;
					});
				},
			};
		};

		//const aboba = e(this.gui.TouchControls);

		this.event.onPrepare((inputType) => {
			//if (inputType === "Touch") aboba.hide();
			//else aboba.show();

			this.gui.TouchControls.Visible = false;
		}, true);
		this.event.onPrepare((inputType) => {
			this.gui.DeleteAllButton.Visible = inputType !== "Gamepad";
		}, true);

		this.event.subscribe(this.tool.onClearAllRequested, () => this.suggestClearAll());

		const deleteAllButton = this.added(new ButtonControl(this.gui.DeleteAllButton));
		this.event.subscribe(deleteAllButton.activated, () => this.suggestClearAll());
	}

	public show() {
		super.show();
		GuiAnimator.transition(this.gui.DeleteAllButton, 0.2, "down");
	}

	private suggestClearAll() {
		PopupController.instance.showConfirmation(
			"Are you sure you want to delete all blocks?",
			() => this.tool.deleteBlocks("all"),
			() => {},
		);
	}

	protected prepareTouch(): void {
		// Prepare touch events
		this.eventHandler.subscribe(this.gui.TouchControls.DeleteButton.MouseButton1Click, () => {
			const highlighted = this.tool.highlightedBlock.get();
			if (highlighted) this.tool.deleteBlocks([highlighted]);
		});

		// Delete button
		this.eventHandler.subscribe(this.tool.highlightedBlock.changed, (block) => {
			if (block !== undefined) {
				this.gui.TouchControls.Visible = true;
				GuiAnimator.transition(this.gui.TouchControls, 0.1, "left");
			} else {
				this.gui.TouchControls.Visible = false;
			}
		});
	}
}
