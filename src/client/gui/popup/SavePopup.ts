import { Players } from "@rbxts/services";
import PlayerDataStorage from "client/PlayerDataStorage";
import { Colors } from "client/gui/Colors";
import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import Popup from "client/gui/Popup";
import { ButtonControl, ButtonDefinition } from "client/gui/controls/Button";
import TextBoxControl from "client/gui/controls/TextBoxControl";
import ConfirmPopup from "client/gui/popup/ConfirmPopup";
import Serializer from "shared/Serializer";
import SlotsMeta from "shared/SlotsMeta";
import { TransformService } from "shared/component/TransformService";
import GameDefinitions from "shared/data/GameDefinitions";
import ObservableValue from "shared/event/ObservableValue";
import Signal from "shared/event/Signal";

type SaveItemDefinition = GuiButton & {
	readonly ImageLabel: ImageLabel;
	readonly TextBox: TextBox;
};

class SaveItem extends ButtonControl<SaveItemDefinition> {
	private readonly index;
	readonly selected = new ObservableValue(false);

	constructor(gui: SaveItemDefinition, index: number) {
		super(gui);
		this.index = index;

		this.event.subscribeObservable2(
			PlayerDataStorage.slots,
			(slots) => {
				const slot = SlotsMeta.get(slots, this.index);
				this.gui.TextBox.Text = slot.name;
				this.gui.ImageLabel.ImageColor3 = Serializer.Color3Serializer.deserialize(slot.color);
			},
			true,
		);

		this.selected.subscribe((selected) => {
			this.gui.BackgroundColor3 = selected ? Colors.accentDark : Colors.accentBlack;
		}, true);
	}
}

type SaveSlotsDefinition = ScrollingFrame & {
	readonly Template: SaveItemDefinition;
};

class SaveSlots extends Control<SaveSlotsDefinition> {
	private static staticSelected?: number;
	readonly selectedSlot = new ObservableValue<number | undefined>(undefined);

	private readonly template;
	private readonly slots;

