import React, { PureComponent } from 'react';
import Region from './region.jsx';

class SeatingRenderer extends PureComponent {
    constructor(props) {
        super(props);

        this.handleMemberSelected = this.handleMemberSelected.bind(this);
    }

    handleMemberSelected(memberId) {
        if (typeof this.props.onRequestSelectMember === 'function')
            this.props.onRequestSelectMember(memberId);
    }

    render() {
        const regionsToRender = [];

        for (let i=0; i< this.props.regions.length; i++) {
            const currentRegion =  this.props.regions[i];
            const currentSections = this.props.sections.filter(section => section.region === currentRegion.id);
            const currentMembers = this.props.members.filter(member => currentSections.some(section => member.section === section.id));

            regionsToRender.push(
                <Region key={currentRegion.id}
                    sections={currentSections} 
                    members={currentMembers}
                    region={currentRegion}
                    curvedLayout={currentRegion.curvedLayout}
                    downstageTop={this.props.settings.downstageTop}
                    editorId={this.props.editorId}
                    implicitSeatsVisible={this.props.settings.implicitSeatsVisible}
                    seatNameLabels={this.props.settings.seatNameLabels}
                    onRequestSelectMember={this.props.onRequestSelectMember}
                    onRequestNewSection={this.props.onRequestNewSection} />
            );
        }

        if (this.props.settings.downstageTop)
            regionsToRender.reverse();

        let className = '';
        if (this.props.expanded)
            className = `${this.props.id}--expanded`

        return <div id={this.props.id} className={className}>{regionsToRender}</div>;
    }
}

export default SeatingRenderer;
