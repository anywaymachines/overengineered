import InputController from "client/controller/InputController";
import LogControl from "client/gui/static/LogControl";
import BuildingMode from "client/modes/build/BuildingMode";
import ToolBase from "client/tools/ToolBase";
import HoveredBlockHighlighter from "client/tools/selectors/HoveredBlockHighlighter";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import BlockManager from "shared/building/BlockManager";
import SharedPlots from "shared/building/SharedPlots";
import Signal from "shared/event/Signal";
import Objects from "shared/fixes/objects";

export default class ConfigTool extends ToolBase {
	readonly selectedBlocksChanged = new Signal<(selected: (SelectionBox & { Parent: BlockModel })[]) => void>();
	private readonly selected: (SelectionBox & { Parent: BlockModel })[] = [];

	constructor(mode: BuildingMode) {
		super(mode);

		const hoverSelector = this.parent(new HoveredBlockHighlighter((block) => this.canBeSelected(block)));
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
				this.inputHandler.onMouse1Down(() => {
					if (!InputController.isCtrlPressed()) {
						fireSelected();
					}
				}, false);
			} else if (input === "Gamepad") {
				this.inputHandler.onKeyDown("ButtonX", fireSelected);
			} else if (input === "Touch") {
				this.inputHandler.onTouchTap(fireSelected, false);
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

		// TODO: remove false later, deselects everything after any change
		if (false as boolean)
			this.subscribeToCurrentPlot((plot) => {
				if (!this.selected.any((s) => s.IsDescendantOf(plot.instance))) {
					return;
				}

				for (const sel of this.selected) {
					sel.Destroy();
				}

				this.selected.clear();
				this.selectedBlocksChanged.Fire(this.selected);
			});
	}

	private canBeSelected(block: BlockModel): boolean {
		const config = blockConfigRegistry[BlockManager.manager.id.get(block) as keyof typeof blockConfigRegistry];
		if (!config) return false;

		if (!Objects.values(config.input).find((v) => !(v as BlockConfigTypes.Definition).configHidden)) {
			return false;
		}

		return true;
	}
	private canBeSelectedConsideringCurrentSelection(block: BlockModel): boolean {
		if (!this.canBeSelected(block)) {
			return false;
		}

		const differentId = this.selected.find(
			(s) => BlockManager.manager.id.get(s.Parent) !== (BlockManager.manager.id.get(block) as string),
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

			if (!block) this.selectedBlocksChanged.Fire(this.selected);
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

	selectBlockByUuid(uuid: BlockUuid) {
		this.selectBlock(SharedPlots.getBlockByUuid(this.targetPlot.get().instance, uuid));
	}
	unselectAll() {
		this.selected.forEach((element) => element.Destroy());
		this.selected.clear();
		this.selectedBlocksChanged.Fire(this.selected);
	}

	getDisplayName(): string {
		return "Configure";
	}

	getImageID(): string {
		return "http://www.roblox.com/asset/?id=15414751900";
	}

	disable() {
		super.disable();
		this.unselectAll();
	}
}
