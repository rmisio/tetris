class Block {
  constructor(width, height, color = 'yellow') {
    if (typeof width !== 'number' || Number.isNaN(width)) {
      throw new Error('width must be provided as a non NaN number.');
    }
    
    if (typeof height !== 'number' || Number.isNaN(height)) {
      throw new Error('height must be provided as a non NaN number.');
    }

    if (typeof color !== 'string' || !color.length) {
      throw new Error('color must be provided as a non-empty string.');
    }

    const canvas = this._el = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.backgroundColor = color;
  }

  get el() {
    return this._el;
  }

  get width() {
    return this._el.width;
  }

  get height() {
    return this._el.height;
  }  
}

export default Block;