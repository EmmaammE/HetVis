import React, { ReactChild } from 'react';
import styles from './button.module.css';

interface ButtonProps {
  children: ReactChild;
  handleClick?: any;
  style?: Object;
}

Button.defaultProps = {
  handleClick: null,
  style: {},
};

function Button({ children, handleClick, style }: ButtonProps) {
  return (
    <button type="button" className={styles.button} onClick={handleClick} style={style}>
      {children}
    </button>
  );
}

export default Button;
