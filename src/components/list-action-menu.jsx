import React, { PureComponent } from 'react';

import './list-action-menu.css';

import { Menu, MenuItem, MenuSurfaceAnchor } from '@rmwc/menu';
import { ListDivider } from '@rmwc/list';
import '@material/menu/dist/mdc.menu.min.css';
import '@material/menu-surface/dist/mdc.menu-surface.min.css';
import '@material/list/dist/mdc.list.min.css';

import ShuffleIcon from '../icons/shuffle-24px.svg';
import TopIcon from '../icons/vertical_align_top-24px.svg';
import UpIcon from '../icons/arrow_upward-24px.svg';
import DownIcon from '../icons/arrow_downward-24px.svg';
import BottomIcon from '../icons/vertical_align_bottom-24px.svg';
import MenuItemIcon from './menu-item-icon.jsx';


class ListActionMenu extends PureComponent {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(event) {
        event.stopPropagation();
        if (typeof this.props.onSelectAction === 'function')
            this.props.onSelectAction(event.target.dataset.actionType);
    }

    render() {
        const { onSelectAction, moveToTop, moveUp, moveDown, moveToBottom, shuffle, deleteItem, ...props } = this.props;
        return <MenuSurfaceAnchor>
            <Menu {...props} hoistToBody>
                {shuffle && <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='shuffle'>
                    <MenuItemIcon icon={<ShuffleIcon />} />
                    Shuffle{typeof shuffle === 'string' && ` ${shuffle}`}
                </MenuItem>}

                {shuffle && (moveToTop || moveUp || moveDown || moveToBottom || deleteItem) && (
                    <ListDivider />
                )}

                {moveToTop && <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='move-to-top'>
                    <MenuItemIcon icon={<TopIcon />} />
                    Move to top
                </MenuItem>}
                {moveUp && <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='move-up'>
                    <MenuItemIcon icon={<UpIcon />} />
                    Move up
                </MenuItem>}
                {moveDown && <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='move-down'>
                    <MenuItemIcon icon={<DownIcon />} />
                    Move down
                </MenuItem>}
                {moveToBottom && <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='move-to-bottom'>
                    <MenuItemIcon icon={<BottomIcon />} />
                    Move to bottom
                </MenuItem>}
                
                {deleteItem && (moveToTop || moveUp || moveDown || moveToBottom) && (
                    <ListDivider />
                )}

                {deleteItem && <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='delete'>
                    Delete
                </MenuItem>}
            </Menu>
            {this.props.children}
        </MenuSurfaceAnchor>
    }
}

export default ListActionMenu;
