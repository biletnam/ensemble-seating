import React, { useState } from 'react';

import './plain-input.css';

const PlainInput = props => {
    const {actions = [], ...rest} = props;
    return <div className='plain-input-container'>
        <input className='plain-input' {...rest} />
        {actions}
    </div>
};

export default PlainInput;
