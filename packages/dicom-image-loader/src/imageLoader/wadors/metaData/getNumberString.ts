import { WadoRsMetaDataElement } from '../wado-rs-metadata';
import getValue from './getValue';

/**
 * Returns the first string value as a Javascript number
 *
 * @param element - The javascript object for the specified element in the metadata
 * @param [index] - the index of the value in a multi-valued element, default is 0
 * @param [defaultValue] - The default value to return if the element does not exist
 * @returns {*}
 */
function getNumberString(
  element: WadoRsMetaDataElement,
  index: number,
  defaultValue
) {
  const value = getValue(element, index, defaultValue);

  if (value === undefined) {
    return;
  }

  return parseFloat(value);
}

export default getNumberString;
