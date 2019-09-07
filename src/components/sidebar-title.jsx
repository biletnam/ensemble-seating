import React from 'react';

import { Elevation } from '@rmwc/elevation';
import { IconButton } from '@rmwc/icon-button';
import '@material/elevation/dist/mdc.elevation.css';
import '@material/icon-button/dist/mdc.icon-button.css';

import './sidebar-title.css';

import DeleteIcon from '../icons/baseline-delete-24px.jsx';

import BackIcon from '../icons/baseline-back-24px.jsx';

const SidebarTitle = props => {
    return <Elevation z='1' tag='h2' className='sidebar-title'>
        {props.onClickedBack && <IconButton className='sidebar-title__back-button' icon={<BackIcon />} label='Back' onClick={props.onClickedBack} />}
        {props.children}
        {props.onClickedDelete && <IconButton className='sidebar-title__delete-button'
                icon={<DeleteIcon />} label='Delete' 
                onClick={props.onClickedDelete} />}
    </Elevation>
}

export default SidebarTitle;
