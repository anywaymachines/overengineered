interface MyGui {
	Sounds: Folder & MyGuiSounds;
	TouchControls: Folder & {
		BuildTool: Frame & {
			PlaceButton: TextButton;
			RotateRButton: TextButton;
			RotateTButton: TextButton;
			RotateYButton: TextButton;
		};
		DeleteTool: Frame & {
			DeleteButton: TextButton;
		};
	};
	ToolsGui: Folder & {
		DeleteAllButton: TextButton;
	};
	ControlTooltips: Frame & {
		GamepadTemplate: Frame & GamepadTooltipFrame;
		KeyboardTemplate: Frame & KeyboardTooltipFrame;
	};
	ConfirmationWindow: Frame & {
		Answers: Frame & {
			YesButton: TextButton;
			NoButton: TextButton;
		};
		HeadingLabel: TextLabel;
		DescriptionLabel: TextLabel;
	};
	Tools: Frame & {
		GamepadNext: ImageLabel;
		GamepadBack: ImageLabel;
		Buttons: Frame & {
			Build: Frame & MyToolsGuiButton;
			Connect: Frame & MyToolsGuiButton;
			Configure: Frame & MyToolsGuiButton;
			Delete: Frame & MyToolsGuiButton;
			Move: Frame & MyToolsGuiButton;
			Paint: Frame & MyToolsGuiButton;
		};
	};
	CurrentToolLabel: TextLabel;
	CurrentToolDescriptionLabel: TextLabel;
}

type GamepadTextTooltipKeys = "ButtonA" | "ButtonB" | "ButtonY" | "ButtonX";
type GamepadTextTooltip = Partial<Record<GamepadTextTooltipKeys, string>>;

interface GamepadTooltipFrame {
	ImageLabel: ImageLabel;
	TextLabel: TextLabel;
}

interface KeyboardTooltipFrame {
	ImageLabel: ImageLabel & {
		KeyLabel: TextLabel;
	};
	TextLabel: TextLabel;
}

interface MyGuiSounds {
	Building: Folder & {
		BlockPlace: Sound;
		BlockPlaceError: Sound;
		BlockRotate: Sound;
		BlockDelete: Sound;
	};
	GuiClick: Sound;
}

interface MyToolsGuiButton {
	ImageButton: ImageButton;
	KeyboardButtonTooltip: TextLabel;
}
