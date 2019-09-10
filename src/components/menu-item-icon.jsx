import React from 'react';
import './menu-item-icon.css';

const MenuItemIcon = props => {
    const {icon, ...rest} = props;
    return React.cloneElement(icon, Object.assign({}, rest, { className: 'menu-item-icon' }))
}

export default MenuItemIcon;
