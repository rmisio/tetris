import React from 'react';
import Modal from 'react-modal';
import './TextOverlay.scss';

function TextOverlay(props) {
  return (
    <Modal
      isOpen={props.isOpen}
      parentSelector={props.parentSelector}
      bodyOpenClassName='TextOverlay-body-open'
      overlayClassName='TextOverlay-overlay'
      className='TextOverlay'
    >
      <div className="TextOverlay-text">
        {props.children}
      </div>
    </Modal>
  );
}

export default TextOverlay;