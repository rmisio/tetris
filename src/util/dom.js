import isElement from 'lodash';

export function empty(node) {
  if (!isElement(node)) {
    throw new Error('Please provide a valid dom node.');
  }

  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}