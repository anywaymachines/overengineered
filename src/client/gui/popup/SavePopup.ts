import { PlayerDataStorage } from "client/PlayerDataStorage";
import { Control } from "client/gui/Control";
import { Gui } from "client/gui/Gui";
import { Popup } from "client/gui/Popup";
import { ButtonControl, TextButtonDefinition } from "client/gui/controls/Button";
import { TextBoxControl } from "client/gui/controls/TextBoxControl";
import { ConfirmPopup } from "client/gui/popup/ConfirmPopup";
import { Serializer } from "shared/Serializer";
import { TransformService } from "shared/component/TransformService";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { ObservableValue } from "shared/event/ObservableValue";
import { Signal } from "shared/event/Signal";

const NOT_EDITABLE_IMAGE = "rbxassetid://15428855911";
const EDITABLE_IMAGE = "rbxassetid://17320900740";
const UNKNOWN_DATE = "Unknown date";

const FROM_INTERNAL_BADGE = "FROM INTERNAL";
const FROM_PRODUCTION_BADGE = "FROM PRODUCTION";
const IMPORT_SECTION = "Other slots";
const BACKEND_ISSUES = "⚠️ Importing from other experiences may not be available";

type SlotRecordDefinition = GuiObject & {
	readonly Content: Frame & {
		readonly SlotButton: ImageButton;
		readonly LoadButton: TextButton;
		readonly SaveButton: TextButton;
		readonly SlotName: Frame & {
			readonly SlotNameTextBox: TextBox;
			readonly ImageLabel: ImageLabel;
		};
		readonly BlocksLabel: TextLabel;
		readonly BadgeTextLabel: TextLabel;
	};
	readonly Deep: Frame & {
		readonly ColorSelection: GuiObject & Record<string, TextButtonDefinition>;
		readonly SaveDateTextLabel: TextLabel;
	};
};

class SaveItem extends Control<SlotRecordDefinition> {
	private readonly _onOpened = new Signal();
	private readonly _onSave = new Signal();
	private readonly _onLoad = new Signal();
	readonly onSave = this._onSave.asReadonly();
	readonly onLoad = this._onLoad.asReadonly();
	readonly onOpened = this._onOpened.asReadonly();

	constructor(gui: SlotRecordDefinition, meta: SlotMeta, isImported: boolean = false) {
		super(gui);

		const save = () => {
			ConfirmPopup.showPopup(
				"Save to this slot?",
				"It will be impossible to undo this action",
				() => {
					try {
						saveButton.disable();
						PlayerDataStorage.sendPlayerSlot({ index: meta.index, save: true });
						this._onSave.Fire();
					} finally {
						saveButton.enable();
					}
				},
				() => {},
			);
		};
		const load = async () => {
			try {
				loadButton.disable();
				this._onLoad.Fire();
				await PlayerDataStorage.loadPlayerSlot(meta.index, isImported);
			} finally {
				loadButton.enable();
			}
		};

		const saveButton = this.add(new ButtonControl(this.gui.Content.SaveButton, save));
		const loadButton = this.add(new ButtonControl(this.gui.Content.LoadButton, load));
		const nametb = this.add(new TextBoxControl(this.gui.Content.SlotName.SlotNameTextBox));
		nametb.submitted.Connect(() => send({ name: nametb.text.get() }));

		const send = async (slotData: Readonly<Partial<SlotMeta>>) => {
			await PlayerDataStorage.sendPlayerSlot({ ...slotData, index: meta.index, save: false });
		};

		const buttons: ButtonControl[] = [];
		for (const child of this.gui.Deep.ColorSelection.GetChildren()) {
			if (!child.IsA("GuiButton")) continue;

			const button = this.add(
				new ButtonControl(child, () =>
					send({ color: Serializer.Color3Serializer.serialize(child.BackgroundColor3) }),
				),
			);
			buttons.push(button);
		}

		const slots = PlayerDataStorage.slots.get();
		if (!slots) throw "what";

		this.gui.Content.SlotButton.ImageColor3 = isImported
			? Color3.fromRGB(150, 150, 150)
			: Serializer.Color3Serializer.deserialize(meta.color);
		nametb.text.set(meta.name);
		this.gui.Deep.SaveDateTextLabel.Text = ""; // TODO:

		//this.gui.Content.BlocksLabel.Text = `Blocks: ${slot.blocks}; Size: ${slot.size}b`;
		this.gui.Content.BlocksLabel.Text = meta.blocks === 0 ? "Empty" : `Blocks: ${meta.blocks}`;

		const interactable = meta.index >= 0 && !isImported;
		const setControlActive = (gui: GuiObject) => {
			gui.Interactable = gui.Active = interactable;
			gui.BackgroundTransparency = interactable ? 0 : 0.8;

			if (gui.IsA("TextBox")) {
				gui.TextEditable = interactable;
			}
		};

		saveButton.setInteractable(interactable);
		this.gui.Content.SlotName.ImageLabel.Image = interactable ? EDITABLE_IMAGE : NOT_EDITABLE_IMAGE;

		setControlActive(this.gui.Content.SlotName.SlotNameTextBox);
		for (const child of buttons) {
			setControlActive(child.instance);
		}

		this.gui.Content.BadgeTextLabel.Visible = isImported;
		this.gui.Content.BadgeTextLabel.Text = GameDefinitions.isTestPlace() ? "FROM PRODUCTION" : "FROM INTERNAL";

		this.setOpened(false);
		TransformService.finish(this.instance);

		this.add(
			new ButtonControl(this.gui.Content.SlotButton, () => {
				this.setOpened((this.opened = !this.opened));
				this._onOpened.Fire();
			}),
		);
	}

