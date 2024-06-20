import { ReplicatedStorage } from "@rbxts/services";
import { LocalPlayer } from "client/controller/LocalPlayer";
import { ButtonControl } from "client/gui/controls/Button";
import { Gui } from "client/gui/Gui";
import { Popup } from "client/gui/Popup";
import { WikiCategoriesControl, WikiContentControl } from "client/wiki/WikiControl";
import type { WikiCategoriesControlDefinition, WikiContentControlDefinition } from "client/wiki/WikiControl";
import type { BlockRegistry } from "shared/block/BlockRegistry";

namespace WikiStorage {
	let cache: readonly WikiEntry[] | undefined = undefined;

	export function getAll(): readonly WikiEntry[] {
		function findAllWikis(): readonly ModuleScript[] {
			const ret: ModuleScript[] = [];
			const visit = (instance: Instance) => {
				if (instance.IsA("ModuleScript") && instance.Name.find(".wiki")[0]) {
					ret.push(instance);
				}

				for (const child of instance.GetChildren()) {
					visit(child);
				}
			};

			visit(ReplicatedStorage);
			visit(LocalPlayer.player.WaitForChild("PlayerScripts"));

			return ret;
		}

		if (cache) return cache;

		const found: WikiEntry[] = [];
		for (const scr of findAllWikis()) {
			const w = require(scr) as {
				readonly _Wiki?: WikiEntry;
				readonly _Wikis?: readonly WikiEntry[];
			};

			if (w._Wiki) {
				found.push(w._Wiki);
			}
			if (w._Wikis) {
				for (const wiki of w._Wikis) {
					found.push(wiki);
				}
			}
		}

		return (cache = found);
	}
}

export type WikiPopupDefinition = GuiObject & {
	readonly Heading: Frame & {
		readonly CloseButton: TextButton;
		readonly TitleLabel: TextLabel;
	};
	readonly Content: GuiObject & {
		readonly Categories: WikiCategoriesControlDefinition;
		readonly Content: WikiContentControlDefinition;
	};
};

@injectable
export class WikiPopup extends Popup<WikiPopupDefinition> {
	static addAsService(host: GameHostBuilder) {
		const gui = Gui.getGameUI<{ Popup: { Wiki: WikiPopupDefinition } }>().Popup.Wiki;
		host.services.registerTransientFunc((ctx) => ctx.resolveForeignClass(this, [gui.Clone()]));
	}

	constructor(gui: WikiPopupDefinition, @inject blockRegistry: BlockRegistry) {
		super(gui);

		this.add(new ButtonControl(gui.Heading.CloseButton, () => this.hide()));

		const sidebar = this.add(new WikiCategoriesControl(gui.Content.Categories));
		const content = this.add(new WikiContentControl(gui.Content.Content, blockRegistry));
		content.set({ id: "", title: "", tags: new ReadonlySet(), content: [] });

		const wikis = asObject(WikiStorage.getAll().mapToMap((w) => $tuple(w.id, w)));
		sidebar.addItems(
			asMap(wikis)
				.map((k, w) => ({ id: k, title: w.title }))
				.sort((l, r) => l.id < r.id),
		);
		this.event.subscribe(sidebar.clicked, (id) => content.set(wikis[id]));
	}
}
