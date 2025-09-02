import React from 'react';

const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = (props) => (
  <label {...props} className={props.className || 'block text-sm font-medium text-gray-700'} />
);

export default Label;
