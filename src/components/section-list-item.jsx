import React, { useState } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import tinycolor from 'tinycolor2';

import { Card, CardPrimaryAction, CardActions, CardActionIcons, CardActionIcon } from '@rmwc/card';
import '@material/card/dist/mdc.card.css';
import '@material/button/dist/mdc.button.css';
import '@material/icon-button/dist/mdc.icon-button.css';

import ListActionMenu from './list-action-menu.jsx';
import MemberListItem from './member-list-item.jsx';
import SeatListItem from './seat-list-item.jsx';

import './section-list-item.css';

import GroupAddIcon from '../icons/group_add-24px.svg';
import MoreIcon from '../icons/more_vert-24px.svg';
import { sortByOrder, Member } from '../helpers/project.js';

const SectionListItem = props => {
    const [menuOpen, setMenuOpen] = useState(false);

    function handleCreatedMemberListItem(name, seatIndex) {
        props.onRequestNewPerson && props.onRequestNewPerson(props.sectionId, name, seatIndex);
    }

    function handleEditedMemberListItem(id, data) {
        props.onRequestEditPerson && props.onRequestEditPerson(id, data);
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
            case 'delete':
                props.onRequestDelete && props.onRequestDelete(props.sectionId);
                break;
            case 'settings':
                handleClickedSectionButton();
                break;
            case 'shuffle':
                props.onRequestShuffle && props.onRequestShuffle(props.sectionId);
                break;
        }
        setMenuOpen(false);
    }

    /** @type {Array<[string, Member]>} */
    const memberEntries = Object.entries(props.members).sort(sortByOrder);

    const seatList = [];
    for (let i=0; i<props.data.rowSettings.length; i++) {
        for (let k=0; k<props.data.rowSettings[i]; k++) {
            const thisSeat = seatList.length;
            const [memberId, memberData] = memberEntries.find(([id, data]) => data.order === thisSeat) || [];
            const seatKey = `section-${props.data.name}-seat-${thisSeat}`;
            seatList.push(<SeatListItem droppable={!memberId} key={seatKey}
                onDrop={droppedMember => props.onRequestMoveMember(droppedMember, props.sectionId, thisSeat)}>
                    <MemberListItem data={memberData} memberId={memberId}
                        onCreate={name => handleCreatedMemberListItem(name, thisSeat)}
                        onEdit={handleEditedMemberListItem}
                        onDelete={props.onRequestDeleteMember}
                        onSelect={() => props.onRequestSelectMember && props.onRequestSelectMember(memberId)} />
                </SeatListItem>
            );
        }
    }

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
                            key={props.sectionId}>
                            {props.data.name}
                        </CardPrimaryAction>

                        <Droppable droppableId={props.sectionId} type='member'>
                            {(provided, snapshot) => (
                                <ol className='section-list-item__member-list'
                                    ref={provided.innerRef} {...provided.droppableProps}>
                                    {seatList}
                                    {provided.placeholder}
                                </ol>
                            )}
                        </Droppable>

                        <CardActions>
                            <CardActionIcons>
                                <CardActionIcon onClick={handleClickedBatchAddMembers} icon={<GroupAddIcon />} title='Add multiple people' aria-label='Add multiple people' />
                                
                                <ListActionMenu
                                    shuffle='section members'
                                    deleteItem
                                    settings
                                    onSelectAction={handleSelectedMenuItem}
                                    open={menuOpen}
                                    onClose={() => setMenuOpen(false)}>
                                    <CardActionIcon icon={<MoreIcon />} onClick={() => setMenuOpen(true)} />
                                </ListActionMenu>
                            </CardActionIcons>
                        </CardActions>
                    </Card>
                </div>
            )}
        </Draggable>
}

export default SectionListItem;
