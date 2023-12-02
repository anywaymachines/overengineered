import Block from "shared/registry/blocks/Block";
import AbstractBlock from "./abstract/AbstractBlock";
import AbstractCategory from "./abstract/AbstractCategory";
import BlockCornerWedge1x1 from "./blocks/BlockCornerWedge1x1";
import BlockWedge1x1 from "./blocks/BlockCorner1x1";
import BlockWedge1x2 from "./blocks/BlockCorner1x2";
import BlockWedge1x3 from "./blocks/BlockCorner1x3";
import BlockWedge1x4 from "./blocks/BlockCorner1x4";
import BlockCornerWedge2x1 from "./blocks/BlockCornerWedge2x1";
import BlockCornerWedge3x1 from "./blocks/BlockCornerWedge3x1";
import BlockCornerWedge4x1 from "./blocks/BlockCornerWedge4x1";
import DisconnectBlock from "./blocks/DisconnectBlock";
import VehicleSeatBlock from "./blocks/VehicleSeatBlock";
import Wing1x1 from "./blocks/Wing1x1";
import Wing1x2 from "./blocks/Wing1x2";
import Wing1x3 from "./blocks/Wing1x3";
import Wing1x4 from "./blocks/Wing1x4";
import SmallRocketEngineBlock from "./blocks/SmallRocketEngine";
import WedgeWing1x1 from "./blocks/WedgeWing1x1";
import WedgeWing1x2 from "./blocks/WedgeWing1x2";
import WedgeWing1x3 from "./blocks/WedgeWing1x3";
import WedgeWing1x4 from "./blocks/WedgeWing1x4";
import MotorBlock from "./blocks/MotorBlock";
import HingeBlock from "./blocks/HingeBlock";
import ServoMotorBlock from "./blocks/ServoMotorBlock";

export default class BlockRegistry {
	public static Blocks: Map<string, AbstractBlock> = new Map<string, AbstractBlock>();
	public static RegisteredBlocks: AbstractBlock[] = [];
	public static RequiredBlocks: AbstractBlock[] = [];

	public static readonly BLOCK = this.registerBlock(new Block());

	// Wedges
	public static readonly BLOCK_WEDGE1x1 = this.registerBlock(new BlockWedge1x1());
	public static readonly BLOCK_WEDGE1x2 = this.registerBlock(new BlockWedge1x2());
	public static readonly BLOCK_WEDGE1x3 = this.registerBlock(new BlockWedge1x3());
	public static readonly BLOCK_WEDGE1x4 = this.registerBlock(new BlockWedge1x4());

	// Corner wedges
	public static readonly BLOCK_CORNERWEDGE1x1 = this.registerBlock(new BlockCornerWedge1x1());
	public static readonly BLOCK_CORNERWEDGE2x1 = this.registerBlock(new BlockCornerWedge2x1());
	public static readonly BLOCK_CORNERWEDGE3x1 = this.registerBlock(new BlockCornerWedge3x1());
	public static readonly BLOCK_CORNERWEDGE4x1 = this.registerBlock(new BlockCornerWedge4x1());

	// Wings
	public static readonly WING1x1 = this.registerBlock(new Wing1x1());
	public static readonly WING1x2 = this.registerBlock(new Wing1x2());
	public static readonly WING1x3 = this.registerBlock(new Wing1x3());
	public static readonly WING1x4 = this.registerBlock(new Wing1x4());

	public static readonly WEDGE_WING1x1 = this.registerBlock(new WedgeWing1x1());
	public static readonly WEDGE_WING1x2 = this.registerBlock(new WedgeWing1x2());
	public static readonly WEDGE_WING1x3 = this.registerBlock(new WedgeWing1x3());
	public static readonly WEDGE_WING1x4 = this.registerBlock(new WedgeWing1x4());

	// Engines
	public static readonly SMALL_ROCKET_ENIGNE = this.registerBlock(new SmallRocketEngineBlock());
	public static readonly MOTOR_BLOCK = this.registerBlock(new MotorBlock());
	public static readonly SERVOMOTOR_BLOCK = this.registerBlock(new ServoMotorBlock());
	public static readonly HINGE_BLOCK = this.registerBlock(new HingeBlock());

	// test
	public static readonly DISCONNECT_BLOCK = this.registerBlock(new DisconnectBlock());

	// Seats
	public static readonly VEHICLE_SEAT = this.registerBlock(new VehicleSeatBlock());

	private static registerBlock(block: AbstractBlock): AbstractBlock {
		this.Blocks.set(block.id, block);
		this.RegisteredBlocks.push(block);
		if (block.isRequired()) this.RequiredBlocks.push(block);
		return block;
	}

	public static getBlockByID(id: string): AbstractBlock | undefined {
		return BlockRegistry.RegisteredBlocks.find((value) => value.id === id);
	}

	public static getBlocksInCategory(category: AbstractCategory): AbstractBlock[] {
		const approved: AbstractBlock[] = [];
		for (let i = 0; i < BlockRegistry.Blocks.size(); i++) {
			const block = BlockRegistry.RegisteredBlocks[i];
			if (block.getCategory() === category) {
				approved.push(block);
			}
		}
		return approved;
	}
}
