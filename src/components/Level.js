import React from 'react';
import AsideBox from './AsideBox';
import './Level.scss';

function Level(props) {
  return (
    <AsideBox
      className="Level"
      progress={props.percentToNextLevel * 100}
      { ...props}
    >
      <div className="Level-count"><div>{props.level}</div></div>
    </AsideBox>
  );
}

export default Level;