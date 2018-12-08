import React, { Component } from 'react';

import { IconButton } from '@rmwc/icon-button';
import { Button, ButtonIcon } from '@rmwc/button';
import { Elevation } from '@rmwc/elevation';

import '@material/icon-button/dist/mdc.icon-button.css';
import '@material/button/dist/mdc.button.css';
import '@material/elevation/dist/mdc.elevation.css';

import ListActionMenu from './list-action-menu.jsx';
import SectionListItem from './section-list-item.jsx';
import MoreIcon from '../icons/baseline-more_vert-24px.jsx';
import AddIcon from '../icons/baseline-add-24px.jsx';

import { Droppable } from 'react-beautiful-dnd';

class RegionListItem extends Component {
    constructor(props) {
        super(props);

        this.handleClickedNewSection = this.handleClickedNewSection.bind(this);
        this.handleActionMenuClick = this.handleActionMenuClick.bind(this);
    }

    handleClickedNewSection() {
        if (typeof this.props.onRequestNewSection === 'function')
            this.props.onRequestNewSection(this.props.region.id);
    }

    handleActionMenuClick(action) {
        if (action === 'edit' && typeof this.props.onRequestEditRegion === 'function')
            this.props.onRequestEditRegion(this.props.region.id);
        else if (action === 'delete' && typeof this.props.onRequestDeleteRegion === 'function')
            this.props.onRequestDeleteRegion(this.props.region.id);
        else if (typeof this.props.onRequestMoveRegion === 'function') {
            const splitAction = action.split('-');
            this.props.onRequestMoveRegion(this.props.region.id, splitAction[splitAction.length - 1]);
        }
    }

    render() {
        return <Droppable droppableId={this.props.region.id} type='section'>
            {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className='sections-list__droppable-section-area'>
                    {/* Iterate over sections here */}
                    {this.props.showRegionName && <Elevation z='1' className='sections-list__region-heading-container'>
                        <span className='sections-list__region-heading-text'>{this.props.region.name}</span>
                        <ListActionMenu handle={<IconButton icon={<MoreIcon />}
                            label='Edit region' />}
                            onSelectAction={this.handleActionMenuClick} />
                    </Elevation>}
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

                    {this.props.forceNewSectionButton && <div className='sections-list__section-container'>
                        <Button onClick={this.handleClickedNewSection} raised><ButtonIcon icon={<AddIcon />} /> New section</Button>
                    </div>}
                </div>
            )}
        </Droppable>
    }
}

export default RegionListItem;
