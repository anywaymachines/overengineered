import { Players } from "@rbxts/services";
import Signal from "@rbxts/signal";
import PlayerDataStorage from "client/PlayerDataStorage";
import Control from "client/base/Control";
import Popup from "client/base/Popup";
import GuiController from "client/controller/GuiController";
import PopupController from "client/controller/PopupController";
import Serializer from "shared/Serializer";
import SlotsMeta from "shared/SlotsMeta";
import GameDefinitions from "shared/data/GameDefinitions";
import ObservableValue from "shared/event/ObservableValue";
import GuiAnimator from "../GuiAnimator";
import { ButtonControl } from "../controls/Button";
import TextBoxControl from "../controls/TextBoxControl";

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
			PlayerDataStorage.slots,
			(slots) => {
				const slot = SlotsMeta.get(slots, this.index);
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

	private readonly slots;

	constructor(gui: SaveSlotsDefinition) {
		super(gui);

		this.template = Control.asTemplate(this.gui.Template);
		this.buyNewTemplate = Control.asTemplate(this.gui.BuyNewTemplate);

		this.slots = new Control<SaveSlotsDefinition, SaveItem>(this.gui);
		this.add(this.slots);

		PlayerDataStorage.slots.subscribe((slots) => {
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
	readonly onSave = new Signal<() => void>();
	readonly onLoad = new Signal<() => void>();

	public readonly selectedSlotIndex = new ObservableValue<number | undefined>(undefined);

	constructor(gui: SavePreviewDefinition) {
		super(gui);

		const saveButton = this.added(new ButtonControl(this.gui.SaveButton));
		const loadButton = this.added(new ButtonControl(this.gui.LoadButton));

		this.event.subscribe(saveButton.activated, () => {
			PopupController.instance.showConfirmation(
				"Save to this slot?",
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

				const response = await PlayerDataStorage.loadPlayerSlot(index);
				if (response.success && !response.isEmpty) {
					this.onLoad.Fire();
				}
			} finally {
				loadButton.enable();
			}
		});

		const textbox = new TextBoxControl(this.gui.TextBox);
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
		this.event.subscribeObservable(PlayerDataStorage.slots, update);
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

		this.event.subscribe(this.preview.onLoad, () => this.hide());

		const cancelButton = this.added(new ButtonControl(this.gui.Body.Body.CancelButton));
		this.event.subscribe(cancelButton.activated, () => this.hide());
	}

	public async show() {
		super.show();
		GuiAnimator.transition(this.gui.Body, 0.2, "down");
	}
}
