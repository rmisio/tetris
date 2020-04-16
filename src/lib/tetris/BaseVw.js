// todo: test the shallowobj compare functionality

import { shallowEqualObjects } from 'util/object';

class BaseVw {
  constructor(options = {}) {
    this._state = {};
    this.setState((options.initialState || {}), { renderOnChange: false });
  }

  /**
   * Returns this view's state object.
   */
  getState() {
    return this._state;
  }

  /**
   * Sets this view's state object.
   * @param {object} state - The new state data. By default, this is merged into
   *   the existing state. To replace the state use the replace option.
   * @param {object} options
   * @param {boolean} [options.renderOnChange = true] - If true, will re-render the view
   *   if the resulting state changes. Setting this to false should be done very judiciously
   *   since it will result in your view not being in sync with its state. Please note that
   *   the comparison of the object is done as a shallow compare, so treat the children as
   *   immutable.
   * @param {boolean} [options.replace = false] - If true, will replace the entire state
   *   with the given state. Otherwise, the given state will be merged in.
   * @return {object} This instance.
   */
  setState(state = {}, options = {}) {
    const opts = {
      renderOnChange: true,
      replace: false,
      ...options,
    };
    const oldState = this._state;
    let newState;

    if (typeof state !== 'object') {
      throw new Error('The state must be provided as an object.');
    }

    if (opts.replace) {
      this._state = {};
    } else {
      newState = {
        ...oldState,
        ...state,
      };
    }

    this._state = newState;

    if (opts.renderOnChange) {
      if (!shallowEqualObjects(oldState, newState)) {
        this.render();
      }
    }

    return this;
  }

  destroy() {
    return this;
  }

  render() {
    return this;
  }
}

export default BaseVw;