import React, {Component} from 'react';

import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { Fab } from '@rmwc/fab';
import { Typography } from '@rmwc/typography';

import '@material/fab/dist/mdc.fab.css';
import '@material/typography/dist/mdc.typography.css';

import SectionListItem from './section-list-item.jsx';
import AddIcon from '../icons/baseline-add-24px.jsx';

const SectionsList = props => (
    <aside id={props.id} className={props.sections.length === 0 ? `${props.id}--empty` : ''}>
        {props.sections.length === 0 && <Typography tag='p' use='subtitle1'>No sections to display</Typography>}
        <DragDropContext onDragEnd={props.onDragEnd}>
            <Droppable droppableId='sections-list-droppable' type='section'>
                {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} id='sections-list__droppable-section-area'>
                        {/* Iterate over sections here */}
                        {props.sections.map((currentSection, currentIndex) => {
                            return <SectionListItem key={currentSection.id}
                                editorId={props.editorId}
                                data={currentSection}
                                index={currentIndex}
                                members={props.members.filter(currentMember => currentMember.section === currentSection.id)}
                                onRequestNewPerson={props.onRequestNewPerson}
                                onRequestBatchAdd={props.onRequestBatchAdd}

                                // To do: update other components so the editor dialog is shown
                                onRequestEditSection={props.onRequestEditSection}
                                onRequestEditMember={props.onRequestEditMember}

                                onRequestDeleteSection={props.onRequestDeleteSection}
                                onRequestDeleteMember={props.onRequestDeleteMember}

                                onRequestSelectMember={props.onRequestSelectMember} />
                        })}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
        <Fab icon={<AddIcon />} label='New section' className='sections-list__new-section-button'
            onClick={props.onNewSectionButtonClick}
            exited={props.sections.length === 0} />
    </aside>
);

export default SectionsList;
