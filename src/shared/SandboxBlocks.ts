import { BlockListBuilder } from "shared/blocks/BlockListBuilder";
import { AltimeterBlock } from "shared/blocks/blocks/AltimeterBlock";
import { AngleSensorBlock } from "shared/blocks/blocks/AngleSensorBlock";
import { BackMountBlock } from "shared/blocks/blocks/BackMountBlock";
import { BallastBlock } from "shared/blocks/blocks/BallastBlock";
import { BeaconBlock } from "shared/blocks/blocks/BeaconBlock";
import { BearingShaftBlock } from "shared/blocks/blocks/BearingShaftBlock";
import { BracedShaftBlock } from "shared/blocks/blocks/BracedShaftBlock";
import { ButtonBlock } from "shared/blocks/blocks/ButtonBlock";
import { CameraBlock } from "shared/blocks/blocks/CameraBlock";
import { ChatSensorBlock } from "shared/blocks/blocks/ChatSensorBlock";
import { ControllerBlock } from "shared/blocks/blocks/ControllerBlock";
import { CounterBlock } from "shared/blocks/blocks/CounterBlock";
import { DelayBlock } from "shared/blocks/blocks/DelayBlock";
import { DisconnectBlock } from "shared/blocks/blocks/DisconnectBlock";
import { FallbackBlock } from "shared/blocks/blocks/FallbackBlock";
import { FireSensorBlock } from "shared/blocks/blocks/FireSensorBlock";
import { FunctionBlock } from "shared/blocks/blocks/FunctionBlock";
import { GPSSensorBlock } from "shared/blocks/blocks/GPSSensorBlock";
import { GraviEngineBlocks } from "shared/blocks/blocks/GraviEngineBlocks";
import { GravitySensorBlock } from "shared/blocks/blocks/GravitySensorBlock";
import { BasicLogicGateBlocks } from "shared/blocks/blocks/grouped/BasicLogicGateBlocks";
import { BasicOperationBlocks } from "shared/blocks/blocks/grouped/BasicOperationBlocks";
import { BuildingBlocks } from "shared/blocks/blocks/grouped/BuildingBlocks";
import { HingeBlocks } from "shared/blocks/blocks/grouped/HingeBlocks";
import { LampBlocks } from "shared/blocks/blocks/grouped/LampBlocks";
import { LinearSliderBlocks } from "shared/blocks/blocks/grouped/LinearSliders";
import { MechanicalBlocks } from "shared/blocks/blocks/grouped/MechanicalBlocks";
import { PropellantBlocks } from "shared/blocks/blocks/grouped/PropellantBlocks";
import { RandomAccessMemoryBlocks } from "shared/blocks/blocks/grouped/RandomAccessMemoryBlocks";
import { ServoMotorBlocks } from "shared/blocks/blocks/grouped/ServoMotorBlocks";
import { StringOperationBlocks } from "shared/blocks/blocks/grouped/StringOperationBlocks";
import { TNTBlocks } from "shared/blocks/blocks/grouped/TNTBlocks";
import { TurnTables } from "shared/blocks/blocks/grouped/TurnTables";
import { WheelBlocks } from "shared/blocks/blocks/grouped/WheelBlocks";
import { WingBlocks } from "shared/blocks/blocks/grouped/WingsBlocks";
import { GuiButtonBlock } from "shared/blocks/blocks/gui/GuiButtonBlock";
import { GuiImageBlock } from "shared/blocks/blocks/gui/GuiImageBlock";
import { GuiStatBlock } from "shared/blocks/blocks/gui/GuiStatBlock";
import { GuiTextBlock } from "shared/blocks/blocks/gui/GuiTextBlock";
import { GyroscopeBlock } from "shared/blocks/blocks/GyroscopeBlock";
import { HeliumBlock } from "shared/blocks/blocks/HeliumBlock";
import { ImpulseExtenderBlock } from "shared/blocks/blocks/ImpulseExtenderBlock";
import { ImpulseGeneratorBlock } from "shared/blocks/blocks/ImpulseGeneratorBlock";
import { JetEngineBlocks } from "shared/blocks/blocks/JetEngineBlocks";
import { KeyboardBlock } from "shared/blocks/blocks/KeyboardBlock";
import { KeySensorBlock } from "shared/blocks/blocks/KeySensorBlock";
import { LaserBlock } from "shared/blocks/blocks/LaserBlock";
import { LedDisplayBlock } from "shared/blocks/blocks/LedDisplayBlock";
import { LinearEasingBlock } from "shared/blocks/blocks/LinearEasingBlock";
import { LogicMemoryBlock } from "shared/blocks/blocks/LogicMemoryBlock";
import { LogicMemoryLegacyBlock } from "shared/blocks/blocks/LogicMemoryOldBlock";
import { LogicOverclockBlock } from "shared/blocks/blocks/LogicOverclockBlock";
import { LuaCircuitBlock } from "shared/blocks/blocks/LuaCircuitBlock";
import { MagnetBlock } from "shared/blocks/blocks/MagnetBlock";
import { MassSensorBlock } from "shared/blocks/blocks/MassSensorBlock";
import { MotorBlock } from "shared/blocks/blocks/MotorBlock";
import { MouseSensorBlock } from "shared/blocks/blocks/MouseSensorBlock";
import { NonVolatileMemoryBlock } from "shared/blocks/blocks/NonVolatileMemoryBlock";
import { OwnerCameraLocatorBlock } from "shared/blocks/blocks/OwnerCameraLocatorBlock";
import { OwnerLocatorBlock } from "shared/blocks/blocks/OwnerLocatorBlock";
import { ParticleBlocks } from "shared/blocks/blocks/particle/ParticleBlocks";
import { PassengerSeatBlock } from "shared/blocks/blocks/PassengerSeatBlock";
import { PistonBlock } from "shared/blocks/blocks/PistonBlock";
import { QueueMemoryBlock } from "shared/blocks/blocks/QueueMemoryBlock";
import { RadarBlocks } from "shared/blocks/blocks/RadarSectionBlock";
import { RadarWarningReceiver } from "shared/blocks/blocks/RadarWarningReceiver";
import { RadioReceiverBlock } from "shared/blocks/blocks/RadioReceiverBlock";
import { RadioTransmitterBlock } from "shared/blocks/blocks/RadioTransmitterBlock";
import { RandomBlock } from "shared/blocks/blocks/RandomBlock";
import { RCSEngineBlock } from "shared/blocks/blocks/RCSEngineBlock";
import { ReadonlyMemoryBlock } from "shared/blocks/blocks/ReadonlyMemoryBlock";
import { RocketBlocks } from "shared/blocks/blocks/RocketEngineBlocks";
import { RopeBlock } from "shared/blocks/blocks/RopeBlock";
import { ScreenBlock } from "shared/blocks/blocks/ScreenBlock";
import { SevenSegmentDisplayBlock } from "shared/blocks/blocks/SevenSegmentDisplayBlock";
import { SingleImpulseBlock } from "shared/blocks/blocks/SingleImpulseBlock";
import { SizeBlock } from "shared/blocks/blocks/SizeBlock";
import { SoundEffectBlockCreator } from "shared/blocks/blocks/sound/SoundEffectBlockCreator";
import { SoundFromIdBlock } from "shared/blocks/blocks/sound/SoundFromIdBlock";
import { SoundLengthBlock } from "shared/blocks/blocks/sound/SoundLengthBlock";
import { SpeakerBlock } from "shared/blocks/blocks/sound/SpeakerBlock";
import { SpeedometerBlock } from "shared/blocks/blocks/SpeedometerBlock";
import { StackMemoryBlock } from "shared/blocks/blocks/StackMemoryBlock";
import { SuspensionBlock } from "shared/blocks/blocks/SuspensionBlock";
import { TextureBlock } from "shared/blocks/blocks/TextureBlock";
import { TpsCounterBlock } from "shared/blocks/blocks/TpsCounterBlock";
import { ValueExtenderBlock } from "shared/blocks/blocks/ValueExtenderBlock";
import { VehicleSeatBlock } from "shared/blocks/blocks/VehicleSeatBlock";
import { CannonBarrels } from "shared/blocks/blocks/Weaponry/Cannon/CannonBarrels";
import { CannonBases } from "shared/blocks/blocks/Weaponry/Cannon/CannonBases";
import { CannonBreech } from "shared/blocks/blocks/Weaponry/Cannon/CannonBreechBlock";
import { LaserEmitterBlock } from "shared/blocks/blocks/Weaponry/Laser/LaserEmitterBlock";
import { LaserLensBlock } from "shared/blocks/blocks/Weaponry/Laser/LaserLensBlock";
import { ArmoredMachineGunBarrels } from "shared/blocks/blocks/Weaponry/Machinegun/ArmoredMachineGunBarrels";
import { MachineGunAmmoBlocks } from "shared/blocks/blocks/Weaponry/Machinegun/MachineGunAmmoBlocks";
import { MachineGunBarrels } from "shared/blocks/blocks/Weaponry/Machinegun/MachineGunBarrels";
import { MachineGunLoader } from "shared/blocks/blocks/Weaponry/Machinegun/MachineGunLoaderBlock";
import { MachineGunMuzzleBrakes } from "shared/blocks/blocks/Weaponry/Machinegun/MachineGunMuzzleBrakes";
import { PlasmaGunBarrelBlock } from "shared/blocks/blocks/Weaponry/Plasma/PlasmaGunBarrelBlock";
import { PlasmaGunBlock } from "shared/blocks/blocks/Weaponry/Plasma/PlasmaGunBlock";
import { PlasmaSeparatorMuzzleBlock } from "shared/blocks/blocks/Weaponry/Plasma/PlasmaSeparatorMuzzleBlock";
import { PlasmaShotgunMuzzleBlock } from "shared/blocks/blocks/Weaponry/Plasma/PlasmaShotgunMuzzleBlock";
import { GameDefinitions } from "shared/data/GameDefinitions";
import type { BlockBuilder } from "shared/blocks/Block";

