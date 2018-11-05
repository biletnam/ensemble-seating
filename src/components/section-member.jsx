import React, {Component} from 'react';

import { IconButton } from '@rmwc/icon-button';
import { List, ListItem, ListItemPrimaryText, ListItemMeta } from '@rmwc/list';

import '@material/icon-button/dist/mdc.icon-button.css';
import '@material/list/dist/mdc.list.css';

import { Draggable } from 'react-beautiful-dnd';

import DeleteIcon from '../icons/baseline-delete-24px.jsx';
import EditIcon from '../icons/baseline-edit-24px.jsx';

class SectionMember extends Component {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
        this.handleClickedEditMember = this.handleClickedEditMember.bind(this);
        this.handleClickedDeleteMember = this.handleClickedDeleteMember.bind(this);
    }

    handleClick() {
        if (this.props.onClick)
            this.props.onClick(this.props.data.id);
    }

    handleClickedEditMember() {
        if (typeof this.props.onRequestEditMember === 'function')
            this.props.onRequestEditMember(this.props.data.id);
    }

    handleClickedDeleteMember() {
        if (typeof this.props.onRequestDeleteMember === 'function')
            this.props.onRequestDeleteMember(this.props.data.id);
    }

    render() {
        return <Draggable key={this.props.data.id}
            draggableId={this.props.data.id}
            index={this.props.index}
            type='member'>
                {(provided, snapshot) => (
                    <div ref={provided.innerRef}
                        {...provided.draggableProps}>
                            <ListItem {...provided.dragHandleProps} className='sections-list__section-member' onClick={this.handleClick} selected={this.props.selected}>
                                {this.props.data.name}
                                {this.props.selected && <React.Fragment>
                                    <IconButton style={{marginLeft: 'auto'}} 
                                        icon={<DeleteIcon />} label='Delete section member' 
                                        onClick={this.handleClickedDeleteMember} />
                                    <IconButton
                                        icon={<EditIcon />} label='Edit section member' 
                                        onClick={this.handleClickedEditMember} />
                                </React.Fragment> }
                            </ListItem>
                        </div>
                )}
            </Draggable>
    }
}

export default SectionMember;
