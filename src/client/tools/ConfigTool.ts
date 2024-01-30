import Signal from "@rbxts/signal";
import ToolBase from "client/base/ToolBase";
import InputController from "client/controller/InputController";
import BuildingMode from "client/controller/modes/BuildingMode";
import Signals from "client/event/Signals";
import LogControl from "client/gui/static/LogControl";
import { BlockConfigDefinition } from "shared/BlockConfigDefinitionRegistry";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import Objects from "shared/_fixes_/objects";
import HoveredBlockHighlighter from "./selectors/HoveredBlockHighlighter";

export default class ConfigTool extends ToolBase {
	public readonly selectedBlocksChanged = new Signal<(selected: (SelectionBox & { Parent: BlockModel })[]) => void>();
	private readonly selected: (SelectionBox & { Parent: BlockModel })[] = [];

	constructor(mode: BuildingMode) {
		super(mode);

		const hoverSelector = this.add(new HoveredBlockHighlighter((block) => this.canBeSelected(block)));
		const fireSelected = () => {
			spawn(() => {
				task.wait();
				const block = hoverSelector.highlightedBlock.get();
				if (!block) return;
				this.selectBlockByClick(block);
			});
		};

		this.onPrepare((input) => {
			if (input === "Desktop") {
				this.eventHandler.subscribe(this.mouse.Button1Down, () => {
					if (!InputController.isCtrlPressed()) {
						fireSelected();
					}
				});
			} else if (input === "Gamepad") {
				this.inputHandler.onKeyDown("ButtonX", fireSelected);
			} else if (input === "Touch") {
				this.inputHandler.onTouchTap(fireSelected);
			}
		});

		// removed because doesnt follow the "single block type" rule
		/*
		const boxSelector = this.add(new BoxSelector(filter));
		this.event.subscribe(boxSelector.submitted, (blocks) => {
			for (const block of blocks) {
				this.trySelectBlock(block);
			}
		});
		*/

		this.event.subscribe(Signals.BLOCKS.BLOCK_REMOVED, (model) => {
			const removed = this.selected.filter((sel) => sel.Parent === model);

			for (const sel of removed) {
				sel.Destroy();
				this.selected.remove(this.selected.indexOf(sel));
			}

			this.selectedBlocksChanged.Fire(this.selected);
		});
	}

	private canBeSelected(block: BlockModel): boolean {
		const config = blockConfigRegistry[block.GetAttribute("id") as keyof typeof blockConfigRegistry];
		if (!config) return false;

		if (!Objects.values(config.input).find((v) => !(v as BlockConfigDefinition).configHidden)) {
			return false;
		}

		return true;
	}
	private canBeSelectedConsideringCurrentSelection(block: BlockModel): boolean {
		if (!this.canBeSelected(block)) {
			return false;
		}

		const differentId = this.selected.find(
			(s) => (s.Parent.GetAttribute("id") as string) !== (block.GetAttribute("id") as string),
		);
		return differentId === undefined;
	}
	private selectBlock(block: BlockModel) {
		const instance = new Instance("SelectionBox") as SelectionBox & { Parent: BlockModel };
		instance.Parent = block;
		instance.Adornee = block;
		instance.LineThickness = 0.05;
		instance.Color3 = Color3.fromRGB(0, 255 / 2, 255);

		this.selected.push(instance);
		this.selectedBlocksChanged.Fire(this.selected);
	}
	private selectBlockByClick(block: BlockModel | undefined) {
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
			} else {
				if (!this.canBeSelectedConsideringCurrentSelection(block)) {
					LogControl.instance.addLine("Could not select different blocks");
					return;
				}

				this.selectBlock(block);
			}
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
