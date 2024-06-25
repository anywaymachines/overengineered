import { BlockDataRegistry } from "shared/BlockDataRegistry";

/* Supported tags
<b> bold
<i> italic
<u> underline
<s> strikethrough
<br/> line break
<uc> uppercase
<sc> smallcaps
<!-- ... --> comment

<stroke - outline; look UIStroke for details
	color="#00A2FF"
	joins="miter"
	thickness="2"
	transparency="0.25">

<font - changing font params
	color="#FF7800"    color="rgb(255,125,0)"
	size="40"
	face="Michroma"
	family="rbxasset://fonts/families/Michroma.json"
	weight="heavy"     weight="900"
	transparency="0.5"
	>
*/
/* CUSTOM supported tags
<h1> font size 50
<h2> font size 44
*/
/* Escaping symbols:
<  &lt;
>  &gt;
"  &quot;
'  &apos;
&  &amp;
*/

declare global {
	type WikiTag = "block" | "logic";

	type WikiEntry = {
		readonly id: BlockId | string;
		readonly title: string;
		readonly tags: ReadonlySet<WikiTag>;
		readonly content: readonly WikiEntryContent[];
		readonly parent?: string;
	};

	type WikiEntryContentString = string;
	type WikiEntryContentBlockRender = {
		readonly type: "blockPreview";
		readonly id: BlockId;
	};
	type WikiEntryContentReference = {
		readonly type: "ref";
		readonly id: WikiEntry["id"];
		readonly customText?: string;
	};
	type WikiEntryContentH1 = {
		readonly type: "h1";
		readonly name: string;
	};
	type WikiEntryContentH2 = {
		readonly type: "h2";
		readonly name: string;
	};
	type WikiEntryContent =
		| WikiEntryContentString
		| WikiEntryContentBlockRender
		| WikiEntryContentReference
		| WikiEntryContentH1
		| WikiEntryContentH2;
}

export namespace Wikis {
	const blockDefaultContent: readonly WikiEntryContent[] = [
		"<i>(sounds of crickets waiting for this to be filled in)</i>",
	];

	export type BlockWikiEntry = Omit<WikiEntry, "id" | "title">;
	export function block(id: BlockId, wiki: BlockWikiEntry): WikiEntry {
		const block = BlockDataRegistry[id];
		return {
			...wiki,
			tags: new ReadonlySet([...wiki.tags, "block"]),
			id,
			title: block.name,
			content: [
				block.description,
				{ type: "blockPreview", id },
				"", // padding
				...(wiki.content.size() === 0 ? blockDefaultContent : wiki.content),
			],
			parent: "blocks",
		};
	}
}
