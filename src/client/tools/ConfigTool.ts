import Signal from "@rbxts/signal";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import ToolBase from "client/base/ToolBase";
import logicRegistry from "client/blocks/LogicRegistry";
import InputController from "client/controller/InputController";
import Signals from "client/event/Signals";
import LogControl from "client/gui/static/LogControl";
import { initializeMultiBlockSelection, initializeSingleBlockSelection } from "./MultiBlockSelector";

export default class ConfigTool extends ToolBase {
	public readonly selectedBlocksChanged = new Signal<(selected: SelectionBox[]) => void>();
	private readonly selected: SelectionBox[] = [];

	protected prepare() {
		super.prepare();

		initializeSingleBlockSelection(
			this.eventHandler,
			this.inputHandler,
			() => {},
			async (block) => {
				if (!block) return;
				// if (InputController.inputType.get() !== "Desktop")  return;
				this.selectBlockByClick(block);
			},
			(target: Model) =>
				logicRegistry[target.GetAttribute("id") as string] !== undefined &&
				new logicRegistry[target.GetAttribute("id") as string]!(target) instanceof ConfigurableBlockLogic,
		);
		initializeMultiBlockSelection(this.eventHandler, (blocks) => {
			for (const block of blocks) {
				this.selectBlock(block);
			}
		});

		this.eventHandler.subscribe(Signals.BLOCKS.BLOCK_REMOVED, (model) => {
			const removed = this.selected.filter((sel) => sel.Parent === model);

			for (const sel of removed) {
				sel.Destroy();
				this.selected.remove(this.selected.indexOf(sel));
			}

			this.selectedBlocksChanged.Fire(this.selected);
		});
	}

	private selectBlock(block: Model) {
		const instance = new Instance("SelectionBox");
		instance.Parent = block;
		instance.Adornee = block;
		instance.LineThickness = 0.05;
		instance.Color3 = Color3.fromRGB(0, 255 / 2, 255);

		this.selected.push(instance);
		this.selectedBlocksChanged.Fire(this.selected);
	}
	private selectBlockByClick(block: Model | undefined) {
		const pc = InputController.inputType.get() === "Desktop";
		const add = InputController.inputType.get() === "Gamepad" || InputController.isShiftPressed();

		if (pc && !add) {
			for (const sel of this.selected) sel.Destroy();

			this.selected.clear();
			this.selectedBlocksChanged.Fire(this.selected);
		}

		if (!block) {
			if (!pc) LogControl.instance.addLine("Block is not targeted!");
			return;
		}

		const removeOrAddHighlight = () => {
			const existing = this.selected.findIndex((sel) => sel.Parent === block);
			if (existing !== -1) {
				this.selected[existing].Destroy();
				this.selected.remove(existing);
				this.selectedBlocksChanged.Fire(this.selected);
			} else this.selectBlock(block);
		};

		if (pc) removeOrAddHighlight();
		else {
			if (add) this.selectBlock(block);
			else removeOrAddHighlight();
		}
	}

	public unselectAll() {
		this.selected.forEach((element) => element.Destroy());
		this.selected.clear();
		this.selectedBlocksChanged.Fire(this.selected);
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

	public getGamepadTooltips(): { key: Enum.KeyCode; text: string }[] {
		return [];
	}

	public getKeyboardTooltips() {
		return [];
	}

	public disable() {
		super.disable();
		this.unselectAll();
	}
}
