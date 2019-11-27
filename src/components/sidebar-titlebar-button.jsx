import React from 'react';
import { IconButton } from '@rmwc/icon-button';

import '@material/icon-button/dist/mdc.icon-button.min.css';

import './sidebar-titlebar-button.css';

const SidebarTitlebarButton = props => {
    const {className, ...rest} = props;
    return <IconButton className={`sidebar-titlebar-button ${className ? className : ''}`} {...rest} />
}

export default SidebarTitlebarButton;
