import React from 'react';

import './plain-input-action.css'

const PlainInputAction = props => {
    const {label, icon, ...rest} = props;
    return <button title={label} aria-label={label} className='plain-input-action' {...rest}>{icon}</button>
}

export default PlainInputAction;
