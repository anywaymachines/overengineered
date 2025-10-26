import { HostedService } from "engine/shared/di/HostedService";
import { BackMountBlockServerLogic } from "server/blocks/logic/BackMountBlockServerLogic";
import { BeaconServerLogic } from "server/blocks/logic/BeaconBlockServerLogic";
import { BracedShaftServerLogic } from "server/blocks/logic/BracedShaftServerLogic";
import { ButtonServerLogic } from "server/blocks/logic/ButtonServerLogic";
import { CameraBlockServerLogic } from "server/blocks/logic/CameraBlockServerLogic";
import { DisconnectBlockServerLogic } from "server/blocks/logic/DisconnectBlockServerLogic";
import { LEDDisplayServerLogic } from "server/blocks/logic/LEDDisplayServerLogic";
import { ParticleServerLogic } from "server/blocks/logic/ParticleBlockServerLogic";
import { PropellantBlockServerLogic } from "server/blocks/logic/PropellantBlocksServerLogic";
import { ScreenServerLogic } from "server/blocks/logic/ScreenServerLogic";
import { SevenSegmentDisplayServerLogic } from "server/blocks/logic/SevenSegmentDisplayServerLogic";
import { SpeakerServerLogic } from "server/blocks/logic/SpeakerBlockServerLogic";
import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { GenericBlockLogicCtor } from "shared/blockLogic/BlockLogic";

type ServerBlockLogicRegistry = {
	readonly [k in BlockId]?: new (...args: never) => ServerBlockLogic<GenericBlockLogicCtor>;
};

@injectable
export class ServerBlockLogicController extends HostedService {
	constructor(
		@inject blockList: BlockList,
		@inject playModeController: PlayModeController,
		@inject container: DIContainer,
	) {
		super();
		container = container.beginScope();

		for (const [, { logic }] of pairs(blockList.blocks)) {
			if (!logic?.events) continue;

			for (const [, event] of pairs(logic.events)) {
				event.addServerMiddleware((invoker, arg) => {
					if (!arg.block) return { success: false, message: "No block" };
					if (!arg.block?.PrimaryPart) return { success: false, message: "No primary part" };

					const err = ServerBlockLogic.staticIsValidBlockNamed(
						arg.block.PrimaryPart,
						invoker,
						playModeController,
						undefined,
						false,
					);
					if (err) {
						return { success: false, message: err };
					}

					return { success: true, value: arg };
				});
			}
		}

		const serverBlockLogicRegistry: ServerBlockLogicRegistry = {
			camera: CameraBlockServerLogic,
			disconnectblock: DisconnectBlockServerLogic,
			leddisplay: LEDDisplayServerLogic,
			screen: ScreenServerLogic,
			button: ButtonServerLogic,
			speaker: SpeakerServerLogic,
			particleemitter: ParticleServerLogic,
			sevensegmentdisplay: SevenSegmentDisplayServerLogic,
			bracedshaft: BracedShaftServerLogic,
			beacon: BeaconServerLogic,
			backmount: BackMountBlockServerLogic,
			propellantblock: PropellantBlockServerLogic,
		};

		//
		const logics: object[] = [];
		for (const [id, logic] of pairs(serverBlockLogicRegistry)) {
			$log(`Initializing server logic for ${id}`);

			const bl = blockList.blocks[id]?.logic?.ctor;
			if (!bl) {
				throw `Unknown server block logic id ${id}`;
			}

			logics.push(container.resolveForeignClass(logic, [bl] as never));
		}
	}
}
