import React from 'react';
import './AsideBox.scss';

function AsideBox(props) {
  let ProgressBar = null;

  if (typeof props.progress === 'number') {
    ProgressBar =
      <div
        className="AsideBox-progressBar"
        style={{ width: `${props.progress}%` }}
      />;
  }

  return (
    <div className={`AsideBox ${props.className || ''}`}>
      <h1>{props.heading}</h1>
      <div className="AsideBox-content">
        {props.children}
      </div>
      {ProgressBar}
    </div>
  );
}

export default AsideBox;