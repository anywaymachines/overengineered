import InputController from "client/controller/InputController";
import Gui from "client/gui/Gui";
import BuildingMode from "client/modes/build/BuildingMode";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import ToolBase from "client/tools/ToolBase";
import { BoxSelector } from "client/tools/selectors/BoxSelector";
import HoveredBlockHighlighter from "client/tools/selectors/HoveredBlockHighlighter";
import { MovingSelector } from "client/tools/selectors/MovingSelector";
import { SelectorParent } from "client/tools/selectors/SelectorParent";
import BlockManager from "shared/building/BlockManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import ObservableValue from "shared/event/ObservableValue";

export default class PaintTool extends ToolBase {
	readonly selectedMaterial = new ObservableValue<Enum.Material>(Enum.Material.Plastic);
	readonly selectedColor = new ObservableValue<Color3>(Color3.fromRGB(255, 255, 255));
	readonly enableMaterial = new ObservableValue(true);
	readonly enableColor = new ObservableValue(true);

	constructor(mode: BuildingMode) {
		super(mode);

		const hoverHighlighter = this.parent(new HoveredBlockHighlighter((b) => this.targetPlot.get().hasBlock(b)));
		this.onPrepare((inputType) => {
			if (inputType === "Desktop") {
				hoverHighlighter.enable();
			} else {
				hoverHighlighter.disable();
			}
		});

		const selectorParent = this.parent(new SelectorParent());
		selectorParent.childSet.Connect((child) => {
			hoverHighlighter.setEnabled(!child || child instanceof MovingSelector);
		});
		this.event.subInput((ih) => {
			ih.onMouse1Down(() => {
				if (InputController.isCtrlPressed()) {
					selectorParent.tryEnableSelector(() => {
						return new BoxSelector(async (blocks) => await this.paint(blocks));
					});
				} else {
					selectorParent.tryEnableSelector(() => {
						const selected = new Map<BlockModel, readonly [material: Enum.Material, color: Color3]>();
						return new MovingSelector(
							(part) => {
								const block = BlockManager.getBlockDataByPart(part);
								if (!block) return;

								if (selected.has(block.instance)) return;

								selected.set(block.instance, [block.material, block.color]);
								this.paintClientSide(block.instance);
							},
							() => {
								if (selected.size() === 0) return;
								this.paint(selected.keys(), selected);
							},
						);
					});
				}
			}, false);
		});

		this.event.subInput((ih) => {
			ih.onMouse3Down(() => {
				if (Gui.isCursorOnVisibleGui()) return;
				this.pick();
			}, false);
		});
	}

	private pick() {
		const target = this.mouse.Target;
		if (!target) return;

		const block = BlockManager.getBlockDataByPart(target);
		if (!block) return;

		this.selectedMaterial.set(block.material);
		this.selectedColor.set(block.color);
	}

	async paintClientSide(block: BlockModel) {
		SharedBuilding.paint(
			[block],
			this.enableColor.get() ? this.selectedColor.get() : undefined,
			this.enableMaterial.get() ? this.selectedMaterial.get() : undefined,
		);
	}

	paintEverything(enableColor?: boolean, enableMaterial?: boolean) {
		return ClientBuilding.paintBlocks(
			this.targetPlot.get(),
			"all",
			enableMaterial ?? this.enableMaterial.get() ? this.selectedMaterial.get() : undefined,
			enableColor ?? this.enableColor.get() ? this.selectedColor.get() : undefined,
		);
	}
	paint(
		blocks: readonly BlockModel[],
		original?: ReadonlyMap<BlockModel, readonly [material: Enum.Material, color: Color3]>,
	) {
		return ClientBuilding.paintBlocks(
			this.targetPlot.get(),
			blocks,
			this.enableMaterial.get() ? this.selectedMaterial.get() : undefined,
			this.enableColor.get() ? this.selectedColor.get() : undefined,
			original,
		);
	}

	getDisplayName(): string {
		return "Paint";
	}
	getImageID(): string {
		return "http://www.roblox.com/asset/?id=15895846447";
	}
}