export const CreateSandboxBlocks = (di: DIContainer): BlockList => {
	const weapons: BlockBuilder[] = [
		// PlasmaCoilAcceleratorUpgradeBlock, //todo: remove later

		//laser stuff
		LaserLensBlock,
		LaserEmitterBlock,

		//plasma stuff
		PlasmaShotgunMuzzleBlock,
		PlasmaSeparatorMuzzleBlock,
		PlasmaGunBarrelBlock,
		PlasmaGunBlock,

		//cannon stuff
		CannonBreech,
		...CannonBases,
		...CannonBarrels,

		// machinegun stuff
		MachineGunLoader,
		...MachineGunAmmoBlocks,
		...ArmoredMachineGunBarrels,
		...MachineGunBarrels,
		...MachineGunMuzzleBrakes,
	];

	const blocksArr: BlockBuilder[] = [
		...BuildingBlocks,
		...MechanicalBlocks,
		...BasicOperationBlocks,
		...BasicLogicGateBlocks,
		...WheelBlocks,
		...WingBlocks,
		...LampBlocks,
		...RocketBlocks,
		...ServoMotorBlocks,
		...TNTBlocks,
		...PropellantBlocks,
		...HingeBlocks,
		...StringOperationBlocks,
		...LinearSliderBlocks,
		...TurnTables,
		...RandomAccessMemoryBlocks,

		PistonBlock,
		MotorBlock,
		RCSEngineBlock,
		DisconnectBlock,
		RopeBlock,
		SuspensionBlock,
		BallastBlock,
		HeliumBlock,
		MagnetBlock,
		BracedShaftBlock,
		BearingShaftBlock,

		ScreenBlock,
		LedDisplayBlock,
		SevenSegmentDisplayBlock,
		CameraBlock,
		BeaconBlock,
		TextureBlock,
		SizeBlock,

		VehicleSeatBlock,
		PassengerSeatBlock,
		BackMountBlock,

		DelayBlock,
		ValueExtenderBlock,
		FallbackBlock,
		SingleImpulseBlock,
		ImpulseGeneratorBlock,
		ImpulseExtenderBlock,
		CounterBlock,
		TpsCounterBlock,
		LogicMemoryBlock,
		NonVolatileMemoryBlock,
		LogicMemoryLegacyBlock,
		StackMemoryBlock,
		QueueMemoryBlock,
		ReadonlyMemoryBlock,
		RandomBlock,
		LogicOverclockBlock,
		LuaCircuitBlock,

		AltimeterBlock,
		KeyboardBlock,
		KeySensorBlock,
		ButtonBlock,
		LinearEasingBlock,
		ControllerBlock,
		AngleSensorBlock,
		GPSSensorBlock,
		FireSensorBlock,
		OwnerLocatorBlock,
		OwnerCameraLocatorBlock,
		GravitySensorBlock,
		MassSensorBlock,
		MouseSensorBlock,
		ChatSensorBlock,
		RadioReceiverBlock,
		RadioTransmitterBlock,
		...RadarBlocks,
		RadarWarningReceiver,
		SpeedometerBlock,
		LaserBlock,
		FunctionBlock,

		SpeakerBlock,
		SoundLengthBlock,
		SoundFromIdBlock,
		...SoundEffectBlockCreator.all,

		GuiTextBlock,
		GuiImageBlock,
		GuiButtonBlock,
		GuiStatBlock,

		...ParticleBlocks,

		GyroscopeBlock,
		...JetEngineBlocks,
		...GraviEngineBlocks,
	];

	if (GameDefinitions.isTesting) {
		const testBlocks: readonly BlockBuilder[] = [...weapons];

		for (const block of testBlocks) {
			blocksArr.push(block);
		}
	}

	return BlockListBuilder.buildBlockList(blocksArr, di);
};
