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
        onRequestBatchAdd,
        onRequestShuffleSection,
        onRequestDeleteRegion,
        onRequestMoveRegion,
        onRequestSelectMember,
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
                showEditAndDeleteControls={regionEntries.length > 1}
                forceNewSectionButton={sectionEntries.length > 0 || regionEntries.length > 1}
                onRequestNewSection={onRequestNewSection}
                onRequestNewPerson={onRequestNewPerson}
                onRequestBatchAdd={onRequestBatchAdd}
                onRequestShuffleSection={onRequestShuffleSection}

                onRequestDeleteRegion={onRequestDeleteRegion}
                onRequestMoveRegion={onRequestMoveRegion}

                onRequestSelectMember={onRequestSelectMember} />
            )}
        </DragDropContext>
        {sectionEntries.length === 0 && regionEntries.length === 1 && <p className='roster__no-sections-message'>No sections to display</p>}
    </Sidebar>
};

export default Roster;
