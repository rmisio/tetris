import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import IosClose from 'react-ionicons/lib/IosClose';
import './MyModal.scss';

function MyModal(props) {
  const [isOpen, setOpen] = useState(props.isOpen);

  useEffect(() => {
    setOpen(props.isOpen);
  }, [props.isOpen]);

  const modalProps = {
    shouldCloseOnEsc: true,
    ...props,
    isOpen,
    onRequestClose: () => setOpen(false),
    overlayClassName: 'MyModal-overlay',
    className: 'MyModal-wrap',
  };

  return (
    <Modal {...modalProps}>
      <div className="MyModal">
        <button
          className="MyModal-btnClose"
          onClick={() => setOpen(false)}
        >
          <IosClose />
        </button>
        <div className="MyModal-modalContent">{props.children}</div>
      </div>
    </Modal>
  );
}

export default MyModal;