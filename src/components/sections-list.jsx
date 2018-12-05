import React, {Component} from 'react';

import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { Fab } from '@rmwc/fab';
import { Typography } from '@rmwc/typography';

import '@material/fab/dist/mdc.fab.css';
import '@material/typography/dist/mdc.typography.css';

import RegionListItem from './region-list-item.jsx';
import AddIcon from '../icons/baseline-add-24px.jsx';

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
        <Fab icon={<AddIcon />} label='New section' className='sections-list__new-section-button'
            onClick={props.onNewSectionButtonClick}
            exited={props.sections.length === 0} />
    </aside>
};

export default SectionsList;