	private readonly heightStateMachine = TransformService.boolStateMachine(
		this.instance,
		TransformService.commonProps.quadOut02,
		{ Size: this.instance.Size },
		{ Size: this.instance.Size.sub(new UDim2(new UDim(), this.instance.Deep.Size.Y)) },
	);

	private opened = false;
	setOpened(opened: boolean) {
		this.opened = opened;
		this.heightStateMachine(opened);
	}
}

type SaveSlotsDefinition = ScrollingFrame & {
	readonly Template: SlotRecordDefinition;
	readonly CommentTemplate: TextLabel;
};

class SaveSlots extends Control<SaveSlotsDefinition> {
	private static staticSelected?: number;

	private readonly _onSave = new Signal();
	private readonly _onLoad = new Signal();
	readonly onSave = this._onSave.asReadonly();
	readonly onLoad = this._onLoad.asReadonly();

	readonly search = new ObservableValue<string | undefined>(undefined);
	readonly selectedSlot = new ObservableValue<number | undefined>(undefined);
	private readonly template;
	private readonly commentTemplate;

	private readonly slots;

	constructor(gui: SaveSlotsDefinition) {
		super(gui);

		const alreadySelected = SaveSlots.staticSelected;
		this.event.onEnable(() => this.selectedSlot.set(alreadySelected));
		this.selectedSlot.subscribe((value) => (SaveSlots.staticSelected = value));

		this.template = this.asTemplate(this.gui.Template);
		this.commentTemplate = this.asTemplate(this.gui.CommentTemplate);

		this.slots = new Control<SaveSlotsDefinition, SaveItem>(this.gui);
		this.add(this.slots);

		const recreate = () => {
			this.slots.clear();

			const slots = PlayerDataStorage.slots.get();
			if (!slots) return;

			const filter = this.search.get()?.lower();
			for (const slot of [...slots].sort((left, right) => left.index < right.index)) {
				if (filter !== undefined && filter.size() !== 0 && slot.name.lower().find(filter)[0] === undefined) {
					continue;
				}

				const item = new SaveItem(this.template(), slot);
				item.onSave.Connect(() => {
					this.selectedSlot.set(slot.index);
					this._onSave.Fire();
				});
				item.onLoad.Connect(() => {
					this.selectedSlot.set(slot.index);
					this._onLoad.Fire();
				});
				item.onOpened.Connect(() => {
					for (const slot of this.slots.getChildren()) {
						if (slot === item) continue;
						slot.setOpened(false);
					}
				});
				this.slots.add(item);
			}

			const externalSlots = PlayerDataStorage.imported_slots.get();
			if (!externalSlots || externalSlots.size() === 0) return;

			for (const slot of [...externalSlots].sort((left, right) => left.index < right.index)) {
				if (filter !== undefined && filter.size() !== 0 && slot.name.lower().find(filter)[0] === undefined) {
					continue;
				}

				const item = new SaveItem(this.template(), slot, true);
				item.onSave.Connect(() => {
					this.selectedSlot.set(slot.index);
					this._onSave.Fire();
				});
				item.onLoad.Connect(() => {
					this.selectedSlot.set(slot.index);
					this._onLoad.Fire();
				});
				item.onOpened.Connect(() => {
					for (const slot of this.slots.getChildren()) {
						if (slot === item) continue;
						slot.setOpened(false);
					}
				});
				this.slots.add(item);
			}
		};

		this.event.subscribeObservable(PlayerDataStorage.slots, recreate);
		this.event.subscribeObservable(this.search, recreate);
		recreate();
	}
}

export type SlotsPopupDefinition = GuiObject & {
	readonly Heading: Frame & {
		readonly CloseButton: TextButton;
		// readonly TitleLabel: TextLabel;
	};
	readonly Content: SaveSlotsDefinition;
	readonly Search: TextBox;
};

export class SavePopup extends Popup<SlotsPopupDefinition> {
	static showPopup() {
		const popup = new SavePopup(
			Gui.getGameUI<{
				Popup: {
					Slots: SlotsPopupDefinition;
				};
			}>().Popup.Slots.Clone(),
		);

		popup.show();
	}

	constructor(gui: SlotsPopupDefinition) {
		super(gui);

		const slots = this.add(new SaveSlots(this.gui.Content));
		this.event.subscribe(slots.onLoad, () => this.hide());
		this.add(new ButtonControl(this.gui.Heading.CloseButton, () => this.hide()));

		const search = this.add(new TextBoxControl(gui.Search));
		this.event.subscribeObservable(search.text, (text) => slots.search.set(text), true);
	}

	show() {
		super.show();
		TransformService.run(this.instance, (transform) => transform.slideIn("top", 50, { duration: 0.2 }));
	}
}
