import React, { PureComponent } from 'react';

import { List, ListItem, ListItemPrimaryText, ListItemMeta } from '@rmwc/list';
import '@material/list/dist/mdc.list.min.css';

import { Draggable } from 'react-beautiful-dnd';

class MemberListItem extends PureComponent {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        if (this.props.onClick)
            this.props.onClick(this.props.memberId);
    }

    render() {
        return <Draggable key={this.props.memberId}
            draggableId={this.props.memberId}
            index={this.props.index}
            type='member'>
                {(provided, snapshot) => (
                    <div ref={provided.innerRef}
                        {...provided.draggableProps}>
                            <ListItem {...provided.dragHandleProps} className='sections-list__section-member' onClick={this.handleClick}>
                                {this.props.data.name}
                            </ListItem>
                        </div>
                )}
            </Draggable>
    }
}

export default MemberListItem;
