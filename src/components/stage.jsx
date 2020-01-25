import React, { PureComponent } from 'react';

import './stage.css';

import Region from './region.jsx';
import { trimOuterSpacing } from '../helpers/stage.js';

class Stage extends PureComponent {
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

        const regionEntries = Object.entries(this.props.regions);
        const sectionEntries = Object.entries(this.props.sections);

        for (let i=0; i<regionEntries.length; i++) {
            const [currentId, currentRegion] = regionEntries[i];
            const currentSections = sectionEntries.filter(([, section]) => section.region === currentId);
            const currentSeats = this.props.seats.filter(seat => currentSections.some(([sectionId, sectionData]) => sectionId === seat.section));
            const trimmedSeats = trimOuterSpacing(currentSeats);

            regionsToRender.push(
                <Region key={currentId}
                    seats={trimmedSeats}
                    members={this.props.members}
                    regionId={currentId}
                    settings={this.props.settings}
                    editorId={this.props.editorId}
                    onRequestSelectMember={this.props.onRequestSelectMember}
                    onRequestNewSection={this.props.onRequestNewSection} />
            );
        }

        if (!this.props.settings.downstageTop)
            regionsToRender.reverse();

        let className = '';
        if (this.props.expanded)
            className = `${this.props.id}--expanded`

        return <div id={this.props.id} className={className} style={{
            '--seat-size': `${this.props.settings.seatSize}px`,
            '--seat-label-font-size': `${this.props.settings.seatLabelFontSize}px`
        }}>{regionsToRender}</div>;
    }
}

export default Stage;
