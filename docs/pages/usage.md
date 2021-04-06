# Usage

This page attempts to outline basic usage guidance. A more detailed, real-world
example exists in the `./examples/` directory of this repository. All guidance
here builds on the steps outlined on the "Setup" page.

- Usage
  - @Rendering
  - @Tools
    - Adding Tools
    - Tool Manager
    - Tool Modes
    - Sync Groups
  - Next steps

## @Rendering

The rendering library organizes viewports by:

- `renderingEngine --> scene --> viewport`

- Where each `RenderingEngine` has one or more `Scene`s, and each `Scene` has one
  or more `Viewport`s.
- Each `Scene` has a `setVolume` method that allows us to link a volume and callback
  function.
- Each `Viewport` has a camera that can be acted upon to provide a different rendering
  of its `Scene`'s volume.

_index.html_

```html
<canvas class="target-canvas"></canvas>
```

_app.js_

```js
import {
  RenderingEngine, // class
  ORIENTATION, // constant
  VIEWPORT_TYPE, // enum
} from 'vtkjs-viewport'

// RENDER
const renderingEngine = new RenderingEngine('ExampleRenderingEngineID')
const volumeUID = 'VOLUME_UID'
const sceneUID = 'SCENE_UID'
const viewports = []
const viewport = {
  sceneUID,
  viewportUID: 'viewportUID_0',
  type: VIEWPORT_TYPE.ORTHOGRAPHIC,
  canvas: document.querySelector('.target-canvas'),
  defaultOptions: {
    orientation: ORIENTATION.AXIAL,
    background: [Math.random(), Math.random(), Math.random()],
  },
}

// Kick-off rendering
viewports.push(viewport)
renderingEngine.setViewports(viewports)

// Render backgrounds
renderingEngine.render()

// Create and load our image volume
// See: `./examples/helpers/getImageIdsAndCacheMetadata.js` for inspiration
const imageIds = [
  'csiv:https://wadoRsRoot.com/studies/studyInstanceUID/series/SeriesInstanceUID/instances/SOPInstanceUID/frames/1',
  'csiv:https://wadoRsRoot.com/studies/studyInstanceUID/series/SeriesInstanceUID/instances/SOPInstanceUID/frames/2',
  'csiv:https://wadoRsRoot.com/studies/studyInstanceUID/series/SeriesInstanceUID/instances/SOPInstanceUID/frames/3',
]

imageCache.makeAndCacheImageVolume(imageIds, volumeUID)
imageCache.loadVolume(volumeUID, (event) => {
  if (event.framesProcessed === event.numFrames) {
    console.log('done loading!')
  }
})

// Tie scene to one or more image volumes
const scene = renderingEngine.getScene(sceneUID)

scene.setVolumes([
  {
    volumeUID,
    callback: ({ volumeActor, volumeUID }) => {
      // Where you might setup a transfer function or PET colormap
      console.log('volume loaded!')
    },
  },
])

const viewport = scene.getViewport(viewports[0].viewportUID)

// This will initialise volumes in GPU memory
renderingEngine.render()
```

For the most part, updating is as simple as using:

- `RenderingEngine.setViewports` and
- `Scene.setVolumes`

If you're using clientside routing and/or need to clean up resources more
aggressively, most constructs have a `.destroy` method. For example:

```js
renderingEngine.destroy()
```

## @Tools

A tool is an uninstantiated class that implements at least the `BaseTool` interface.
Tools can be configured via their constructor. To use a tool, one must:

- Add the uninstantiated tool using the library's top level `addTool` function
- Add that same tool, by name, to a ToolGroup

The tool's behavior is then dependent on which rendering engines, scenes,
and viewports are associated with its Tool Group; as well as the tool's current
mode.

### Adding Tools

The @Tools library comes packaged with several common tools. All implement either
the `BaseTool` or `BaseAnnotationTool`. Adding a tool makes it available to ToolGroups.
A high level `.removeTool` also exists.

```js
import * as csTools3d from 'vtkjs-viewport-tools'

// Add uninstantiated tool classes to the library
// These will be used to initialize tool instances when we explicitly add each
// tool to one or more tool groups
const { PanTool, StackScrollMouseWheelTool, ZoomTool, LengthTool } = csTools3d

csTools3d.addTool(PanTool, {})
csTools3d.addTool(StackScrollMouseWheelTool, {})
csTools3d.addTool(ZoomTool, {})
csTools3d.addTool(LengthTool, {})
```

