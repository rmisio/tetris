import { isEqual } from 'lodash';

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
   *   since it will result in your view not being in sync with its state.
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
    let newState;

    if (typeof state !== 'object') {
      throw new Error('The state must be provided as an object.');
    }

    if (opts.replace) {
      this._state = {};
    } else {
      newState = {
        ...this._state,
        ...state,
      };
    }

    if (opts.renderOnChange) {
      if (!isEqual(this._state, newState)) {
        this._state = newState;
        this.render();
      }
    } else {
      this._state = newState;
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