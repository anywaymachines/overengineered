# GUI

Usually using pixels in roblox GUI is a bad idea but not here.

`GuiAutoScaleController.client.ts` automatically creates a `UIScale` object on `GameUI` and updates it with the resolution, so any pixel values would look the same everywhere.

The base resolution is based on 1920x1080, so if you set an object's height to 1080, it would use the whole screen height no matter the actual screen resolution.
But keep in mind that it will only ever scale by Y, so only changes of screen height would change the scale.

That also means that when editing the GUI you should be in 1080p mode, otherwise it would look incorrectly.
To do that, go to the `Test` tab, select `Device` and set the size to `HD 1080`.

Still, you should prefer to use scale instead of pixel when possible.