### Tool Group Manager

Tool Groups are a way to share tool configuration, state, and modes across
a set of `RengeringEngine`s, `Scene`s, and/or `Viewport`s. Tool Groups are managed
by a Tool Group Manager. Tool Group Managers are used to create, search for, and
destroy Tool Groups.

```js
import { ToolGroupManager } from 'vtkjs-viewport-tools'
import { ctVolumeUID } from './constants'

const toolGroupUID = 'TOOL_GROUP_UID'
const sceneToolGroup = ToolGroupManager.createToolGroup(TOOL_GROUP_UID)

// Add tools to ToolGroup
sceneToolGroup.addTool('Pan', {})
sceneToolGroup.addTool('Zoom', {})
sceneToolGroup.addTool('StackScrollMouseWheel', {})
sceneToolGroup.addTool('Length', {
  configuration: { volumeUID: ctVolumeUID },
})
```

### Tool Modes

Tools can be in one of four modes. Each mode impacts how the tool responds to
interactions. Those modes are:

<table>
  <tr>
    <td>Tool Mode</td>
    <td>Description</td>
  </tr>
  <!-- ACTIVE -->
  <tr>
    <td>Active</td>
    <td>
      <ul>
        <li>Tools with active bindings will respond to interactions</li>
        <li>If the tool is an annotation tool, click events not over existing annotations
  will create a new annotation.</li>
      </ul>
    </td>
  </tr>
  <!-- PASIVE -->
  <tr>
    <td>Passive (default)</td>
    <td>
      <ul>
        <li>If the tool is an annotation tool, if it's handle or line is selected, it
    can be moved and repositioned.</li>
      </ul>
    </td>
  </tr>
  <!-- ENABLED -->
  <tr>
    <td>Enabled</td>
    <td>
      <ul>
        <li>The tool will render, but cannot be interacted with.</li>
      </ul>
    </td>
  </tr>
  <!-- DISABLED -->
  <tr>
    <td>Disabled</td>
    <td>
      <ul>
        <li>The tool will not render. No interaction is possible.</li>
      </ul>
    </td>
  </tr>
</table>

_NOTE:_

- There should never be two active tools with the same binding

```js
// Set the ToolGroup's ToolMode for each tool
// Possible modes include: 'Active', 'Passive', 'Enabled', 'Disabled'
sceneToolGroup.setToolActive('StackScrollMouseWheel')
sceneToolGroup.setToolActive('Length', {
  bindings: [ToolBindings.Mouse.Primary],
})
sceneToolGroup.setToolActive('Pan', {
  bindings: [ToolBindings.Mouse.Auxiliary],
})
sceneToolGroup.setToolActive('Zoom', {
  bindings: [ToolBindings.Mouse.Secondary],
})
```

### Synchronizers

The SynchronizerManager exposes similar API to that of the ToolGroupManager. A
created Synchronizer has methods like `addTarget`, `addSource`, `add` (which adds
the viewport as a "source" and a "target"), and equivelant `remove*` methods.

A synchronizer works by listening for a specified event to be raised on any `source`.
If detected, the callback function is called once for each `target`. The idea being
that changes to a `source` should be synchronized across `target`s.

Synchronizers will self-remove sources/targets if the viewport becomes disabled.
Synchronizers also expose a `disabled` flag that can be used to temporarily prevent
synchronization.

```js
import { EVENTS as RENDERING_EVENTS } from 'vtkjs-viewport'
import { SynchronizerManager } from 'vtkjs-viewport-tools'

const cameraPositionSyncrhonizer = SynchronizerManager.createSynchronizer(
  synchronizerName,
  RENDERING_EVENTS.CAMERA_MODIFIED,
  (
    synchronizerInstance,
    sourceViewport,
    targetViewport,
    cameraModifiedEvent
  ) => {
    // Synchronization logic should go here
  }
)

// Add viewports to synchronize
const firstViewport = { renderingEngineUID, sceneUID, viewportUID }
const secondViewport = {
  /* */
}

sync.add(firstViewport)
sync.add(secondViewport)
```

## Next steps

For next steps, you can:

- [Check out the Usage documentation](#)
- [Explore our example application's source code](#)