import React, { PureComponent } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import tinycolor from 'tinycolor2';

import { Card, CardPrimaryAction, CardActions, CardActionIcons, CardActionIcon } from '@rmwc/card';
import '@material/card/dist/mdc.card.css';
import '@material/button/dist/mdc.button.css';
import '@material/icon-button/dist/mdc.icon-button.css';

import MemberListItem from './member-list-item.jsx';

import './section-list-item.css';

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
                        className='section-list-item'
                        {...provided.draggableProps}>
                        <Card>
                            <CardPrimaryAction className='section-list-item__titlebar'
                                style={{backgroundColor:this.props.data.color,color:tinycolor(this.props.data.color).isLight()?'#333':'#fff'}}
                                {...provided.dragHandleProps}
                                key={this.props.data.id}
                                onClick={this.handleClickedSectionButton}>
                                <p>{this.props.data.name}</p>
                            </CardPrimaryAction>

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

                            <CardActions>
                                <CardActionIcons>
                                    <CardActionIcon onClick={this.handleClickedNewPersonButton} icon={<PersonAddIcon />} label='Add person' />
                                    <CardActionIcon onClick={this.handleClickedBatchAddMembers} icon={<GroupAddIcon />} label='Add group' />
                                </CardActionIcons>
                            </CardActions>
                        </Card>
                    </div>
                )}
            </Draggable>
    }
}

export default SectionListItem;
