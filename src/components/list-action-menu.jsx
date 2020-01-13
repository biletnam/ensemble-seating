import React, { PureComponent } from 'react';

import './list-action-menu.css';

import { Menu, MenuItem, MenuSurfaceAnchor } from '@rmwc/menu';
import { ListDivider } from '@rmwc/list';
import '@material/menu/dist/mdc.menu.min.css';
import '@material/menu-surface/dist/mdc.menu-surface.min.css';
import '@material/list/dist/mdc.list.min.css';

import TuneIcon from '../icons/tune-24px.svg';
import ShuffleIcon from '../icons/shuffle-24px.svg';
import TopIcon from '../icons/vertical_align_top-24px.svg';
import UpIcon from '../icons/arrow_upward-24px.svg';
import DownIcon from '../icons/arrow_downward-24px.svg';
import BottomIcon from '../icons/vertical_align_bottom-24px.svg';
import DeleteIcon from '../icons/delete-24px.svg';
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
        const { onSelectAction, moveToTop, moveUp, moveDown, moveToBottom, settings, shuffle, deleteItem, ...props } = this.props;
        
        const hasMovement = !(
            typeof moveToTop === 'undefined'
            && typeof moveUp === 'undefined'
            && typeof moveDown === 'undefined'
            && typeof moveToBottom === 'undefined'
        );
        const hasMetaActions = typeof settings !== 'undefined' || typeof deleteItem !== 'undefined';
        
        return <MenuSurfaceAnchor>
            <Menu {...props} hoistToBody>
                {typeof shuffle != 'undefined' &&
                    <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='shuffle' disabled={shuffle === null}>
                        <MenuItemIcon icon={<ShuffleIcon />} />
                        Shuffle{typeof shuffle === 'string' && ` ${shuffle}`}
                    </MenuItem>
                }

                {typeof shuffle !== 'undefined' && (hasMovement || hasMetaActions) && (
                    <ListDivider />
                )}

                {typeof moveToTop !== 'undefined' &&
                    <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='move-to-top' disabled={moveToTop === null}>
                        <MenuItemIcon icon={<TopIcon />} />
                        Move to top
                    </MenuItem>
                }
                {typeof moveUp !== 'undefined' &&
                    <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='move-up' disabled={moveUp === null}>
                        <MenuItemIcon icon={<UpIcon />} />
                        Move up
                    </MenuItem>
                }
                {typeof moveDown !== 'undefined' &&
                    <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='move-down' disabled={moveDown === null}>
                        <MenuItemIcon icon={<DownIcon />} />
                        Move down
                    </MenuItem>
                }
                {typeof moveToBottom !== 'undefined' &&
                    <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='move-to-bottom' disabled={moveToBottom === null}>
                        <MenuItemIcon icon={<BottomIcon />} />
                        Move to bottom
                    </MenuItem>
                }
                
                {hasMovement && hasMetaActions && (
                    <ListDivider />
                )}

                {typeof deleteItem !== 'undefined' &&
                    <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='delete' disabled={deleteItem === null}>
                        <MenuItemIcon icon={<DeleteIcon />} />
                        Delete&hellip;
                    </MenuItem>
                }

                {typeof settings !== 'undefined' &&
                    <MenuItem onClick={this.handleClick} className='list-action-menu__item' data-action-type='settings' disabled={settings === null}>
                    <MenuItemIcon icon={<TuneIcon />} />
                        Settings&hellip;
                    </MenuItem>
                }
            </Menu>
            {this.props.children}
        </MenuSurfaceAnchor>
    }
}

export default ListActionMenu;
