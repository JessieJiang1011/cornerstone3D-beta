const _colormaps = new Map();

type Colormap = {
  ColorSpace: string;
  Name: string;
  RGBPoints: number[];
};

/**
 * Register a colormap
 * @param name - name of the colormap
 * @param colormap - colormap object
 */
function registerColormap(colormap: Colormap) {
  _colormaps.set(colormap.Name, colormap);
}

/**
 * Get a colormap by name
 * @param name - name of the colormap
 * @returns colormap object
 */
function getColormap(name) {
  return _colormaps.get(name);
}

/**
 * Get all registered colormap names
 * @returns array of colormap names
 *
 */
function getColormapNames() {
  return Array.from(_colormaps.keys());
}

export { getColormap, getColormapNames, registerColormap };
