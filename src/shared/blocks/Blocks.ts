import { ConstantBlock } from "shared/blocks/ConstantBlock";
import { DisconnectBlock } from "shared/blocks/DisconnectBlock";
import { VehicleSeatBlock } from "shared/blocks/VehicleSeatBlock";

type BlocksObject = { readonly [k in (typeof blocksArr)[number]["id"]]: Block };
type BlockId = keyof BlocksObject;

const blocksArr = [
	DisconnectBlock,
	VehicleSeatBlock,
	ConstantBlock,
	//
] as const satisfies Block[];

export type GenericBlockList = { readonly [k in string]: Block | undefined };
export const BlockList: BlocksObject = asObject(
	asMap(blocksArr).mapToMap<BlockId, Block>((k, v) => $tuple(v.id, v)),
) as BlocksObject;
