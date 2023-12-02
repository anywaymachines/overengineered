import Signal from "@rbxts/signal";
import ToolBase from "client/base/ToolBase";
import InputController from "client/controller/InputController";
import Signals from "client/event/Signals";
import LogControl from "client/gui/static/LogControl";
import BlockRegistry from "shared/registry/BlocksRegistry";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import BlockSelector from "./BlockSelector";
import { initializeMultiBlockSelection, initializeSingleBlockSelection } from "./MultiBlockSelector";

export default class ConfigTool extends ToolBase {
	public readonly selectedBlocksChanged = new Signal<(selected: Highlight[]) => void>();
	private readonly selected: Highlight[] = [];

	protected prepare() {
		super.prepare();

		const selectionFilter = (target: Model) =>
			"getConfigDefinitions" in
			(BlockRegistry.getBlockByID(target.GetAttribute("id") as string) as AbstractBlock | ConfigurableBlock);

		initializeSingleBlockSelection(
			this.eventHandler,
			this.inputHandler,
			() => {},
			async (block) => {
				if (!block) return;
				// if (Signals.INPUT_TYPE.get() !== "Desktop")  return;
				this.selectBlock(block);
			},
			selectionFilter,
		);
		initializeMultiBlockSelection(this.eventHandler, (blocks) => {
			for (const block of blocks) {
				this.selectBlock(block);
			}
		});

		this.eventHandler.subscribe(Signals.BLOCKS.REMOVED, (model) => {
			const removed = this.selected.filter((sel) => sel.Parent === model);

			for (const sel of removed) {
				sel.Destroy();
				this.selected.remove(this.selected.indexOf(sel));
			}

			this.selectedBlocksChanged.Fire(this.selected);
		});
	}

	private selectBlock(block: Model | undefined) {
		const pc = Signals.INPUT_TYPE.get() === "Desktop";
		const add = Signals.INPUT_TYPE.get() === "Gamepad" || InputController.isShiftPressed();

		if (pc && !add) {
			for (const sel of this.selected) sel.Destroy();

			this.selected.clear();
			this.selectedBlocksChanged.Fire(this.selected);
		}

		if (!block) {
			if (!pc) LogControl.instance.addLine("Block is not targeted!");
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

	activate(): void {
		super.activate();
	}

	deactivate(): void {
		super.deactivate();
		this.unselectAll();
	}
}
