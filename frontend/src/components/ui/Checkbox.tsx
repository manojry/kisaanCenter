import React from 'react';

const Checkbox: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input type="checkbox" {...props} className={props.className || 'form-checkbox h-4 w-4 text-blue-600'} />
);

export default Checkbox;
