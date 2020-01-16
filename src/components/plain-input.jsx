import React, { useState } from 'react';

import './plain-input.css';

const PlainInput = props => {
    const {actions = [], ...rest} = props;
    return <div className='plain-input-container'>
        <input className='plain-input' {...rest} />
        {actions.map((el, index) => React.cloneElement(el, { key: `input-action-${index}` }))}
    </div>
};

export default PlainInput;
