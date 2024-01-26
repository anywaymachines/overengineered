# Physics

---

### [Impact Physics](/src/client/controller/ImpactController.ts)
Physics is based on destruction by checking the speed difference and density of two touching Parts
> It was invented and implemented according to the two most important properties for destruction

### [Gravity Physics](/src/client/controller/GameEnvironmentController.ts)
By default (on the ground), gravity is 180 (54 m/s^2), but it is relative to altitude, that is, at an altitude of 15,000 studs (~4.000m), gravity will be zero.
> Invented because there are no spherical planets in the game

### [Air Density Physics](/src/client/controller/GameEnvironmentController.ts)
By default (on the ground), the air density is equal to 0.2 kg/m^3 (instead of 0.001 kg/m^3 real). The air density is relative to altitude, so at an altitude of 10,000 studs (~3.500m), the air density will be zero, and it will be impossible to fly on airplanes
> Implemented in Roblox, using via `Workspace.AirDensity`

### [Sound Physics](/src/client/controller/SoundController.ts)
The physics of sound stops working at the same altitude, where the air density is zero, because there is nothing to transmit sound, you are in a vacuum. The physics of sound underwater has also been implemented so that all extraneous sounds are muffled.
> Implemented based on real physics, but simplified