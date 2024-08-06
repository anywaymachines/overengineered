import { BlockConfig } from "shared/blockLogic/BlockConfig";
import { SharedMachine } from "shared/blockLogic/SharedMachine";
import { ContainerComponent } from "shared/component/ContainerComponent";
import type { ConfigLogicValueBase } from "client/blocks/BlockLogicValues";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type { BlockRegistry } from "shared/block/BlockRegistry";
import type { ImpactController } from "shared/block/impact/ImpactController";
import type { PlacedBlockData } from "shared/building/BlockManager";

@injectable
export class ClientMachine extends SharedMachine {
	readonly logicInputs = new ContainerComponent<
		ConfigLogicValueBase<BlockConfigTypes.Types[keyof BlockConfigTypes.Types]>
	>();

	constructor(
		@inject blockRegistry: BlockRegistry,
		@inject private readonly playerData: PlayerDataStorage,
		@inject di: ReadonlyDIContainer,
	) {
		super(blockRegistry, di);
		this.parent(this.logicInputs);
	}

	protected initialize(blocks: readonly PlacedBlockData[]) {
		super.initialize(blocks);
		//this.initializeControls();
	}
	protected createImpactControllerIfNeeded(blocks: readonly PlacedBlockData[]): ImpactController | undefined {
		if (!this.playerData.config.get().impact_destruction) {
			return undefined;
		}

		return super.createImpactControllerIfNeeded(blocks);
	}

	initializeControls() {
		for (const logic of this.getChildren()) {
			const configDef = logic.configDefinition;
			const config = BlockConfig.addDefaults(logic.block.config, configDef.input);

			for (const [key, observable] of pairs(logic.input)) {
				// if already connected
				if (logic.block.connections !== undefined && key in logic.block.connections) continue;

				const def = configDef.input[key as keyof typeof configDef.input];

				// const input = this.logicInputs.add(
				// 	new blockConfigRegistryClient[def.type](
				// 		observable as never,
				// 		config[key as never] as never,
				// 		def as never,
				// 	),
				// );

				// this.event.subscribeObservable(
				// 	this.occupiedByLocalPlayer,
				// 	(enabled) => {
				// 		if (enabled) input.enable();
				// 		else input.disable();
				// 	},
				// 	true,
				// );
			}
		}
	}
}