	constructor(gui: SaveSlotsDefinition) {
		super(gui);

		const alreadySelected = SaveSlots.staticSelected;
		this.event.onEnable(() => this.selectedSlot.set(alreadySelected));
		this.selectedSlot.subscribe((value) => (SaveSlots.staticSelected = value));

		this.template = this.asTemplate(this.gui.Template);

		this.slots = new Control<SaveSlotsDefinition, SaveItem>(this.gui);
		this.add(this.slots);

		this.event.subscribeObservable2(
			PlayerDataStorage.slots,
			(slots) => {
				if (!slots) return;

				this.slots.clear();
				[...slots]
					.sort((left, right) => left.index < right.index)
					.forEach((slot) => {
						const item = new SaveItem(this.template(), slot.index);
						item.activated.Connect(() => this.selectedSlot.set(slot.index));
						this.selectedSlot.subscribe((index) => item.selected.set(index === slot.index));
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
			},
			true,
		);
	}
}

type SavePreviewDefinition = GuiButton & {
	readonly Buttons: {
		readonly LoadButton: GuiButton;
		readonly SaveButton: GuiButton;
	};
	readonly Content: {
		readonly TextBox: TextBox;
		readonly Colors: GuiObject;
		readonly ImageLabel: ImageLabel;
		readonly HeaderLabel: TextLabel;
	};
};

class SavePreview extends Control<SavePreviewDefinition> {
	readonly onSave = new Signal();
	readonly onLoad = new Signal();

	readonly selectedSlotIndex = new ObservableValue<number | undefined>(undefined);

	constructor(gui: SavePreviewDefinition) {
		super(gui);

		const saveButton = this.add(new ButtonControl(this.gui.Buttons.SaveButton));
		const loadButton = this.add(new ButtonControl(this.gui.Buttons.LoadButton));

		this.event.subscribe(saveButton.activated, () => {
			ConfirmPopup.showPopup(
				"Save to this slot?",
				"It will be impossible to undo this action",
				() => {
					try {
						saveButton.disable();

						const index = this.selectedSlotIndex.get();
						if (index === undefined) return;

						PlayerDataStorage.sendPlayerSlot({
							index,
							save: true,
						});

						this.onSave.Fire();
					} finally {
						saveButton.enable();
					}
				},
				() => {},
			);
		});

		this.event.subscribe(loadButton.activated, async () => {
			try {
				loadButton.disable();

				const index = this.selectedSlotIndex.get();
				if (index === undefined) return;

				this.onLoad.Fire();
				await PlayerDataStorage.loadPlayerSlot(index);
			} finally {
				loadButton.enable();
			}
		});

		const textbox = new TextBoxControl(this.gui.Content.TextBox);
		this.add(textbox);

		const send = async (slotData: Readonly<Partial<SlotMeta>>) => {
			const slotIndex = this.selectedSlotIndex.get();
			if (slotIndex === undefined) return;

			await PlayerDataStorage.sendPlayerSlot({
				...slotData,
				index: slotIndex,
				save: false,
			});
		};

		const update = () => {
			const slots = PlayerDataStorage.slots.get();
			if (!slots) {
				this.gui.Visible = false;
				return;
			}

			const slotIndex = this.selectedSlotIndex.get();
			if (slotIndex === undefined) {
				this.gui.Visible = false;
				return;
			}

			this.gui.Visible = true;
			const slot = SlotsMeta.get(slots, slotIndex);

			this.gui.Content.ImageLabel.ImageColor3 = Serializer.Color3Serializer.deserialize(slot.color);
			textbox.text.set(slot.name);

			if (GameDefinitions.isAdmin(Players.LocalPlayer)) {
				this.gui.Content.HeaderLabel.Text = `Blocks: ${slot.blocks}; Size: ${slot.size}b`;
			} else {
				this.gui.Content.HeaderLabel.Text = `Blocks: ${slot.blocks}`;
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

			setControlActive(this.gui.Content.TextBox);
			setControlActive(this.gui.Buttons.SaveButton);

			for (const child of buttons) {
				setControlActive(child.getGui());
			}
		};

		this.event.subscribeObservable(this.selectedSlotIndex, update);
		this.event.subscribeObservable(PlayerDataStorage.slots, update);
		update();

		const buttons: ButtonControl[] = [];
		for (const child of this.gui.Content.Colors.GetChildren()) {
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
	readonly Slots: GuiObject & {
		readonly Content: {
			readonly ScrollingFrame: SaveSlotsDefinition;
		};
		readonly Buttons: {
			readonly CancelButton: GuiButton;
		};
		readonly Head: {
			readonly CloseButton: ButtonDefinition;
		};
	};
	readonly Slot: SavePreviewDefinition;
};

export default class SavePopup extends Popup<SavePopupDefinition> {
	static showPopup() {
		const popup = new SavePopup(
			Gui.getGameUI<{
				Popup: {
					Slots: SavePopupDefinition;
				};
			}>().Popup.Slots.Clone(),
		);

		popup.show();
	}

	private readonly preview;
	constructor(gui: SavePopupDefinition) {
		super(gui);

		const slots = new SaveSlots(this.gui.Slots.Content.ScrollingFrame);
		this.add(slots);

		this.preview = new SavePreview(this.gui.Slot);
		this.add(this.preview);
		this.preview.selectedSlotIndex.bindTo(slots.selectedSlot);

		this.event.subscribe(this.preview.onLoad, () => this.hide());

		this.add(new ButtonControl(this.gui.Slots.Buttons.CancelButton, () => this.hide()));
		this.add(new ButtonControl(this.gui.Slots.Head.CloseButton, () => this.hide()));
	}

	show() {
		super.show();
		this.preview.selectedSlotIndex.triggerChanged();
		TransformService.run(this.instance, (transform) => transform.slideIn("top", 50, { duration: 0.2 }));
	}
}
