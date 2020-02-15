import React, { useRef, useEffect } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

import Sidebar from './sidebar.jsx';
import RegionListItem from './region-list-item.jsx';
import { sortByOrder } from '../helpers/project.js';
import { idbSetRosterScrollPosition, idbGetRosterScrollPosition } from '../helpers/idb.js';

import './roster.css';

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
        onRequestMoveMember,
        onRequestDeleteMember,
        ...rest
    } = props;

    const regionEntries = Object.entries(regions).sort(sortByOrder);
    const sectionEntries = Object.entries(sections).sort(sortByOrder);
    const scrollableContainerRef = useRef(null);

    useEffect(() => {
        idbGetRosterScrollPosition().then(currentScroll => {
            if (scrollableContainerRef.current) {
                scrollableContainerRef.current.scrollTo(0, currentScroll)
            }
            idbSetRosterScrollPosition(0);
        })
    }, []);

    function saveScrollAndSelectMember () {
        const currentScroll = scrollableContainerRef.current ? scrollableContainerRef.current.scrollTop : 0;
        idbSetRosterScrollPosition(currentScroll);
        onRequestSelectMember(...arguments);
    }

    return <Sidebar {...rest} title='Roster' scrollableContainerRef={scrollableContainerRef}>
        <DragDropContext onDragEnd={onDragEnd}>
            {regionEntries.map(([regionId, currentRegion]) => <RegionListItem
                key={regionId}
                region={currentRegion}
                regionId={regionId}
                sections={Object.fromEntries(sectionEntries.filter(([sectionId, currentSection]) => currentSection.region === regionId))}
                members={members}
                enableMoveAndDeleteControls={regionEntries.length > 1}
                onRequestNewSection={onRequestNewSection}
                onRequestNewPerson={onRequestNewPerson}
                onRequestEditPerson={onRequestEditPerson}
                onRequestBatchAdd={onRequestBatchAdd}
                onRequestDeleteSection={onRequestDeleteSection}
                onRequestShuffleSection={onRequestShuffleSection}

                onRequestDeleteRegion={onRequestDeleteRegion}
                onRequestMoveRegion={onRequestMoveRegion}

                onRequestSelectMember={saveScrollAndSelectMember}
                onRequestMoveMember={onRequestMoveMember}
                onRequestDeleteMember={onRequestDeleteMember} />
            )}
        </DragDropContext>
    </Sidebar>
};

export default Roster;
