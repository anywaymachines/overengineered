import ComponentContainer from "client/component/ComponentContainer";
import HoveredBlockHighlighter from "./HoveredBlockHighlighter";

export default class BuildingPartSelector extends ComponentContainer {
	constructor() {
		super();

		const findAllWelds = (block: Instance) => {
			const ret: WeldConstraint[] = [];
			for (const child of block.GetChildren()) {
				if (child.IsA("WeldConstraint")) {
					ret.push(child);
				} else {
					for (const weld of findAllWelds(child)) {
						ret.push(weld);
					}
				}
			}

			return ret;
		};

		const findConnectedBlocks = (block: BlockModel) => {
			const connected = block.PrimaryPart!.GetConnectedParts();
		};

		const selected: Model[] = [];

		const hoverHighlighter = new HoveredBlockHighlighter();
		this.add(hoverHighlighter);
	}
}
