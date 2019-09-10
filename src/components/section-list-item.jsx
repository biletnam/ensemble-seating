import React, { useState } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import tinycolor from 'tinycolor2';

import { Card, CardPrimaryAction, CardActions, CardActionIcons, CardActionIcon } from '@rmwc/card';
import '@material/card/dist/mdc.card.css';
import '@material/button/dist/mdc.button.css';
import '@material/icon-button/dist/mdc.icon-button.css';

import { Menu, MenuSurfaceAnchor, MenuItem } from '@rmwc/menu';
import '@material/menu/dist/mdc.menu.css';
import '@material/menu-surface/dist/mdc.menu-surface.css';
import '@material/list/dist/mdc.list.css';

import MenuItemIcon from './menu-item-icon.jsx';
import MemberListItem from './member-list-item.jsx';

import './section-list-item.css';

import PersonAddIcon from '../icons/baseline-person_add-24px.jsx';
import GroupAddIcon from '../icons/baseline-group_add-24px.jsx';
import MoreIcon from '../icons/baseline-more_vert-24px.jsx';
import ShuffleIcon from '../icons/baseline-shuffle-24px.jsx';

const SectionListItem = props => {
    const [menuOpen, setMenuOpen] = useState(false);

    function handleClickedNewPersonButton() {
        if (props.onRequestNewPerson)
            props.onRequestNewPerson(props.data.id);
    }

    function handleClickedMemberListItem(memberId) {
        if (props.onRequestSelectMember)
            props.onRequestSelectMember(memberId);
    }

    function handleClickedSectionButton() {
        if (props.onRequestSelectMember)
            props.onRequestSelectMember(props.data.id);
    }

    function handleClickedBatchAddMembers() {
        if (props.onRequestBatchAdd)
            props.onRequestBatchAdd(props.data.id);
    }

    function handleSelectedMenuItem(event) {
        switch (event.detail.item.dataset.action) {
            case 'shuffle':
                props.onRequestShuffle && props.onRequestShuffle(props.data.id);
                break;
        }
    }

    return <Draggable key={props.data.id}
        draggableId={props.data.id}
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
                            key={props.data.id}
                            onClick={handleClickedSectionButton}>
                            <p>{props.data.name}</p>
                        </CardPrimaryAction>

                        <Droppable droppableId={props.data.id} type='member'>
                            {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.droppableProps}>
                                    {/* Individual performers */}
                                    {props.members.map((person, personIndex) => {
                                        return <MemberListItem key={person.id} 
                                            index={personIndex} 
                                            data={person}
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
                                {/* <CardActionIcon onClick={handleClickedBatchAddMembers} icon={<ShuffleIcon />} aria-label='Add group' /> */}
                                <MenuSurfaceAnchor>
                                    <Menu open={menuOpen} onClose={() => setMenuOpen(false)} onSelect={handleSelectedMenuItem}>
                                        <MenuItem data-action='shuffle'>
                                            <MenuItemIcon icon={<ShuffleIcon />} />
                                            Shuffle
                                        </MenuItem>
                                    </Menu>
                                    <CardActionIcon onClick={() => setMenuOpen(true)} icon={<MoreIcon />} />
                                </MenuSurfaceAnchor>
                            </CardActionIcons>
                        </CardActions>
                    </Card>
                </div>
            )}
        </Draggable>
}

export default SectionListItem;
