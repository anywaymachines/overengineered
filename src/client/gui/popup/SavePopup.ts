import Control from "client/base/Control";
import Popup from "client/base/Popup";
import Serializer from "shared/Serializer";
import ObservableValue, { AsObservable, ReadonlyObservableValue } from "shared/event/ObservableValue";
import Remotes from "shared/Remotes";
import GuiController from "client/controller/GuiController";
import TextBoxControl from "../controls/TextBoxControl";
import Signal from "@rbxts/signal";
import GameDefinitions from "shared/GameDefinitions";
import SlotsMeta from "shared/SlotsMeta";
import { ButtonControl } from "../controls/Button";
import { Players } from "@rbxts/services";

type SaveItemDefinition = GuiButton & {
	ImageLabel: ImageLabel;
	TextBox: TextBox;
};

class SaveItem extends ButtonControl<SaveItemDefinition> {
	private readonly slot;
	public readonly selected = new ObservableValue(false);
	public readonly color = new ObservableValue(new Color3(1, 1, 1));
	public readonly name = new ObservableValue("Slot");

	constructor(gui: SaveItemDefinition, slot: PlayerData["slots"][number]) {
		super(gui);
		this.slot = slot;
		this.update();

		this.slot.updated.Connect(() => this.update());

		this.selected.subscribe((selected) => {
			this.gui.BackgroundColor3 = selected ? Color3.fromRGB(63, 70, 88) : Color3.fromRGB(44, 48, 61);
		}, true);
	}

	public update() {
		this.gui.TextBox.Text = this.slot.name;
		this.gui.ImageLabel.ImageColor3 = this.slot.color;
	}
}

type SaveSlotsDefinition = ScrollingFrame & {
	Template: SaveItemDefinition;
	BuyNewTemplate: GuiButton;
};

class SaveSlots extends Control<SaveSlotsDefinition> {
	public readonly data = new ObservableValue<PlayerData | undefined>(undefined);
	public readonly selectedSlot = new ObservableValue<number | undefined>(undefined);

	private readonly slots;

	private readonly buyNewTemplate;
	private readonly template;

	constructor(gui: SaveSlotsDefinition) {
		super(gui);

		this.template = Control.asTemplate(this.gui.Template);
		this.buyNewTemplate = Control.asTemplate(this.gui.BuyNewTemplate);

		this.slots = new Control<SaveSlotsDefinition, SaveItem>(this.gui);
		this.add(this.slots, false);

		this.data.subscribe((data) => {
			if (!data) return;

			this.slots.clear();
			data.slots.forEach((slot, i) => {
				const item = new SaveItem(this.template(), slot);
				item.activated.Connect(() => this.selectedSlot.set(i));
				this.selectedSlot.subscribe((index) => item.selected.set(index === i));
				this.slots.add(item);
			});

			/*const add = new Control(this.buyNewTemplate());
			add.getGui().Activated.Connect(() => {
				const slotcount = this.slots.getChildren().size();

				if (slotcount + 1 > GameDefinitions.FREE_SLOTS + (data.purchasedSlots ?? 0)) {
					return;
				}
			});
			this.add(add);*/
		});
	}
}

type SavePreviewDefinition = GuiButton & {
	ColorButtons: GuiObject;
	LoadButton: GuiButton;
	SaveButton: GuiButton;
	TextBox: TextBox;
	ImageButton: ImageButton;
	HeadingLabel: TextLabel;
};

class SavePreview extends Control<SavePreviewDefinition> {
	public readonly onSave;
	public readonly onLoad;

	public readonly slot = new ObservableValue<PlayerData["slots"][number] | undefined>(undefined);

	constructor(gui: SavePreviewDefinition) {
		super(gui);

		const color = this.slot.createChild("color", new Color3(1, 1, 1));
		const name = this.slot.createChild("name", "Save slot");
		const blocks = this.slot.createChild("blocks", 0) as ReadonlyObservableValue<number>;

		this.onSave = this.added(new ButtonControl(this.gui.SaveButton), false).activated;
		this.onLoad = this.added(new ButtonControl(this.gui.LoadButton), false).activated;

		const textbox = new TextBoxControl(this.gui.TextBox);
		this.add(textbox, false);
		textbox.text.bindTo(name);

		for (const child of this.gui.ColorButtons.GetChildren()) {
			if (!child.IsA("GuiButton")) continue;

			child.Activated.Connect(() => {
				color.set(child.BackgroundColor3);
				this.slot.get()?.updated.Fire();
			});
		}
		textbox.submitted.Connect(() => {
			this.slot.get()?.updated.Fire();
		});

		color.subscribe((value) => {
			this.gui.ImageButton.ImageColor3 = value;
		});

		blocks.subscribe((value) => {
			if (GameDefinitions.DEVELOPERS.includes(Players.LocalPlayer.UserId)) {
				this.gui.HeadingLabel.Text = `Blocks: ${value}; Size: ${this.slot.get()?.size ?? 0}b`;
			} else {
				this.gui.HeadingLabel.Text = `Blocks: ${value}`;
			}
		}, true);

		const buttons: ButtonControl[] = [];
		for (const child of this.gui.ColorButtons.GetChildren()) {
			if (child.IsA("GuiButton")) {
				const button = this.added(new ButtonControl(child), false);
				buttons.push(button);

				button.activated.Connect(() => {
					color.set(child.BackgroundColor3);
					this.slot.get()?.updated.Fire();
				});
			}
		}

		this.slot.subscribe((slot) => {
			this.gui.Visible = slot !== undefined;

			this.gui.TextBox.Interactable = slot?.locked !== true;
			this.gui.ImageButton.Interactable = slot?.locked !== true;
			this.gui.SaveButton.Interactable = slot?.locked !== true;
			for (const child of buttons) {
				child.getGui().Interactable = slot?.locked !== true;
			}
		}, true);
	}
}

