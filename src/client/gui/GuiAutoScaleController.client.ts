import Gui from "client/gui/Gui";
import { ScaledScreenGui } from "./GuiScale";

new ScaledScreenGui(Gui.getGameUI()).enable();
new ScaledScreenGui(Gui.getPopupUI()).enable();
