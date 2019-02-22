import React, { PureComponent } from 'react';

import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

import RegionListItem from './region-list-item.jsx';
import LeftChevronIcon from '../icons/baseline-chevron_left-24px.jsx';

class SectionsList extends PureComponent {
    render() {
        let className = '';
        if (this.props.sections.length === 0 && this.props.regions.length === 1)
            className = `${this.props.id}--empty`;

        if (!this.props.expanded)
            className += ` ${this.props.id}--collapsed`;

        const label = this.props.expanded ? 'Hide sections' : 'Show sections';

        return <aside id={this.props.id} className={className}>
            {this.props.sections.length === 0 && this.props.regions.length === 1 && <p>No sections to display</p>}
            <button type='button' className='sections-list__toggle-button' onClick={this.props.onToggleVisibility}
                aria-label={label} title={label}>
                <LeftChevronIcon style={{transform: this.props.expanded ? 'rotateZ(180deg)' : ''}} />
            </button>
            <div className='sections-list__scrollable-container'>
                <DragDropContext onDragEnd={this.props.onDragEnd}>
                    {this.props.regions.map(currentRegion => <RegionListItem
                        key={currentRegion.id}
                        editorId={this.props.editorId}
                        region={currentRegion}
                        sections={this.props.sections.filter(currentSection => currentSection.region === currentRegion.id)}
                        members={this.props.members}
                        showRegionName={this.props.regions.length > 1}
                        forceNewSectionButton={this.props.sections.length > 0 || this.props.regions.length > 1}
                        onRequestNewSection={this.props.onRequestNewSection}
                        onRequestNewPerson={this.props.onRequestNewPerson}
                        onRequestBatchAdd={this.props.onRequestBatchAdd}

                        onRequestDeleteRegion={this.props.onRequestDeleteRegion}
                        onRequestMoveRegion={this.props.onRequestMoveRegion}
                        onRequestEditRegion={this.props.onRequestEditRegion}
                        onRequestEditSection={this.props.onRequestEditSection}
                        onRequestEditMember={this.props.onRequestEditMember}

                        onRequestDeleteSection={this.props.onRequestDeleteSection}
                        onRequestDeleteMember={this.props.onRequestDeleteMember}

                        onRequestSelectMember={this.props.onRequestSelectMember} />
                    )}
                </DragDropContext>
            </div>
        </aside>
    }
};

export default SectionsList;
