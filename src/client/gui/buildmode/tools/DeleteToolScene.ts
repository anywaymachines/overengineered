import Control from "client/gui/Control";
import GuiAnimator from "client/gui/GuiAnimator";
import { ButtonControl } from "client/gui/controls/Button";
import ConfirmPopup from "client/gui/popup/ConfirmPopup";
import DeleteTool from "client/tools/DeleteTool";

export type DeleteToolSceneDefinition = GuiObject & {
	readonly TouchControls: Frame & {
		readonly DeleteButton: TextButton;
	};
	readonly Bottom: {
		readonly DeleteAllButton: GuiButton;
	};
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

		this.onPrepare((inputType) => {
			//if (inputType === "Touch") aboba.hide();
			//else aboba.show();

			this.gui.TouchControls.Visible = false;
		});
		this.onPrepare((inputType) => {
			this.gui.Bottom.DeleteAllButton.Visible = inputType !== "Gamepad";
		});

		this.event.subscribe(this.tool.onClearAllRequested, () => this.suggestClearAll());

		const deleteAllButton = this.added(new ButtonControl(this.gui.Bottom.DeleteAllButton));
		this.event.subscribe(deleteAllButton.activated, () => this.suggestClearAll());
	}

	public show() {
		super.show();
		GuiAnimator.transition(this.gui.Bottom.DeleteAllButton, 0.2, "down");
	}

	private suggestClearAll() {
		ConfirmPopup.showPopup(
			"Are you sure you want to delete all blocks?",
			"It will be impossible to undo this action",
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
