import PlayerDataStorage from "client/PlayerDataStorage";
import BlockConfig from "shared/BlockConfig";
import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import blockConfigRegistry, { BlockConfigRegistry } from "shared/BlockConfigRegistry";
import Objects from "shared/_fixes_/objects";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import ImpactController from "shared/block/ImpactController";
import SharedMachine from "shared/block/SharedMachine";
import { PlacedBlockData } from "shared/building/BlockManager";
import SharedComponentContainer from "shared/component/SharedComponentContainer";
import blockConfigRegistryClient from "./config/BlockConfigRegistryClient";
import { ConfigLogicValueBase } from "./config/ConfigLogicValueBase";

export default class Machine extends SharedMachine {
	readonly logicInputs = new SharedComponentContainer<
		ConfigLogicValueBase<BlockConfigDefinitionRegistry[keyof BlockConfigDefinitionRegistry]>
	>();

	constructor() {
		super();
		this.add(this.logicInputs);
	}

	protected initialize(blocks: readonly PlacedBlockData[]) {
		super.initialize(blocks);
		this.initializeControls();
	}
	protected initializeDestructionIfNeeded(blocks: readonly PlacedBlockData[]) {
		// no super
		if (PlayerDataStorage.config.get().impact_destruction) {
			ImpactController.initializeBlocks(blocks);
		}
	}

	initializeControls() {
		for (const logic of this.getChildren()) {
			if (!(logic instanceof ConfigurableBlockLogic)) continue;

			const configDef = (blockConfigRegistry as BlockConfigRegistry)[
				logic.block.id as keyof typeof blockConfigRegistry
			];
			const config = BlockConfig.addDefaults(logic.block.config, configDef.input);

			for (const [key, observable] of Objects.pairs(logic.input)) {
				// if already connected
				if (key in logic.block.connections) continue;

				const def = configDef.input[key as keyof typeof configDef.input];

				const input = this.logicInputs.add(
					new blockConfigRegistryClient[def.type](
						observable as never,
						config[key as never] as never,
						def as never,
					),
				);

				this.event.subscribeObservable(
					this.occupiedByLocalPlayer,
					(enabled) => {
						if (enabled) input.enable();
						else input.disable();
					},
					true,
				);
			}
		}
	}
}
