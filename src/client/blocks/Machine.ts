import { blockConfigRegistryClient } from "client/blocks/BlockLogicValues";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { SharedMachine } from "shared/block/SharedMachine";
import { ContainerComponent } from "shared/component/ContainerComponent";
import { Config } from "shared/config/Config";
import type { ConfigLogicValueBase } from "client/blocks/BlockLogicValues";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type { BlockRegistry } from "shared/block/BlockRegistry";
import type { BlockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import type { ImpactController } from "shared/block/impact/ImpactController";
import type { PlacedBlockData } from "shared/building/BlockManager";

@injectable
export class Machine extends SharedMachine {
	readonly logicInputs = new ContainerComponent<
		ConfigLogicValueBase<BlockConfigTypes.Types[keyof BlockConfigTypes.Types]>
	>();

	constructor(
		@inject blockRegistry: BlockRegistry,
		@inject private readonly playerData: PlayerDataStorage,
		@inject di: DIContainer,
	) {
		super(blockRegistry, di);
		this.add(this.logicInputs);
	}

	protected initialize(blocks: readonly PlacedBlockData[]) {
		super.initialize(blocks);
		this.initializeControls();
	}
	protected createImpactControllerIfNeeded(blocks: readonly PlacedBlockData[]): ImpactController | undefined {
		if (!this.playerData.config.get().impact_destruction) {
			return undefined;
		}

		return super.createImpactControllerIfNeeded(blocks);
	}

	initializeControls() {
		for (const logic of this.getChildren()) {
			if (!(logic instanceof ConfigurableBlockLogic)) continue;

			const configDef = (blockConfigRegistry as BlockConfigRegistry)[
				logic.block.id as keyof typeof blockConfigRegistry
			];
			const config = Config.addDefaults(logic.block.config, configDef.input);

			for (const [key, observable] of pairs(logic.input)) {
				// if already connected
				if (logic.block.connections !== undefined && key in logic.block.connections) continue;

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
