import React from 'react';
import MenuOpenIcon from '../icons/chevron_right-24px.svg';
import './sidebar-toggle-button.css';

const SidebarToggleButton = props => {
    const { isOpen, ...rest } = props;
    const title = isOpen ? 'Hide roster' : 'Show roster';
    return <button {...rest} className={`sidebar-toggle-button${isOpen ? '' : ' sidebar-toggle-button--closed'}`}
        title={title} aria-label={title}>
            <MenuOpenIcon />
        </button>;
}

export default SidebarToggleButton;
