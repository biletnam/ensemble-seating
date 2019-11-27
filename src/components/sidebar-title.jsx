import React from 'react';

import { Elevation } from '@rmwc/elevation';
import '@material/elevation/dist/mdc.elevation.css';

import DeleteIcon from '../icons/delete-24px.svg';
import BackIcon from '../icons/arrow_back-24px.svg';

import SidebarTitlebarButton from './sidebar-titlebar-button.jsx';

import './sidebar-title.css';

const SidebarTitle = props => {
    return <Elevation z='1' tag='h2' className='sidebar-title'>
        {props.onClickedBack && <SidebarTitlebarButton className='sidebar-title__back-button' icon={<BackIcon />} label='Back' onClick={props.onClickedBack} />}
        {props.children}
        {props.onClickedDelete && <SidebarTitlebarButton className='sidebar-title__delete-button'
                icon={<DeleteIcon />} label='Delete' 
                onClick={props.onClickedDelete} />}
    </Elevation>
}

export default SidebarTitle;
