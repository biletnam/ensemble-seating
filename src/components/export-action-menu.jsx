import React from 'react';

import { Menu, MenuItem, MenuSurfaceAnchor } from '@rmwc/menu';
import { ListDivider } from '@rmwc/list';
import '@material/menu/dist/mdc.menu.css';
import '@material/menu-surface/dist/mdc.menu-surface.css';
import '@material/list/dist/mdc.list.css';

function ExportActionMenu (props) {
    function handleClick (event) {
        if (typeof props.onSelectAction === 'function')
        props.onSelectAction(event.target.dataset.actionType);
    }

    const { onSelectAction, ...rest } = props;
    return <MenuSurfaceAnchor>
        <Menu {...rest}>
            <MenuItem onClick={handleClick} className='list-action-menu__item' data-action-type='project'>Project file</MenuItem>
            <ListDivider />
            <MenuItem onClick={handleClick} className='list-action-menu__item' data-action-type='image'>Image&hellip;</MenuItem>
        </Menu>
        {props.children}
    </MenuSurfaceAnchor> 
}

export default ExportActionMenu;