export type PlayerDataSlot = {
	readonly updated: Signal<() => void>;
	blocks: number;
	size: number;
	name: string;
	color: Color3;
	locked?: boolean;
};
export type PlayerData = {
	purchasedSlots: number;
	slots: readonly PlayerDataSlot[];
};

export type SavePopupDefinition = GuiObject & {
	Body: GuiObject & {
		Body: GuiObject & {
			ScrollingFrame: SaveSlotsDefinition;
			CancelButton: GuiButton;
		};
		Preview: SavePreviewDefinition;
	};
};

export default class SavePopup extends Popup<SavePopupDefinition> {
	public static readonly instance = new SavePopup(
		GuiController.getGameUI<{
			Popup: {
				SlotsGui: SavePopupDefinition;
			};
		}>().Popup.SlotsGui,
	);

	public readonly data = new ObservableValue<PlayerData | undefined>(undefined);

	private readonly slots;
	private readonly preview;

	constructor(gui: SavePopupDefinition) {
		super(gui);

		this.slots = new SaveSlots(this.gui.Body.Body.ScrollingFrame);
		this.slots.data.bindTo(this.data);
		this.add(this.slots, false);

		this.preview = new SavePreview(this.gui.Body.Preview);
		this.add(this.preview, false);

		this.slots.selectedSlot.subscribe((index) => {
			const data = this.data.get();
			if (!data) return;

			this.preview.slot.set(index === undefined ? undefined : data.slots[index]);
		});

		this.event.subscribe(this.preview.onSave, () => {
			const index = this.slots.selectedSlot.get();
			if (index === undefined) return;
			this.save(index, true);
		});
		this.event.subscribe(this.preview.onLoad, () => {
			const index = this.slots.selectedSlot.get();
			if (index === undefined) return;
			this.load(index);
			this.hide();
		});

		this.data.subscribe((data) => {
			if (!data) return;

			data.slots.forEach((slot, index) => {
				slot.updated.Connect(() => {
					this.save(index, false);
				});
			});
		});

		const cancelButton = this.added(new ButtonControl(this.gui.Body.Body.CancelButton), false);
		this.event.subscribe(cancelButton.activated, () => this.hide());
	}

	private async loadData() {
		const data = await Remotes.Client.GetNamespace("Slots").Get("Fetch").CallServerAsync();
		const slots = SlotsMeta.fromSerialized(data.slots)
			.getAll(GameDefinitions.FREE_SLOTS + data.purchasedSlots)
			.map(
				(slot, index) =>
					({
						...slot,
						updated: new Signal<() => void>(),
						color: Serializer.Color3Serializer.deserialize(slot.color),
						locked: index < 0,
					}) as PlayerDataSlot,
			);

		this.data.set({
			...data,
			slots,
		});
	}

	public async show() {
		if (!this.data.get()) await this.loadData();
		super.show();
	}

	private async save(index: number, save: boolean) {
		const data = this.data.get();
		if (!data) return;

		const response = await Remotes.Client.GetNamespace("Slots")
			.Get("Save")
			.CallServerAsync({
				index,
				color: Serializer.Color3Serializer.serialize(data.slots[index].color),
				name: data.slots[index].name,
				save,
			});

		if (response.blocks !== undefined) {
			this.preview.slot.get()!.blocks = response.blocks;
			this.preview.slot.set(this.preview.slot.get(), true);
		}

		if (response.size !== undefined) {
			this.preview.slot.get()!.size = response.size;
			this.preview.slot.set(this.preview.slot.get(), true);
		}
	}

	private async load(index: number) {
		await Remotes.Client.GetNamespace("Slots").Get("Load").CallServerAsync(index);
	}
}
