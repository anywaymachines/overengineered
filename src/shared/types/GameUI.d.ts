interface GameUI {
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
	ActionBar: Frame & {
		Buttons: Frame & {
			UIListLayout: UIListLayout;
			Save: TextButton;
			Settings: TextButton;
			Run: TextButton;
		};
		GamepadSelect: ImageLabel;
	};
	ToolsGui: Folder & {
		BuildToolSelection: Frame & {
			Buttons: ScrollingFrame & {
				UIListLayout: UIListLayout;
				BlockTemplate: TextButton & {
					Frame: Frame & {
						LimitLabel: TextLabel;
					};
					TextLabel: TextLabel;
				};
				CategoryTemplate: TextButton & {
					Frame: Frame & {
						ImageLabel: ImageLabel;
					};
					TextLabel: TextLabel;
				};
			};
		};
		DeleteAllButton: TextButton;
	};
	ControlTooltips: Frame & {
		GamepadTemplate: Frame & GamepadTooltipFrame;
		KeyboardTemplate: Frame & KeyboardTooltipFrame;
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

interface GameDialog {
	ConfirmationWindow: Frame & {
		CloseButton: TextButton;
		Answers: Frame & {
			YesButton: TextButton;
			NoButton: TextButton;
		};
		HeadingLabel: TextLabel;
		DescriptionLabel: TextLabel;
	};
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
	Ride: Folder & {
		RideStart: Sound;
	};
	GuiClick: Sound;
}

interface MyToolsGuiButton {
	ImageButton: ImageButton;
	KeyboardButtonTooltip: TextLabel;
}
