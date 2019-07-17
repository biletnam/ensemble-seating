import React, { PureComponent } from 'react';

import { IconButton } from '@rmwc/icon-button';
import { ListItem, ListGroup } from '@rmwc/list';
import { Elevation } from '@rmwc/elevation';

import SectionMember from './section-member.jsx';
import ColorSquare from './color-square.jsx';

import '@material/textfield/dist/mdc.textfield.min.css';
import '@material/list/dist/mdc.list.min.css';
import '@material/icon-button/dist/mdc.icon-button.min.css';
import '@material/elevation/dist/mdc.elevation.min.css';

import { Draggable, Droppable } from 'react-beautiful-dnd';

import PersonAddIcon from '../icons/baseline-person_add-24px.jsx';
import GroupAddIcon from '../icons/baseline-group_add-24px.jsx';
import DeleteIcon from '../icons/baseline-delete-24px.jsx';
import EditIcon from '../icons/baseline-edit-24px.jsx';

const editStyle = {marginLeft: 'auto'};

class SectionListItem extends PureComponent {
    constructor(props) {
        super(props);

        this.handleClickedNewPersonButton = this.handleClickedNewPersonButton.bind(this);
        this.handleClickedSectionMember = this.handleClickedSectionMember.bind(this);
        this.handleClickedSectionButton = this.handleClickedSectionButton.bind(this);
        this.handleClickedBatchAddMembers = this.handleClickedBatchAddMembers.bind(this);
        this.handleClickedEditSection = this.handleClickedEditSection.bind(this);
        this.handleClickedDeleteSection = this.handleClickedDeleteSection.bind(this);
    }

    handleClickedNewPersonButton() {
        if (this.props.onRequestNewPerson)
            this.props.onRequestNewPerson(this.props.data.id);
    }

    handleClickedSectionMember(memberId) {
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

    handleClickedEditSection() {
        this.props.onRequestEditSection(this.props.data.id);
    }

    handleClickedDeleteSection() {
        this.props.onRequestDeleteSection(this.props.data.id);
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
                                <ListItem {...provided.dragHandleProps} key={this.props.data.id} onClick={this.handleClickedSectionButton} selected={this.props.data.id === this.props.editorId}>
                                    <p>{this.props.data.name}</p>
                                    <ColorSquare color={this.props.data.color} />
                                    {this.props.data.id === this.props.editorId && <React.Fragment>
                                        <IconButton onClick={this.handleClickedDeleteSection} icon={<DeleteIcon />} label='Delete section' style={editStyle} />
                                        <IconButton onClick={this.handleClickedEditSection} icon={<EditIcon />} label='Edit section' />
                                    </React.Fragment>}
                                </ListItem>

                                <Droppable droppableId={this.props.data.id} type='member'>
                                    {(provided, snapshot) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps}>
                                            {/* Individual performers */}
                                            {this.props.members.map((person, personIndex) => {
                                                return <SectionMember key={person.id} 
                                                    index={personIndex} 
                                                    data={person}
                                                    onClick={this.handleClickedSectionMember}
                                                    selected={person.id === this.props.editorId}
                                                    onRequestEditMember={this.props.onRequestEditMember}
                                                    onRequestDeleteMember={this.props.onRequestDeleteMember} />
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
