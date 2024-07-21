import { BallastBlockLogic } from "shared/block/logic/BallastBlockLogic";
import { BracedShaftBlockLogic } from "shared/block/logic/BracedShaftBlockLogic";
import { DisconnectBlockLogic } from "shared/block/logic/DisconnectBlockLogic";
import { HeliumBlockLogic } from "shared/block/logic/HeliumBlockLogic";
import { ByteMakerBlockLogic } from "shared/block/logic/logic/converter/byte/ByteMakerBlockLogic";
import { ByteSplitterBlockLogic } from "shared/block/logic/logic/converter/byte/ByteSplitterBlockLogic";
import { LampBlockLogic } from "shared/block/logic/logic/display/LampBlockLogic";
import { LaserBlockLogic } from "shared/block/logic/logic/display/LaserBlockLogic";
import { LEDDisplayBlockLogic } from "shared/block/logic/logic/display/LEDDisplayBlockLogic";
import { ScreenBlockLogic } from "shared/block/logic/logic/display/ScreenBlockLogic";
import { SevenSegmentDisplayBlockLogic } from "shared/block/logic/logic/display/SevenSegmentDisplayBlockLogic";
import { LogicMemoryBlockLogic } from "shared/block/logic/logic/memory/LogicMemoryBlockLogic";
import { RandomAccessMemoryBlockLogic } from "shared/block/logic/logic/memory/RandomAccessMemoryBlockLogic";
import { ReadOnlyMemoryBlockLogic } from "shared/block/logic/logic/memory/ReadOnlyMemoryBlockLogic";
import { StackMemoryBlockLogic } from "shared/block/logic/logic/memory/StackMemoryBlockLogic";
import { BufferBlockLogic } from "shared/block/logic/logic/other/BufferBlockLogic";
import { CounterBlockLogic } from "shared/block/logic/logic/other/CounterBlockLogic";
import { DelayBlockLogic } from "shared/block/logic/logic/other/DelayBlockLogic";
import { ImpulseGeneratorBlockLogic } from "shared/block/logic/logic/other/ImpulseGeneratorBlockLogic";
import { AltimeterBlockLogic } from "shared/block/logic/logic/sensor/AltimeterBlockLogic";
import { AngleSensorBlockLogic } from "shared/block/logic/logic/sensor/AngleSensorBlockLogic";
import { GravitySensorBlockLogic } from "shared/block/logic/logic/sensor/GravitySensorBlockLogic";
import { KeySensorBlockLogic } from "shared/block/logic/logic/sensor/KeySensorBlockLogic";
import { MassSensorBlockLogic } from "shared/block/logic/logic/sensor/MassSensorBlockLogic";
import { MouseSensorBlockLogic } from "shared/block/logic/logic/sensor/MouseSensorBlockLogic";
import { OwnerCameraLocatorBlockLogic } from "shared/block/logic/logic/sensor/OwnerCameraLocatorBlockLogic";
import { OwnerLocatorBlockLogic } from "shared/block/logic/logic/sensor/OwnerLocatorBlockLogic";
import { RadarSectionBlockLogic } from "shared/block/logic/logic/sensor/RadarSectionBlockLogic";
import { SpeedometerBlockLogic } from "shared/block/logic/logic/sensor/SpeedometerBlockLogic";
import { MagnetBlockLogic } from "shared/block/logic/MagnetBlockLogic";
import { MotorBlockLogic } from "shared/block/logic/MotorBlockLogic";
import { PassengerSeatBlockLogic } from "shared/block/logic/PassengerSeatBlockLogic";
import { PistonLogic } from "shared/block/logic/PistonBlockLogic";
import { RadioRecieverBlockLogic } from "shared/block/logic/RadioRecieverBlockLogic";
import { RadioTransmitterBlockLogic } from "shared/block/logic/RadioTransmitterBlockLogic";
import { RocketEngineLogic } from "shared/block/logic/RocketEngineLogic";
import { RopeLogic } from "shared/block/logic/RopeLogic";
import { ServoMotorBlockLogic } from "shared/block/logic/ServoMotorBlockLogic";
import { SuspensionLogic } from "shared/block/logic/SuspensionLogic";
import { TNTBlockLogic } from "shared/block/logic/TNTBlockLogic";
import { VehicleSeatBlockLogic } from "shared/block/logic/VehicleSeatBlockLogic";
import { WingLogic } from "shared/block/logic/WingLogic";
import type { BlockLogic } from "shared/block/BlockLogic";
import type { BlockId } from "shared/BlockDataRegistry";
import type { PlacedBlockData } from "shared/building/BlockManager";

declare global {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	type LogicCtor = new (block: PlacedBlockData, ...args: any) => BlockLogic;
}

const logicRegistry = {
	wing1x1: WingLogic,
	wing1x2: WingLogic,
	wing1x3: WingLogic,
	wing1x4: WingLogic,

	vehicleseat: VehicleSeatBlockLogic,
	passengerseat: PassengerSeatBlockLogic,
	disconnectblock: DisconnectBlockLogic,

	smallrocketengine: RocketEngineLogic,
	rocketengine: RocketEngineLogic,
	motorblock: MotorBlockLogic,
	bracedshaft: BracedShaftBlockLogic,
	servomotorblock: ServoMotorBlockLogic,
	sidewaysservo: ServoMotorBlockLogic,
	rope: RopeLogic,
	heliumblock: HeliumBlockLogic,
	tnt: TNTBlockLogic,
	cylindricaltnt: TNTBlockLogic,
	sphericaltnt: TNTBlockLogic,
	suspensionblock: SuspensionLogic,
	magnet: MagnetBlockLogic,

	piston: PistonLogic,
	ballast: BallastBlockLogic,

	lamp: LampBlockLogic,
	screen: ScreenBlockLogic,
	laser: LaserBlockLogic,
	leddisplay: LEDDisplayBlockLogic,
	sevensegmentdisplay: SevenSegmentDisplayBlockLogic,

	delayblock: DelayBlockLogic,
	counter: CounterBlockLogic,

	radioreciever: RadioRecieverBlockLogic,
	radiotransmitter: RadioTransmitterBlockLogic,

	ownerlocator: OwnerLocatorBlockLogic,
	ownercameralocator: OwnerCameraLocatorBlockLogic,
	masssensor: MassSensorBlockLogic,
	gravitysensor: GravitySensorBlockLogic,

	speedometer: SpeedometerBlockLogic,
	anglesensor: AngleSensorBlockLogic,
	keysensor: KeySensorBlockLogic,
	mousesensor: MouseSensorBlockLogic,
	altimeter: AltimeterBlockLogic,
	radarsection: RadarSectionBlockLogic,

	logicmemory: LogicMemoryBlockLogic,
	stackmemory: StackMemoryBlockLogic,
	randomaccessmemory: RandomAccessMemoryBlockLogic,
	readonlymemory: ReadOnlyMemoryBlockLogic,

	buffer: BufferBlockLogic,
	impulsegenerator: ImpulseGeneratorBlockLogic,

	bytemaker: ByteMakerBlockLogic,
	bytesplitter: ByteSplitterBlockLogic,
} as const satisfies { readonly [k in BlockId]?: unknown };

export type KnownBlockLogic = typeof logicRegistry;
type WritableLogicRegistry = { [k in BlockId]?: LogicCtor };

export namespace BlockLogicRegistry {
	export const registry: Readonly<WritableLogicRegistry> = logicRegistry;

	export function asWritable() {
		return registry as WritableLogicRegistry;
	}
}
