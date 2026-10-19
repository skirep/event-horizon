# EVENT HORIZON
### Four memories. One universe.
An original interactive 3D audiovisual experience blending **Nebula Force**, **MazeVerse**, **Cabrils somiat**, and **demoscene**.

**Play:** https://skirep.github.io/event-horizon/

## Experience
- Four fully spatial Three.js worlds, not flat panoramas.
- Nebula Force: an accretion disk, singularity, fleet and planet.
- MazeVerse: a solvable procedural maze with an orb following its BFS solution.
- Cabrils somiat: fictional Mediterranean village, church and time portal. **Artistic invention, not a geographically accurate reconstruction.**
- Demoscene: articulated dancers, neon stage, equalizers and a torus knot.
- Original synthesized score: four 16-bar arrangements at 112 BPM. Kick, snare, hats, bass, pads, melodic motif, stereo delay, convolution reverb.
- Arrangements change at the next bar. Music drives lights, orbs, portal rings, engines, equalizers and dance.
- Export the arrangement as stereo WAV (16 bars + reverb tail).
- Touch/mouse look, gyro 360°, energy interaction, screenshot, fullscreen, reduced-motion default and pause.
- Assets bundled locally; optional Google Font with system fallback.

## Desktop
Click **Inicia l'expedició**. Drag to look; hold to energize. **1–4** or arrows select a world, **Space** energizes, **Esc** returns. Enable **SO** for the soundtrack.

## Android
Open the HTTPS website in Chrome. Tap **360°** for gyro, or drag. Install the **mobile APK** from the latest successful Actions run: the app bundles the scene offline and bridges Android rotation-vector sensors. Rotate/fold without restarting the activity. APKs are debug-signed for sideloading, not Play Store releases.

## Meta Quest
Open the website in **Meta Quest Browser**, press **QUEST VR** and allow immersive mode. Real stereoscopic WebXR with head tracking. Trigger selects the next world; grip energizes. Scenes stay anchored, with no forced camera travel.
The **Quest APK is a launcher** opening this exact HTTPS experience in Meta Quest Browser. It is not a standalone native VR engine. Internet is needed for the first visit. Exit via the Quest system interface.

## Builds
The workflow **Publish web and build Android + Quest** deploys Pages and creates:
- **EventHorizon-Android-Mobile**: mobile debug APK.
- **EventHorizon-MetaQuest**: Quest launcher debug APK.

Run from Actions or push to main. Android: Java 17, Gradle 8.9, AGP 8.7.3, SDK 35, min SDK 26.

## Verification
Android sensors, folding behavior and Quest headsets require hardware testing. Browser/build verification does not establish a specific headset frame rate. Artwork is a new interpretation; assets/code from the older projects are not imported.
Three.js r160.1 is vendored under MIT; see THREE-LICENSE.txt. Score and scene code are original for this project.
