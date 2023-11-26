import Control from "client/base/Control";
import Popup from "client/base/Popup";
import { ListControl } from "../controls/ListControl";
import Serializer from "shared/Serializer";
import ObservableValue from "shared/event/ObservableValue";
import Remotes from "shared/Remotes";
import GuiController from "client/controller/GuiController";
import TextBoxControl from "../controls/TextBoxControl";

type SaveItemDefinition = GuiButton & {
	ImageLabel: ImageLabel;
	TextBox: TextBox;
};
class SaveItem extends Control<SaveItemDefinition> {
	public readonly selected = new ObservableValue(false);
	public readonly slot;
	public readonly activated;

	constructor(gui: SaveItemDefinition, slot: PlayerData["slots"][number]) {
		super(gui);
		this.slot = slot;
		this.activated = this.gui.Activated;

		this.gui.TextBox.Text = slot.name;
		this.gui.ImageLabel.ImageColor3 = Serializer.Color3Serializer.deserialize(slot.color);

		this.selected.subscribe((selected) => {
			this.gui.BackgroundColor3 = selected ? new Color3(1, 1, 1) : new Color3(0, 0, 0);
		}, true);
	}
}

type SaveSlotsDefinition = ScrollingFrame & {
	Template: SaveItemDefinition;
	BuyNewTemplate: GuiObject & {};
};
class SaveSlots extends ListControl<SaveSlotsDefinition, SaveItem> {
	public readonly data = new ObservableValue<PlayerData | undefined>(undefined);
	public readonly selectedSlot = new ObservableValue<number | undefined>(undefined);

	private readonly buyNewTemplate;
	private readonly template;

	constructor(gui: SaveSlotsDefinition) {
		super(gui);

		this.template = Control.asTemplate(this.gui.Template);
		this.buyNewTemplate = Control.asTemplate(this.gui.BuyNewTemplate);

		this.data.subscribe((data) => {
			if (!data) return;

			this.clear();
			data.slots.forEach((slot, i) => {
				const item = new SaveItem(this.template(), slot);
				item.activated.Connect(() => this.selectedSlot.set(i));
				this.selectedSlot.subscribe((index) => item.selected.set(index === i));
				this.add(item);
			});
		});
	}
}

type SavePreviewDefinition = GuiButton & {
	ColorButtons: GuiObject & {
		Red: GuiButton;
		Yellow: GuiButton;
		Green: GuiButton;
		Blue: GuiButton;
		White: GuiButton;
		Purple: GuiButton;
	};
	LoadButton: GuiButton;
	SaveButton: GuiButton;
	TextBox: TextBox;
	ImageButton: ImageButton;
};
class SavePreview extends Control<SavePreviewDefinition> {
	public readonly onSave;
	public readonly onLoad;

	public readonly slot = new ObservableValue<PlayerData["slots"][number] | undefined>(undefined);

	public readonly color;
	public readonly name;

	constructor(gui: SavePreviewDefinition) {
		super(gui);

		this.color = this.slot.createChild("color", [255, 255, 255] as SerializedColor);
		this.name = this.slot.createChild("name", "Save slot");

		this.onSave = this.gui.SaveButton.Activated;
		this.onLoad = this.gui.LoadButton.Activated;

		const textbox = new TextBoxControl(this.gui.TextBox);
		this.add(textbox, false);
		textbox.text.bindTo(this.name);

		for (const child of this.gui.ColorButtons.GetChildren()) {
			if (!child.IsA("GuiButton")) continue;

			child.Activated.Connect(() =>
				this.color.set(Serializer.Color3Serializer.serialize(child.BackgroundColor3)),
			);
		}

		this.color.subscribe((value) => {
			this.gui.ImageButton.ImageColor3 = Serializer.Color3Serializer.deserialize(value);
		});

		this.slot.subscribe((slot) => {
			this.gui.Visible = slot !== undefined;
		}, true);
	}
}

type PlayerData = {
	additionalSaveSlots?: number;
	slots: { name: string; color: SerializedColor; blocks: number }[];
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
		});

		this.event.subscribe(this.gui.Body.Body.CancelButton.Activated, () => this.hide());
	}

	private async save(index: number, save: boolean) {
		print("save " + index);
		await Remotes.Client.GetNamespace("Slots").Get("Save").CallServerAsync({
			index,
			color: this.preview.color.get(),
			name: this.preview.name.get(),
			save,
		});
	}
	private async load(index: number) {
		print("loasd " + index);
	}
}
