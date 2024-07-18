A platforming game and accompanying level editor written in JavaScript, using only the canvas API and no third party libraries.
Work in Progress.

LIVE DEMO:

https://dennisgr.itch.io/jsplatformereditordemo

Loading assets may take a while. Password: habanero

Editor Controls:
 - WASD, Middle Mouse button, Scroll Wheel (vertical, horizontal, click), Space + Left Click: Move camera
 - Shift + Mouse Wheel, Number keys: Select layer
 - Ctrl + Mouse Wheel or UI +/-: Zoom in/out (use Ctrl + +/- for default browser zoom controls)

Game Controls:
  - Cursor keys: Move
  - Space bar: Jump

Current Editor features:
  - Resize tileset and tilemap UI area via separator
  - Multiple tile layers
  - Add and remove layers
  - Shift layers up or down within the array
  - Tile layer select via UI and keyboard number row
  - Scrolling and zooming via custom camera
  - Tileset selection
  - Draw missing tiles during fast mouse movement
  - Multi tile select (rectangular)
  - Moving the mouse while painting and having multiple tiles selected always paints the full stamp, instead of overwriting from the top left at every repaint
  - Darken layers that are behind the selected layer
  - Draw layers translucently that are in front of the selected layer
  - Map resizing
  - Automatic canvas scaling based on browser window properties

Current Game features:
  - Sprite sheet animations
  - Multiple entity states with their associated sprite animations
  - Acceleration and deceleration
  - Jump curve with jump apex (different gravity properties during highest point of the jump arc for improved player controls)
  - Reduce jump speed upon letting go of Spacebar
  - Rudimentary entity inspector
  - Show entity bounds and highlight on mouse hover
  - Toggle gravity
  - Set selected entity's position
  - Display entity state
  - Automatic canvas scaling based on browser window properties (integer only)
  - Manual canvas scaling based on user preferences (integer only)

Current Common features:
  - VSynced game loop with fixed update tick rate (Game updates at a fixed 60Hz but renders interpolated frames depending on user's monitor's refresh rate)
  - Rudimentary Content Manager that ensures to only return a texture when it has fully loaded
  - Rectangle shape and basic related math (intersects, contains(Rectangle || Vector2), union etc)
  - Vector2 and basic and basic related math (lerp)
  - MathHelper (clamp and lerp)
  - Camera2D with zoom, toWorld, toScreen, bounds, lookAt functions

Important missing features:
  - Tilemap import/export
  - Loading of local tilesets
  - Resizing of tilemap
  - Flood fill
  - Right click to absorb tiles from map
  - An *actual* game
