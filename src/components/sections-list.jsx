import React, {Component} from 'react';

import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

import { Typography } from '@rmwc/typography';
import '@material/typography/dist/mdc.typography.css';

import RegionListItem from './region-list-item.jsx';

function sectionsByRegion(regions, sections) {
    return regions.map(currentRegion => {
        return sections.filter(currentSection => currentSection.region === currentRegion.id);
    });
}

const SectionsList = props => {
    const regions = sectionsByRegion(props.regions, props.sections);
    return <aside id={props.id} className={props.sections.length === 0 ? `${props.id}--empty` : ''}>
        {props.sections.length === 0 && <Typography tag='p' use='subtitle1'>No sections to display</Typography>}
        <DragDropContext onDragEnd={props.onDragEnd}>
            {props.regions.map(currentRegion => <RegionListItem
                key={currentRegion.id}
                editorId={props.editorId}
                region={currentRegion}
                sections={props.sections.filter(currentSection => currentSection.region === currentRegion.id)}
                members={props.members}
                showRegionName={props.regions.length > 1}
                forceNewSectionButton={props.regions.length > 1}
                onRequestNewSection={props.onRequestNewSection}
                onRequestNewPerson={props.onRequestNewPerson}
                onRequestBatchAdd={props.onRequestBatchAdd}

                onRequestEditRegion={props.onRequestEditRegion}
                onRequestEditSection={props.onRequestEditSection}
                onRequestEditMember={props.onRequestEditMember}

                onRequestDeleteSection={props.onRequestDeleteSection}
                onRequestDeleteMember={props.onRequestDeleteMember}

                onRequestSelectMember={props.onRequestSelectMember} />
            )}
        </DragDropContext>
    </aside>
};

export default SectionsList;
