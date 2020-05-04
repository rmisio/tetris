import React from 'react';
import IosCloseCircleOutline from 'react-ionicons/lib/IosCloseCircleOutline';
import './Modal.scss';

function Modal(props) {
  let CloseBtn;

  if (typeof props.onClose === 'function') {
    CloseBtn = (
      <div className="Modal-closeBtnWrap">
        <button className="Modal-btnClose iconBtn">
          <IosCloseCircleOutline />
        </button>
      </div>
    );
  }

  return (
    <div className={`Modal ${props.className || ''}`}>
      {CloseBtn}
      {props.children}
    </div>
  );
}

export default Modal;