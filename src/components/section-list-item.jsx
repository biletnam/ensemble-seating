import React, { useState } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import tinycolor from 'tinycolor2';

import { Card, CardPrimaryAction, CardActions, CardActionIcons, CardActionIcon } from '@rmwc/card';
import '@material/card/dist/mdc.card.css';
import '@material/button/dist/mdc.button.css';
import '@material/icon-button/dist/mdc.icon-button.css';

import ListActionMenu from './list-action-menu.jsx';
import MemberListItem from './member-list-item.jsx';

import './section-list-item.css';

import PersonAddIcon from '../icons/person_add-24px.svg';
import GroupAddIcon from '../icons/group_add-24px.svg';
import MoreIcon from '../icons/more_vert-24px.svg';
import { byOrder } from '../helpers/project-helpers.js';

const SectionListItem = props => {
    const [menuOpen, setMenuOpen] = useState(false);

    function handleClickedNewPersonButton() {
        if (props.onRequestNewPerson)
            props.onRequestNewPerson(props.sectionId);
    }

    function handleClickedMemberListItem(memberId) {
        if (props.onRequestSelectMember)
            props.onRequestSelectMember(memberId);
    }

    function handleClickedSectionButton() {
        if (props.onRequestSelectMember)
            props.onRequestSelectMember(props.sectionId);
    }

    function handleClickedBatchAddMembers() {
        if (props.onRequestBatchAdd)
            props.onRequestBatchAdd(props.sectionId);
    }

    function handleSelectedMenuItem(action) {
        switch (action) {
            case 'shuffle':
                props.onRequestShuffle && props.onRequestShuffle(props.sectionId);
                break;
        }
        setMenuOpen(false);
    }

    const memberEntries = Object.entries(props.members).sort(byOrder);

    return <Draggable key={props.sectionId}
        draggableId={props.sectionId}
        index={props.index}
        type='section'>
            {(provided, snapshot) => (
                <div ref={provided.innerRef}
                    className='section-list-item'
                    {...provided.draggableProps}>
                    <Card>
                        <CardPrimaryAction className='section-list-item__titlebar'
                            style={{backgroundColor:props.data.color,color:tinycolor(props.data.color).isLight()?'#333':'#fff'}}
                            {...provided.dragHandleProps}
                            key={props.sectionId}
                            onClick={handleClickedSectionButton}>
                            <p>{props.data.name}</p>
                        </CardPrimaryAction>

                        <Droppable droppableId={props.sectionId} type='member'>
                            {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.droppableProps}>
                                    {/* Individual performers */}
                                    {memberEntries.map(([personId, person], personIndex) => {
                                        return <MemberListItem key={personId} 
                                            index={personIndex} 
                                            data={person}
                                            memberId={personId}
                                            onClick={handleClickedMemberListItem} />
                                    })}
                                    
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>

                        <CardActions>
                            <CardActionIcons>
                                <CardActionIcon onClick={handleClickedNewPersonButton} icon={<PersonAddIcon />} aria-label='Add person' />
                                <CardActionIcon onClick={handleClickedBatchAddMembers} icon={<GroupAddIcon />} aria-label='Add group' />
                                
                                <ListActionMenu
                                    shuffle='section members'
                                    onSelectAction={handleSelectedMenuItem}
                                    open={menuOpen}
                                    onClose={() => setMenuOpen(false)}>
                                    <CardActionIcon icon={<MoreIcon />} label='Edit section' onClick={() => setMenuOpen(true)} />
                                </ListActionMenu>
                            </CardActionIcons>
                        </CardActions>
                    </Card>
                </div>
            )}
        </Draggable>
}

export default SectionListItem;
