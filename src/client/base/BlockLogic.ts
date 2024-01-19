import { BlockConfigDefinitions, BlockConfigDefinitionsToConfig } from "shared/BlockConfigDefinitionRegistry";
import { PlacedBlockDataConnection } from "shared/building/BlockManager";
import PartUtils from "shared/utils/PartUtils";
import Component from "./Component";

export interface BlockLogicData<TDef extends BlockConfigDefinitions, TBlock extends BlockModel = BlockModel> {
	readonly uuid: BlockUuid;
	readonly config: Partial<BlockConfigDefinitionsToConfig<TDef>>;
	readonly connections: Readonly<Partial<Record<keyof TDef & BlockConnectionName, PlacedBlockDataConnection>>>;
	readonly instance: TBlock;
}
export default class BlockLogic<T extends BlockModel = BlockModel> extends Component<T> {
	readonly block: BlockLogicData<BlockConfigDefinitions, T>;
	readonly instance: T;

	constructor(block: BlockLogicData<BlockConfigDefinitions>) {
		super(block.instance as T);
		this.block = block as typeof this.block;
		this.instance = this.block.instance;
	}

	protected subscribeOnDestroyed(instance: BasePart, func: () => void) {
		const update = () => {
			if (!instance.CanTouch) return;
			if (instance.Parent && instance.GetAttribute("broken") === undefined) return;

			func();
		};

		instance.AttributeChanged.Connect(update);
		instance.GetPropertyChangedSignal("Parent").Connect(update);
	}

	protected onDescendantDestroyed(func: () => void) {
		PartUtils.applyToAllDescendantsOfType("BasePart", this.instance, (part) =>
			this.subscribeOnDestroyed(part, func),
		);
	}
}
