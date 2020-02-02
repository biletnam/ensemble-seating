import React from 'react';

import './plain-input.css';

const PlainInput = React.forwardRef((props, ref) => (
    <input className='plain-input' {...props} ref={ref} />
));

export default PlainInput;
