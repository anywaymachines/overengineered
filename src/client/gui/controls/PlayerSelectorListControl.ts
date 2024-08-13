import { Players, RunService } from "@rbxts/services";
import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { DictionaryControl } from "client/gui/controls/DictionaryControl";
import { TransformService } from "shared/component/TransformService";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { ArgsSignal } from "shared/event/Signal";

type FakePlayer = {
	readonly UserId: number;
	readonly Name: string;
};

type PlayerContainerDefinition = Frame & {
	readonly TextButton: TextButton & {
		readonly ImageLabel: ImageLabel;
		readonly TitleLabel: TextLabel;
	};
};
class PlayerContainer extends Control<PlayerContainerDefinition> {
	readonly clicked;

	constructor(
		gui: PlayerContainerDefinition,
		readonly player: FakePlayer,
	) {
		super(gui);

		gui.TextButton.TitleLabel.Text = `@${player.Name}`;
		task.spawn(() => {
			gui.TextButton.ImageLabel.Image = Players.GetUserThumbnailAsync(
				player.UserId,
				Enum.ThumbnailType.HeadShot,
				Enum.ThumbnailSize.Size100x100,
			)[0];
		});

		const button = this.add(new ButtonControl(gui.TextButton));
		this.clicked = button.activated;
	}
}

export type PlayerSelectorColumnControlDefinition = Frame & {
	readonly TextLabel: TextLabel;
	readonly Left: Frame & {
		readonly Container: PlayerContainerDefinition;
	};
	readonly Right: Frame;
};

export class PlayerSelectorColumnControl extends Control<PlayerSelectorColumnControlDefinition> {
	private readonly playerTemplate;
	private readonly addedPlayers;

	private readonly leftControl;
	private readonly rightControl;

	readonly submitted = new ArgsSignal<[players: readonly number[]]>();

	constructor(gui: PlayerSelectorColumnControlDefinition, addedPlayers: readonly number[]) {
		super(gui);

		this.playerTemplate = this.asTemplate(gui.Left.Container, true);
		this.leftControl = this.add(new DictionaryControl<GuiObject, FakePlayer, PlayerContainer>(gui.Left));
		this.rightControl = this.add(new DictionaryControl<GuiObject, FakePlayer, PlayerContainer>(gui.Right));
		this.addedPlayers = new Set(addedPlayers);

		this.onEnable(() => this.updateOnlinePlayers());
		this.event.subscribe(Players.PlayerAdded, (player) => this.addPlayer(player));
		this.event.subscribe(Players.PlayerRemoving, (player) => this.removePlayer(player));
	}

	updateOnlinePlayers() {
		this.leftControl.clear();
		this.rightControl.clear();

		for (const player of Players.GetPlayers()) {
			this.addPlayer(player);
		}
		const pl: Player[] = [];
		for (const player of pl) {
			this.addPlayer(player);
		}
	}
	private addPlayer(player: FakePlayer | Player) {
		if (player === Players.LocalPlayer) return;
		if (!RunService.IsStudio() && typeIs(player, "Instance") && GameDefinitions.isAdmin(player)) return;

		const control = new PlayerContainer(this.playerTemplate(), player);

		if (!this.addedPlayers.has(player.UserId)) {
			this.leftControl.keyedChildren.add(player, control);
			TransformService.run(control.instance.TextButton, (tr, instance) =>
				tr
					.func(() => (instance.Visible = false))
					.transform("BackgroundTransparency", 1)
					.moveRelative(new UDim2(0, -50, 0, 0))
					.wait(this.leftControl.keyedChildren.getAll().size() * 0.05)
					.then()
					.func(() => (instance.Visible = true))
					.transform("BackgroundTransparency", 0, TransformService.commonProps.quadOut02)
					.moveRelative(new UDim2(0, 50, 0, 0), TransformService.commonProps.quadOut02)
					.then()
					.func(() => {
						control.clicked.Connect(() => {
							this.addedPlayers.add(player.UserId);
							this.removePlayer(player);
							this.addPlayer(player);
							this.submitted.Fire([...this.addedPlayers]);
						});
					}),
			);
		} else {
			this.rightControl.keyedChildren.add(player, control);
			TransformService.run(control.instance.TextButton, (tr, instance) =>
				tr
					.func(() => (instance.Visible = false))
					.transform("BackgroundTransparency", 1)
					.moveRelative(new UDim2(0, 50, 0, 0))
					.wait(this.rightControl.keyedChildren.getAll().size() * 0.05)
					.then()
					.func(() => (instance.Visible = true))
					.transform("BackgroundTransparency", 0, TransformService.commonProps.quadOut02)
					.moveRelative(new UDim2(0, -50, 0, 0), TransformService.commonProps.quadOut02)
					.then()
					.func(() => {
						control.clicked.Connect(() => {
							this.addedPlayers.delete(player.UserId);
							this.removePlayer(player);
							this.addPlayer(player);
							this.submitted.Fire([...this.addedPlayers]);
						});
					}),
			);
		}
	}
	private removePlayer(player: FakePlayer) {
		const control = this.leftControl.keyedChildren.get(player) ?? this.rightControl.keyedChildren.get(player);
		if (!control) return;

		control.disable();
		control.instance.Interactable = false;

		if (this.leftControl.keyedChildren.get(player)) {
			TransformService.run(control.instance.TextButton.TitleLabel, (tr) =>
				tr.transform("TextTransparency", 1, TransformService.commonProps.quadOut02),
			);
			TransformService.run(control.instance.TextButton.ImageLabel, (tr) =>
				tr.transform("ImageTransparency", 1, TransformService.commonProps.quadOut02),
			);
			TransformService.run(control.instance.TextButton, (tr) =>
				tr
					.moveRelative(new UDim2(0, -50, 0, 0), TransformService.commonProps.quadOut02)
					.transform("BackgroundTransparency", 1, TransformService.commonProps.quadOut02)
					.then()
					.func(() => control.destroy()),
			);
		} else {
			TransformService.run(control.instance.TextButton.TitleLabel, (tr) =>
				tr.transform("TextTransparency", 1, TransformService.commonProps.quadOut02),
			);
			TransformService.run(control.instance.TextButton.ImageLabel, (tr) =>
				tr.transform("ImageTransparency", 1, TransformService.commonProps.quadOut02),
			);
			TransformService.run(control.instance.TextButton, (tr) =>
				tr
					.moveRelative(new UDim2(0, 50, 0, 0), TransformService.commonProps.quadOut02)
					.transform("BackgroundTransparency", 1, TransformService.commonProps.quadOut02)
					.then()
					.func(() => control.destroy()),
			);
		}
	}
}
