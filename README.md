# EL SEGON QUE FALTA · Event Horizon v2
A connected, playable adventure from a fictional Cabrils to MazeVerse and Nebula Force.

**Play:** https://skirep.github.io/event-horizon/

A second has disappeared from the village clock. Inside it is a forest, an impossible sky, and the route back home. You carry the same meridian key throughout the story. There is no scene selector and no way to bypass the objectives.

## The journey
1. **The square without a second.** Walk around the square and read the clock's inscription. Ring the sun, wave and moon bells in the correct order. The key awakens and powers the physical portal.
2. **The threads of the forest.** Explore a generated, solvable maze with solid walls. Carry the key to three beacons and hold action to reconnect them. Recover the core at the sanctuary; the same sanctuary becomes the next portal.
3. **Return vector.** The core powers the Falcon-X cockpit. Steer through three spatial navigation rings, fire at drones, preserve the shield. Missing a ring recalculates that ring rather than resetting the story.
4. **A whole second.** Return to the same village square and put the core into the clock. The clock starts, the musical theme resolves, and the story ends.

Progress persists locally at objectives and chapter changes. Restart is an explicit menu action.

## Original soundtrack
Four original rendered cues, about four minutes altogether:
- La plaça sense segon: piano, flute, strings and clock-like celesta, 90 BPM.
- Els fils del bosc: clarinet, harp, pizzicato, cello and choir, 100 BPM.
- Vector de retorn: the main theme developed for horn, strings and percussion, 120 BPM.
- Un segon sencer: the theme returns in a lower register, piano and strings, 80 BPM.

These are sample-rendered arrangements, not the former oscillator loop. Musical progression, voicing, motif, orchestration and synthesis source are in tools/compose_score.py. Rendered with FluidSynth and TimGM6mb; credits are in assets/audio/. No third-party tune or recording is used.

The AudioContext clock drives beacon glows and the carried artifact. Chapter transitions align to the next bar and crossfade cues. Bells and beacon rewards are in the score's key. Music starts only after a user gesture, with volume, mute and pause controls.

## Controls
- **Desktop:** WASD / arrows move; drag to look; E / Space interact or hold; H gives a hint. Escape opens pause/options.
- **Touch:** left joystick moves, drag the scene to look; right action button taps or charges. Tap an object to approach it, then tap again nearby to interact.
- **Assisted navigation:** pause → Navegació assistida. Select an object to walk to it. It does not ring bells, charge beacons, collect objects or skip chapters.
- **Maze assistance:** the hint button shows a valid route to the next objective.
- **Android gyro:** 360° switches look to device orientation; the joystick still moves.
- **Quest:** open the HTTPS page in Meta Quest Browser and press QUEST VR. Trigger interacts or teleports onto a valid floor cell; hold trigger/grip charges a beacon; left stick moves, right stick snap-turns. A spatial ECO panel gives the objective and current dialogue. The flight segment keeps a stable cockpit and no forced camera roll.

Cabrils is an artistic Mediterranean interpretation, **not an accurate reconstruction**. The church is invented architecture.

## Android and Quest builds
The mobile APK includes all scene code and the full rendered score offline. Rotation/fold changes retain the activity. The Android rotation-vector sensor is bridged to the web renderer.

The Quest APK is an explicit launcher into Meta Quest Browser/WebXR, not a native standalone VR engine. Internet is required for its first visit, and immersive permission is requested in the browser.

Debug-signed APKs for sideloading are available in Actions:
- ElSegon-Android-Mobile
- ElSegon-MetaQuest

## QA and deployment
- Pure tests cover wrong puzzle input, locked progression, all maze objective routes over 30 seeds, key/core persistence, ring retry behavior and the ending.
- Browser QA renders actual WebGL in CI, uses public touch/keyboard/assisted-navigation controls, plays the connected journey and captures screenshots. It never sets adventure state directly.
- Pages deployment depends on passing browser QA. The previous site stays online if the new experience fails.
- Browser artifacts include screenshots, traces on failure, and the HTML report.
- APK builds run separately. Quest head tracking, physical controllers, native Android sensors, folding and device frame rate still require hardware validation.

Three.js r160.1 is vendored under MIT (THREE-LICENSE.txt).

## Part II · El castell de les Marees (v3)

Continue from the Part I ending or choose **PART II · CASTELL I PIRATES** on the title screen (a narrative recap grants the key and core). The castle uses CC0 photographic PBR stone/wood maps and HDR environment lighting; it targets a realistic material treatment within a lightweight mobile/WebXR scene, rather than claiming AAA photorealism. Courtyard walls, towers, voussoir arches, battlements, barred windows, banners and fire surround a playable seal puzzle. Rotate Torre to ☀, Port to ☾ and Mar to ≈, recover the tide chart, and board the ship.

The ship has a curved hull, timber deck, guns, wheel, rigging and wind-filled sails. Challenge Captain Salmorra; choose an original witty response, then press **E / Action / Parry** while the timing signal is gold. Three successful exchanges unlock the helm and ending. Wrong answers reveal a counter; failed parries preserve earned exchanges. Keys 1–3 choose replies. On Quest, point at floating reply text and trigger, then trigger again on the gold sword cue. Soundtrack transitions remain bar-aligned; the parry animation follows the paused/resumed AudioContext clock. New score: ~135 seconds of original chamber and pirate music, plus the existing four cues.

All textures/HDR and music ship locally in the Android WebView APK; GitHub Pages and Quest Browser share the same app. The Quest APK opens the WebXR experience in Meta Quest Browser. Desktop/mobile browser QA is automated; actual Android and Quest hardware still needs hands-on validation. See assets/textures/CREDITS.md and assets/audio/CREDITS.md for sources/licensing.
