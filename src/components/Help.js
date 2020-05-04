import React from 'react';
import MdArrowDropleftCircle from 'react-ionicons/lib/MdArrowDropleftCircle';
import MdArrowDroprightCircle from 'react-ionicons/lib/MdArrowDroprightCircle';
import MdArrowDropdownCircle from 'react-ionicons/lib/MdArrowDropdownCircle';
import MdArrowDropupCircle from 'react-ionicons/lib/MdArrowDropupCircle';
import Modal from 
import './Help.scss';

function Help(props) {
  const startBtn = (
    <button onclick={props.onClick}>
      {props.activeGame ? 'Resume Game' : 'Start Game'}
    </button>
  );

  let Instructions = (
    <React.Fragment>
      <p>Hi <span role="img" aria-label="waving hand">👋</span></p>
      <p>Using your keyboard:</p>
      <dl>
        <dt><MdArrowDropleftCircle fontSize="1.1rem" /></dt>
        <dd>Move piece left</dd>

        <dt><MdArrowDroprightCircle fontSize="1.1rem" /></dt>
        <dd>Move piece right</dd>

        <dt><MdArrowDropdownCircle fontSize="1.1rem" /></dt>
        <dd>Move piece down</dd>

        <dt><MdArrowDropupCircle fontSize="1.1rem" /></dt>
        <dd>Rotate piece</dd>
      </dl>
    </React.Fragment>  
  );

  if (props.touchDevice) {
    Instructions = (
      <React.Fragment>
        <p>Hi <span role="img" aria-label="waving hand">👋</span></p>
        <dl>
          <dt>Drag <MdArrowDropleftCircle fontSize="1.1rem" /></dt>
          <dd>Move piece left</dd>

          <dt>Drag <MdArrowDroprightCircle fontSize="1.1rem" /></dt>
          <dd>Move piece right</dd>

          <dt>Drag <MdArrowDropdownCircle fontSize="1.1rem" /></dt>
          <dd>Move piece down</dd>

          <dt>Tap</dt>
          <dd>Rotate piece</dd>
        </dl>
      </React.Fragment>  
    );
  }

  return (
    <div className="Help">
      {Instructions}
      <div>{startBtn}</div>
    </div>
  );
}

export default Help;