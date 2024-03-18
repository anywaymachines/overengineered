import Gui from "client/gui/Gui";
import { ScaledScreenGui } from "./ScaledScreenGui";

new ScaledScreenGui(Gui.getGameUI()).enable();
new ScaledScreenGui(Gui.getPopupUI()).enable();
