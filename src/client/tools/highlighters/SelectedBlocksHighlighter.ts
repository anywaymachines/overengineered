import { ClientComponent } from "client/component/ClientComponent";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type { ReadonlyObservableCollectionSet } from "shared/event/ObservableCollection";

@injectable
export class SelectedBlocksHighlighter extends ClientComponent {
	private readonly selectionBoxName = "selectionBox";
	private readonly selections = new Map<BlockModel, SelectionBox>();

	constructor(
		selected: ReadonlyObservableCollectionSet<BlockModel>,
		@inject private readonly playerDataStorage: PlayerDataStorage,
	) {
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

		const config = this.playerDataStorage.config.get().visuals.selection;
		const selection = new Instance("SelectionBox");
		selection.Name = this.selectionBoxName;
		selection.LineThickness = config.borderThickness;
		selection.Transparency = config.borderTransparency;
		selection.Color3 = config.borderColor;
		selection.SurfaceColor3 = config.surfaceColor;
		selection.SurfaceTransparency = config.surfaceTransparency;
		selection.Adornee = block;
		selection.Parent = block;

		this.selections.set(block, selection);
	}
}
