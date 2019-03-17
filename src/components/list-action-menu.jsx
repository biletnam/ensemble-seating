import React, { PureComponent } from 'react';

import './list-action-menu.css';

import { Menu, MenuItem, MenuSurfaceAnchor } from '@rmwc/menu';
import '@material/menu/dist/mdc.menu.css';
import '@material/menu-surface/dist/mdc.menu-surface.css';
import '@material/list/dist/mdc.list.css';


class ListActionMenu extends PureComponent {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(event) {
        if (typeof this.props.onSelectAction === 'function')
            this.props.onSelectAction(event.target.dataset.actionType);
    }

    render() {
        const { onSelectAction, showEditAndDeleteControls, ...props } = this.props;
        return <MenuSurfaceAnchor>
            <Menu {...props}>
                <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='edit'>Edit&hellip;</MenuItem>
                {showEditAndDeleteControls && <>
                    <hr className='list-action-menu__divider' />
                    <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='move-to-top'>Move to top</MenuItem>
                    <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='move-up'>Move up</MenuItem>
                    <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='move-down'>Move down</MenuItem>
                    <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='move-to-bottom'>Move to bottom</MenuItem>
                    <hr className='list-action-menu__divider' />
                    <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='delete'>Delete</MenuItem>
                </>}
            </Menu>
            {this.props.children}
        </MenuSurfaceAnchor>
    }
}

export default ListActionMenu;
