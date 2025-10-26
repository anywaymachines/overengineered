import { Players } from "@rbxts/services";
import { TextChatService } from "@rbxts/services";
import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder, BlockCategoryPath, BlockModelSource } from "shared/blocks/Block";

const autoModel = (prefab: BlockCreation.Model.PrefabName, text: string, category: BlockCategoryPath) => {
	return {
		model: BlockCreation.Model.fAutoCreated(prefab, text),
		category: () => category,
	} satisfies BlockModelSource;
};
const definition = {
	input: {},
	output: {
		playerMessage: {
			displayName: "Message",
			types: ["string"],
		},
		player: {
			displayName: "Player",
			types: ["string"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as KeySensorBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);
		TextChatService.MessageReceived.Connect((msg) => {
			const id = msg.TextSource?.UserId;
			if (!id) return;
			const plr = Players.GetPlayerByUserId(id);
			if (!plr) return;

			// filter out undesirable chars from richtext chat
			// this is a warning to those who will try AND FAIL
			// to extract text with no rich text in it
			// BE WARNED
			// lua is a pile of garbage and you CAN'T have nice things here

			// WHY THE JZXHIGZFAGFUIAWGDAjk DOES THIS WORK AIUGHFYIAWGFIGWARGAIWRGTOIl YOU ROBLOX
			const stupid = new Instance("TextLabel");
			stupid.RichText = true;
			stupid.Text = msg.Text;

			// the regex doesn't want to work
			// const [noTags, _1] = msg.Text.gsub("<[^>]*>", "");
			// const [noTransformedTags, _] = noTags.gsub("%$lt;[^/%$]+[^%$]*%$gt;", "");
			this.output.player.set("string", plr.Name);
			this.output.playerMessage.set("string", stupid.ContentText);
		});
	}
}

export const ChatSensorBlock = {
	...BlockCreation.defaults,
	id: "chatsensor",
	displayName: "Chat Sensor",
	description: "Returns the most recent message, and the player who sent it.",
	search: { partialAliases: ["speak", "message", "command", "cmd"] },
	modelSource: autoModel("DoubleGenericLogicBlockPrefab", "CHAT SENSOR", BlockCreation.Categories.sensor),

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
