import React from 'react';
import { Fab } from '@rmwc/fab';
import '@material/fab/dist/mdc.fab.css';
import MenuOpenIcon from '../icons/menu_open-24px.svg';
import './sidebar-toggle-button.css';

const SidebarToggleButton = props => {
    const { offset, ...rest } = props;
    return <Fab {...rest} className={`sidebar-toggle-button${offset ? ' sidebar-toggle-button--offset' : ''}`}
        mini icon={<MenuOpenIcon />} title={offset ? 'Hide roster' : 'Show roster'} />;
}

export default SidebarToggleButton;
