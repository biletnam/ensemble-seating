import React, { PureComponent } from 'react';

import { IconButton } from '@rmwc/icon-button';
import { ListItem, ListGroup } from '@rmwc/list';
import { Elevation } from '@rmwc/elevation';

import MemberListItem from './member-list-item.jsx';
import ColorSquare from './color-square.jsx';

import '@material/textfield/dist/mdc.textfield.min.css';
import '@material/list/dist/mdc.list.min.css';
import '@material/icon-button/dist/mdc.icon-button.min.css';
import '@material/elevation/dist/mdc.elevation.min.css';

import { Draggable, Droppable } from 'react-beautiful-dnd';

import PersonAddIcon from '../icons/baseline-person_add-24px.jsx';
import GroupAddIcon from '../icons/baseline-group_add-24px.jsx';

class SectionListItem extends PureComponent {
    constructor(props) {
        super(props);

        this.handleClickedNewPersonButton = this.handleClickedNewPersonButton.bind(this);
        this.handleClickedMemberListItem = this.handleClickedMemberListItem.bind(this);
        this.handleClickedSectionButton = this.handleClickedSectionButton.bind(this);
        this.handleClickedBatchAddMembers = this.handleClickedBatchAddMembers.bind(this);
    }

    handleClickedNewPersonButton() {
        if (this.props.onRequestNewPerson)
            this.props.onRequestNewPerson(this.props.data.id);
    }

    handleClickedMemberListItem(memberId) {
        if (this.props.onRequestSelectMember)
            this.props.onRequestSelectMember(memberId);
    }

    handleClickedSectionButton() {
        if (this.props.onRequestSelectMember)
            this.props.onRequestSelectMember(this.props.data.id);
    }

    handleClickedBatchAddMembers() {
        if (this.props.onRequestBatchAdd)
            this.props.onRequestBatchAdd(this.props.data.id);
    }

    render() {
        return <Draggable key={this.props.data.id}
            draggableId={this.props.data.id}
            index={this.props.index}
            type='section'>
                {(provided, snapshot) => (
                    <div ref={provided.innerRef}
                        className='roster__section-container'
                        {...provided.draggableProps}>
                        <Elevation z={1}>
                            <ListGroup>
                                <ListItem {...provided.dragHandleProps} key={this.props.data.id} onClick={this.handleClickedSectionButton}>
                                    <p>{this.props.data.name}</p>
                                    <ColorSquare color={this.props.data.color} />
                                </ListItem>

                                <Droppable droppableId={this.props.data.id} type='member'>
                                    {(provided, snapshot) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps}>
                                            {/* Individual performers */}
                                            {this.props.members.map((person, personIndex) => {
                                                return <MemberListItem key={person.id} 
                                                    index={personIndex} 
                                                    data={person}
                                                    onClick={this.handleClickedMemberListItem} />
                                            })}
                                            
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>

                                <div>
                                    <IconButton onClick={this.handleClickedNewPersonButton} icon={<PersonAddIcon />} label='Add person' />
                                    <IconButton onClick={this.handleClickedBatchAddMembers} icon={<GroupAddIcon />} label='Add group' />
                                </div>
                            </ListGroup>
                        </Elevation>
                    </div>
                )}
            </Draggable>
    }
}

export default SectionListItem;
