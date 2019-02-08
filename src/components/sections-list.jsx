import React, { PureComponent } from 'react';

import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

import RegionListItem from './region-list-item.jsx';

class SectionsList extends PureComponent {
    render() {
        return <aside id={this.props.id} className={this.props.sections.length === 0 && this.props.regions.length === 1 ? `${this.props.id}--empty` : ''}>
            {this.props.sections.length === 0 && this.props.regions.length === 1 && <p>No sections to display</p>}
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
        </aside>
    }
};

export default SectionsList;
