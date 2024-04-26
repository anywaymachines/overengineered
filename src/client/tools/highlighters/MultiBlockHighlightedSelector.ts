import { ClientComponent } from "client/component/ClientComponent";
import { InputController } from "client/controller/InputController";
import { BlockSelect } from "client/tools/highlighters/BlockSelect";
import { BlockSelectorModeGui, BlockSelectorModeGuiDefinition } from "client/tools/highlighters/BlockSelectorModeGui";
import {
	MultiBlockSelector as MBS,
	MultiBlockSelectorConfiguration,
} from "client/tools/highlighters/MultiBlockSelector";
import { SharedPlot } from "shared/building/SharedPlot";
import { ObservableCollectionSet } from "shared/event/ObservableCollection";
import { ReadonlyObservableValue } from "shared/event/ObservableValue";

export class MultiBlockHighlightedSelector extends ClientComponent {
	readonly selected: ObservableCollectionSet<BlockModel>;
	private readonly plot: ReadonlyObservableValue<SharedPlot>;

	constructor(
		plot: ReadonlyObservableValue<SharedPlot>,
		selected: ObservableCollectionSet<BlockModel>,
		gui?: BlockSelectorModeGuiDefinition,
		config?: MultiBlockSelectorConfiguration,
	) {
		super();
		this.plot = plot;
		this.selected = selected;

		const fireSelected = (blocks: readonly BlockModel[]) => {
			if (!blocks || blocks.size() === 0) return;
			BlockSelect.selectBlocksByClick(this.selected, blocks, InputController.isShiftPressed());
		};
		const mbs = this.parent(new MBS(plot, config));
		mbs.submit.Connect(fireSelected);

		if (gui) {
			this.parentGui(new BlockSelectorModeGui(gui, mbs.mode));
		}

		this.onDestroy(() => this.selected.clear());
	}

	selectPlot() {
		this.selected.add(...this.plot.get().getBlocks());
	}
	deselectAll() {
		this.selected.clear();
	}
}
