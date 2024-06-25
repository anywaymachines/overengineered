import { Wikis } from "client/wiki/Wikis";
import { BlockDataRegistry } from "shared/BlockDataRegistry";
import { Objects } from "shared/fixes/objects";

const notags = new ReadonlySet<WikiTag>();
type BlockWikis = { readonly [k in BlockId]?: Wikis.BlockWikiEntry };

const wiki: BlockWikis = {
	block: {
		tags: notags,
		content: [
			`Block is a <b>block</b> with <i>a very</i> much <b><i>blockness</i></b>`,
			{ type: "h1", name: "Usage" },
			"Amongus",
			"And others",
		],
	},
	halfblock: {
		tags: notags,
		content: [
			`HalfBlock is a <i>half</i> of a <b>block</b> with <i>a very</i> less <b><i>blockness</i></b>`,
			{ type: "h1", name: "Usage" },
			{ type: "h2", name: "Actual Usage" },
			"Amonguser",
			"And others",
			{ type: "h2", name: "Secondary Usage" },
			"eating",
			{ type: "h1", name: "Lore" },
			{ type: "h2", name: "Creation" },
			"by the Godrick the Grafted, forged was this Block withing the flame of the Forge of Giants and then broken in half because why not",
		],
	},
};

const filledWiki = {
	...Objects.fromEntries(
		asMap(BlockDataRegistry).map((k): [BlockId, Wikis.BlockWikiEntry] => [k, { tags: notags, content: [] }]),
	),
	...wiki,
};
export const _Wikis: readonly WikiEntry[] = [
	{
		id: "blocks",
		title: "Blocks",
		tags: new Set(["block"]),
		content: [
			`
Block is a block what can be placed and unplaced and moved
There's a lot of blocks yk
For example:
			`,
			{ type: "ref", id: "block" },
			{ type: "ref", id: "halfblock" },
			{ type: "ref", id: "ceil" },
		],
	},
	...asMap(filledWiki).map(Wikis.block),
];
