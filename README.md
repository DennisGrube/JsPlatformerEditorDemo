A platforming game and accompanying level editor written in JavaScript.
Work in Progress.

Current Editor features:
  - Resize tileset and tilemap UI area via separator
  - Multiple tile layers
  - Tile layer select via UI and keyboard number row
  - Scrolling and zooming via custom camera
  - Tileset selection
  - Autofill missing tiles during fast mouse movement
  - Multi tile select (rectangular)
  - Shift tiles to paint on mouse move while clicking + dragging to always paint the full stamp instead of overwriting parts of it
  - Darken layers that are behind the selected layer
  - Draw layers translucently that are in front of the selected layer

Current Game features:
  - Sprite sheet animations
  - Multiple entity states with their associated sprite animations
  - Acceleration and deceleration
  - Jump curve with jump apex (different gravity properties during highest point of the jump arc for improved player controls)
  - Reduce jump speed upon letting go of Spacebar
  - Rudimentary entity inspector
  - Show entity bounds and highlight on mouse hover
  - Toggle gravity
  - Set selected entity position
  - Display entity state
  - Automatic canvas scaling based on browser window properties (integer only)
  - Manual canvas scaling based on user preferences (integer only)

Current Common features:
  - Refresh rate limited game loop with fixed update tick rate (Game updates at 60Hz but renders interpolated frames depending on user's monitor's refresh rate)
  - Rudimentary Content Manager that ensures to only return a texture when it has fully loaded
  - Rectangle shape and basic related math (intersects, contains(Rectangle || Vector2), union etc)
  - Vector2 and basic and basic related math (lerp)
  - MathHelper (clamp and lerp)
  - Camera2D with zoom, toWorld, toScreen, bounds, lookAt related functions
