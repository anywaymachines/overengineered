import { BlockConfigDefinitions, BlockConfigDefinitionsToConfig } from "shared/block/config/BlockConfigDefinitionRegistry";
import { PlacedBlockDataConnection } from "shared/building/BlockManager";
import SharedComponent from "shared/component/SharedComponent";
import PartUtils from "shared/utils/PartUtils";

export interface BlockLogicData<TDef extends BlockConfigDefinitions, TBlock extends BlockModel = BlockModel> {
	readonly id: string;
	readonly instance: TBlock;
	readonly uuid: BlockUuid;
	readonly config: Partial<BlockConfigDefinitionsToConfig<TDef>>;
	readonly color?: Color3;
	readonly material?: Enum.Material;

	/** Connections to this block INPUT from other blocks OUTPUTs and INPUTs */
	readonly connections: Readonly<Partial<Record<keyof TDef & BlockConnectionName, PlacedBlockDataConnection>>>;
}
export default class BlockLogic<T extends BlockModel = BlockModel> extends SharedComponent<T> {
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
			if (instance.Parent && instance.GetAttribute("IMPACT_BROKEN")) return;

			func();
		};

		instance.AttributeChanged.Connect(update);
		instance.GetPropertyChangedSignal("Parent").Connect(update);
	}

	protected subscribeOnImpactBreak(instance: BasePart, func: () => void) {
		instance.GetAttributeChangedSignal("IMPACT_BROKEN").Connect(func);
	}

	protected onImpactBreak(func: () => void) {
		PartUtils.applyToAllDescendantsOfType("BasePart", this.instance, (part) =>
			this.subscribeOnImpactBreak(part, func),
		);
	}

	protected onDescendantDestroyed(func: () => void) {
		PartUtils.applyToAllDescendantsOfType("BasePart", this.instance, (part) =>
			this.subscribeOnDestroyed(part, func),
		);
	}
}
