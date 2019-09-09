import React from 'react';
import './toolbar-link.css';

const ToolbarLink = props => {
    const {children, icon, ...rest} = props;
    return <a {...rest} target='_blank' rel='noopener' className='toolbar-link'>
        {icon && React.cloneElement(icon, {className: 'toolbar-link__icon'} )}
        {props.children}
    </a>
}

export default ToolbarLink;
