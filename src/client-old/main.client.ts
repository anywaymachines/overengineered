import { Players } from "@rbxts/services";
import MainGUI from "./gui/MainGUI";
import RideMode from "./core/RideMode";
import InputController from "./core/InputController";

function initializeGUI() {
	MainGUI.initialize();
}

function initialize() {
	Players.LocalPlayer.CharacterAdded.Connect((_) => initializeGUI());
	initializeGUI(); // First start

	InputController.initialize();
	RideMode.initialize();
}

initialize();
