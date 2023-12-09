import { Players } from "@rbxts/services";
import PlayerDataStorage from "client/PlayerDataStorage";
import Control from "client/base/Control";
import Popup from "client/base/Popup";
import GuiController from "client/controller/GuiController";
import GameDefinitions from "shared/GameDefinitions";
import Remotes from "shared/Remotes";
import Serializer from "shared/Serializer";
import SlotsMeta from "shared/SlotsMeta";
import ObservableValue from "shared/event/ObservableValue";
import GuiAnimator from "../GuiAnimator";
import { ButtonControl } from "../controls/Button";
import TextBoxControl from "../controls/TextBoxControl";
import LogControl from "../static/LogControl";

type SaveItemDefinition = GuiButton & {
	ImageLabel: ImageLabel;
	TextBox: TextBox;
};

class SaveItem extends ButtonControl<SaveItemDefinition> {
	private readonly index;
	public readonly selected = new ObservableValue(false);

	constructor(gui: SaveItemDefinition, index: number) {
		super(gui);
		this.index = index;

		this.event.subscribeObservable(
			PlayerDataStorage.data,
			(data) => {
				if (!data) return;

				const slot = SlotsMeta.get(data.slots, this.index);
				this.gui.TextBox.Text = slot.name;
				this.gui.ImageLabel.ImageColor3 = Serializer.Color3Serializer.deserialize(slot.color);
			},
			true,
		);

		this.selected.subscribe((selected) => {
			this.gui.BackgroundColor3 = selected ? Color3.fromRGB(63, 70, 88) : Color3.fromRGB(44, 48, 61);
		}, true);
	}
}

type SaveSlotsDefinition = ScrollingFrame & {
	Template: SaveItemDefinition;
	BuyNewTemplate: GuiButton;
};

class SaveSlots extends Control<SaveSlotsDefinition> {
	public readonly selectedSlot = new ObservableValue<number | undefined>(undefined);

	private readonly buyNewTemplate;
	private readonly template;

	constructor(gui: SaveSlotsDefinition) {
		super(gui);

		this.template = Control.asTemplate(this.gui.Template);
		this.buyNewTemplate = Control.asTemplate(this.gui.BuyNewTemplate);

		const slots = new Control<SaveSlotsDefinition, SaveItem>(this.gui);
		this.add(slots);

		PlayerDataStorage.data.subscribe((data) => {
			if (!data) return;

			slots.clear();
			[...data.slots]
				.sort((left, right) => left.index < right.index)
				.forEach((slot) => {
					const item = new SaveItem(this.template(), slot.index);
					item.activated.Connect(() => this.selectedSlot.set(slot.index));
					this.selectedSlot.subscribe((index) => item.selected.set(index === slot.index));
					slots.add(item);
				});

			/*const add = new Control(this.buyNewTemplate());
			add.getGui().Activated.Connect(() => {
				const slotcount = this.slots.getChildren().size();

				if (slotcount + 1 > GameDefinitions.FREE_SLOTS + (data.purchasedSlots ?? 0)) {
					return;
				}
			});
			this.add(add);*/
		}, true);
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

	public readonly selectedSlotIndex = new ObservableValue<number | undefined>(undefined);

	constructor(gui: SavePreviewDefinition) {
		super(gui);

		this.onSave = this.added(new ButtonControl(this.gui.SaveButton)).activated;
		this.onLoad = this.added(new ButtonControl(this.gui.LoadButton)).activated;

		const textbox = new TextBoxControl(this.gui.TextBox);
		this.add(textbox);

		const send = async (slotData: Readonly<Partial<SlotMeta>>) => {
			const data = PlayerDataStorage.data.get();
			if (!data) return;

			const slotIndex = this.selectedSlotIndex.get();
			if (slotIndex === undefined) return;

			await PlayerDataStorage.sendPlayerSlot({
				...slotData,
				index: slotIndex,
				save: false,
			});
		};

		const update = () => {
			const data = PlayerDataStorage.data.get();
			if (!data) {
				this.gui.Visible = false;
				return;
			}

			const slotIndex = this.selectedSlotIndex.get();
			if (slotIndex === undefined) {
				this.gui.Visible = false;
				return;
			}

			this.gui.Visible = true;
			const slot = SlotsMeta.get(data.slots, slotIndex);

			this.gui.ImageButton.ImageColor3 = Serializer.Color3Serializer.deserialize(slot.color);
			textbox.text.set(slot.name);

			if (GameDefinitions.isAdmin(Players.LocalPlayer)) {
				this.gui.HeadingLabel.Text = `Blocks: ${slot.blocks}; Size: ${slot.size}b`;
			} else {
				this.gui.HeadingLabel.Text = `Blocks: ${slot.blocks}`;
			}

			// lock
			const interactable = slotIndex >= 0;
			const setControlActive = (gui: GuiObject) => {
				gui.Interactable = gui.Active = interactable;
				gui.BackgroundTransparency = interactable ? 0 : 0.8;

				if (gui.IsA("TextBox")) {
					gui.TextEditable = interactable;
				}
			};

			setControlActive(this.gui.TextBox);
			setControlActive(this.gui.SaveButton);

			for (const child of buttons) {
				setControlActive(child.getGui());
			}
		};

		this.event.subscribeObservable(this.selectedSlotIndex, update);
		this.event.subscribeObservable(PlayerDataStorage.data, update);
		update();

		const buttons: ButtonControl[] = [];
		for (const child of this.gui.ColorButtons.GetChildren()) {
			if (child.IsA("GuiButton")) {
				const button = this.added(new ButtonControl(child));
				buttons.push(button);

				button.activated.Connect(() => {
					send({ color: Serializer.Color3Serializer.serialize(button.getGui().BackgroundColor3) });
				});
			}
		}
		textbox.submitted.Connect(() => {
			send({ name: textbox.text.get() });
		});
	}
}

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

	private readonly slots;
	private readonly preview;

	constructor(gui: SavePopupDefinition) {
		super(gui);

		this.slots = new SaveSlots(this.gui.Body.Body.ScrollingFrame);
		this.add(this.slots);

		this.preview = new SavePreview(this.gui.Body.Preview);
		this.add(this.preview);
		this.preview.selectedSlotIndex.bindTo(this.slots.selectedSlot);

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

		const cancelButton = this.added(new ButtonControl(this.gui.Body.Body.CancelButton));
		this.event.subscribe(cancelButton.activated, () => this.hide());
	}

	public async show() {
		super.show();
		GuiAnimator.transition(this.gui.Body, 0.2, "down");
	}

	private async save(index: number, save: boolean) {
		const data = PlayerDataStorage.data.get();
		if (!data) return;

		const slot = SlotsMeta.get(data.slots, index);

		const response = await Remotes.Client.GetNamespace("Slots").Get("Save").CallServerAsync({
			index,
			color: slot.color,
			name: slot.name,
			save,
		});

		if (!response.success) {
			LogControl.instance.addLine(response.message);
			return;
		}

		PlayerDataStorage.data.set({
			...data,
			slots: SlotsMeta.with(data.slots, index, {
				blocks: response.blocks ?? slot.blocks,
				size: response.size ?? slot.size,
			}),
		});
	}

	private async load(index: number) {
		await Remotes.Client.GetNamespace("Slots").Get("Load").CallServerAsync(index);
		PlayerDataStorage.loadedSlot.set(index);
	}
}
