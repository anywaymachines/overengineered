import { ClientComponent } from "client/component/ClientComponent";
import { InputController } from "client/controller/InputController";
import { BlockSelect } from "client/tools/highlighters/BlockSelect";
import { BlockSelectorModeGui, BlockSelectorModeGuiDefinition } from "client/tools/highlighters/BlockSelectorModeGui";
import { HoveredBlocksSelectorMode } from "client/tools/highlighters/HoveredBlocksSelector";
import {
	MultiBlockSelector as MBS,
	MultiBlockSelectorConfiguration,
} from "client/tools/highlighters/MultiBlockSelector";
import { SharedPlot } from "shared/building/SharedPlot";
import { ObservableCollectionSet } from "shared/event/ObservableCollection";
import { ObservableValue, ReadonlyObservableValue } from "shared/event/ObservableValue";

export class MultiBlockHighlightedSelector extends ClientComponent {
	readonly selected: ObservableCollectionSet<BlockModel>;
	private readonly plot: ReadonlyObservableValue<SharedPlot>;
	private readonly mode = new ObservableValue<HoveredBlocksSelectorMode>("single");

	constructor(
		plot: ReadonlyObservableValue<SharedPlot>,
		selected: ObservableCollectionSet<BlockModel>,
		gui?: BlockSelectorModeGuiDefinition,
		config?: MultiBlockSelectorConfiguration,
	) {
		super();
		this.plot = plot;
		this.selected = selected;

		if (gui) {
			this.parentGui(new BlockSelectorModeGui(gui, this.mode));
		}

		const fireSelected = (blocks: readonly BlockModel[]) => {
			if (!blocks || blocks.size() === 0) return;
			BlockSelect.selectBlocksByClick(this.selected, blocks, InputController.isShiftPressed());
		};
		const stuff = this.parent(new MBS(plot, config));
		stuff.submit.Connect(fireSelected);

		this.onDestroy(() => this.selected.clear());
	}

	selectPlot() {
		this.selected.add(...this.plot.get().getBlocks());
	}
	deselectAll() {
		this.selected.clear();
	}
}
