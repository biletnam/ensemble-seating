import React, { Component } from 'react';

import { IconButton } from '@rmwc/icon-button';
import '@material/icon-button/dist/mdc.icon-button.css';

import SectionListItem from './section-list-item.jsx';
import MoreIcon from '../icons/baseline-more_vert-24px.jsx';

import { Droppable } from 'react-beautiful-dnd';

class RegionListItem extends Component {
    constructor(props) {
        super(props);
        this.handleClickedEditRegion = this.handleClickedEditRegion.bind(this);
    }

    handleClickedEditRegion() {
        this.props.onRequestEditRegion(this.props.region.id);
    }

    render() {
        return <Droppable droppableId={this.props.region.id} type='section'>
            {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className='sections-list__droppable-section-area'>
                    {/* Iterate over sections here */}
                    <h4>
                        <span>{this.props.region.name}</span>
                        <IconButton onClick={this.handleClickedEditRegion} icon={<MoreIcon />} label='Edit region' />
                    </h4>
                    {this.props.sections.map((currentSection, currentIndex) => {
                        return <SectionListItem key={currentSection.id}
                            editorId={this.props.editorId}
                            data={currentSection}
                            index={currentIndex}
                            members={this.props.members.filter(currentMember => currentMember.section === currentSection.id)}
                            onRequestNewPerson={this.props.onRequestNewPerson}
                            onRequestBatchAdd={this.props.onRequestBatchAdd}

                            // To do: update other components so the editor dialog is shown
                            onRequestEditSection={this.props.onRequestEditSection}
                            onRequestEditMember={this.props.onRequestEditMember}

                            onRequestDeleteSection={this.props.onRequestDeleteSection}
                            onRequestDeleteMember={this.props.onRequestDeleteMember}

                            onRequestSelectMember={this.props.onRequestSelectMember} />
                    })}
                    
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    }
}

export default RegionListItem;
