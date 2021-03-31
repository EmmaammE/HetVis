import React, { MouseEventHandler, useCallback } from 'react';
import './ConfirmDialog.scss';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  confirmLabel: string;
  children: any;
  onConfirm: MouseEventHandler<HTMLButtonElement>;
  onCancel: MouseEventHandler<HTMLButtonElement>;
}

const ConfirmDialog = ({
  open,
  title,
  confirmLabel,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const confirmHandler = useCallback(
    (event) => {
      onConfirm(event);
      onCancel(event);
    },
    [onCancel, onConfirm]
  );

  return (
    <div className="loader confirm-dialog">
      <div className="dialog">
        <h3>{title}</h3>
        <p>{children}</p>
        <div className="btn-area">
          <button type="button" className="c-btn" onClick={onCancel}>
            CANCEL
          </button>
          <button type="button" className="c-btn" onClick={confirmHandler}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
