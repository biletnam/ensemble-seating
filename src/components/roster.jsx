import React from 'react';

import './roster.css';

import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

import Sidebar from './sidebar.jsx';
import RegionListItem from './region-list-item.jsx';

const Roster = props => {
    const {
        onDragEnd,
        regions,
        sections,
        members,
        onRequestNewSection,
        onRequestNewPerson,
        onRequestBatchAdd,
        onRequestDeleteRegion,
        onRequestMoveRegion,
        onRequestSelectMember,
        ...rest
    } = props;

    return <Sidebar {...rest} title='Roster'>
        <DragDropContext onDragEnd={onDragEnd}>
            {regions.map(currentRegion => <RegionListItem
                key={currentRegion.id}
                region={currentRegion}
                sections={sections.filter(currentSection => currentSection.region === currentRegion.id)}
                members={members}
                showEditAndDeleteControls={regions.length > 1}
                forceNewSectionButton={sections.length > 0 || regions.length > 1}
                onRequestNewSection={onRequestNewSection}
                onRequestNewPerson={onRequestNewPerson}
                onRequestBatchAdd={onRequestBatchAdd}

                onRequestDeleteRegion={onRequestDeleteRegion}
                onRequestMoveRegion={onRequestMoveRegion}

                onRequestSelectMember={onRequestSelectMember} />
            )}
        </DragDropContext>
        {sections.length === 0 && regions.length === 1 && <p className='roster__no-sections-message'>No sections to display</p>}
    </Sidebar>
};

export default Roster;
