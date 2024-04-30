import { ClientComponent } from "client/component/ClientComponent";
import { Element } from "shared/Element";
import { type ReadonlyObservableCollectionSet } from "shared/event/ObservableCollection";

export class SelectedBlocksHighlighter extends ClientComponent {
	private readonly selectionBoxName = "selectionBox";
	private readonly selections = new Map<BlockModel, SelectionBox>();

	constructor(selected: ReadonlyObservableCollectionSet<BlockModel>) {
		super();

		this.onDisable(() => this.clearAllSelections());

		this.event.subscribeCollection(
			selected,
			(update) => {
				if (update.kind === "add") {
					for (const block of update.added) {
						this.createBlockSelection(block);
					}
				} else if (update.kind === "remove") {
					for (const block of update.removed) {
						this.deleteBlockSelection(block);
					}
				} else if (update.kind === "clear") {
					this.clearAllSelections();
				} else if (update.kind === "reset") {
					this.clearAllSelections();
					for (const block of selected.get()) {
						this.createBlockSelection(block);
					}
				} else {
					// type check; do not delete
					const never: never = update;
				}
			},
			true,
		);
	}

	private clearAllSelections() {
		for (const [, selection] of this.selections) {
			selection.Destroy();
		}
		this.selections.clear();
	}
	private deleteBlockSelection(block: BlockModel) {
		block.FindFirstChild(this.selectionBoxName)?.Destroy();
		this.selections.delete(block);
	}
	private createBlockSelection(block: BlockModel) {
		if (block.FindFirstChild(this.selectionBoxName)) {
			return;
		}

		const selection = Element.create("SelectionBox", {
			Name: this.selectionBoxName,
			LineThickness: 0.05,
			Color3: Color3.fromRGB(0, 255 / 2, 255),
			Adornee: block,
			Parent: block,
		});
		this.selections.set(block, selection);
	}
}
