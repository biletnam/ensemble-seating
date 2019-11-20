import React from 'react';

import './roster.css';

import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

import Sidebar from './sidebar.jsx';
import RegionListItem from './region-list-item.jsx';
import { byOrder } from '../helpers/project-helpers';

const Roster = props => {
    const {
        onDragEnd,
        regions,
        sections,
        members,
        onRequestNewSection,
        onRequestNewPerson,
        onRequestEditPerson,
        onRequestBatchAdd,
        onRequestDeleteSection,
        onRequestShuffleSection,
        onRequestDeleteRegion,
        onRequestMoveRegion,
        onRequestSelectMember,
        onRequestDeleteMember,
        ...rest
    } = props;

    const regionEntries = Object.entries(regions).sort(byOrder);
    const sectionEntries = Object.entries(sections).sort(byOrder);

    return <Sidebar {...rest} title='Roster'>
        <DragDropContext onDragEnd={onDragEnd}>
            {regionEntries.map(([regionId, currentRegion]) => <RegionListItem
                key={regionId}
                region={currentRegion}
                regionId={regionId}
                sections={Object.fromEntries(sectionEntries.filter(([sectionId, currentSection]) => currentSection.region === regionId))}
                members={members}
                enableMoveAndDeleteControls={regionEntries.length > 1}
                forceNewSectionButton={sectionEntries.length > 0 || regionEntries.length > 1}
                onRequestNewSection={onRequestNewSection}
                onRequestNewPerson={onRequestNewPerson}
                onRequestEditPerson={onRequestEditPerson}
                onRequestBatchAdd={onRequestBatchAdd}
                onRequestDeleteSection={onRequestDeleteSection}
                onRequestShuffleSection={onRequestShuffleSection}

                onRequestDeleteRegion={onRequestDeleteRegion}
                onRequestMoveRegion={onRequestMoveRegion}

                onRequestSelectMember={onRequestSelectMember}
                onRequestDeleteMember={onRequestDeleteMember} />
            )}
        </DragDropContext>
        {sectionEntries.length === 0 && regionEntries.length === 1 && <p className='roster__no-sections-message'>No sections to display</p>}
    </Sidebar>
};

export default Roster;
