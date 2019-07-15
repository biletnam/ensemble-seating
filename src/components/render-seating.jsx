import React, { PureComponent } from 'react';
import Region from './region.jsx';
import { trimOuterSpacing } from '../helpers/stage-helpers.js';

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
            const currentSeats = this.props.seats.filter(seat => currentSections.some(section => section.id === seat.section));
            const trimmedSeats = trimOuterSpacing(currentSeats);
            const currentBackdrops = currentSections.reduce((acc, cur) => {
                acc[cur.id] = this.props.sectionBackdrops[cur.id];
                return acc;
            }, {});

            regionsToRender.push(
                <Region key={currentRegion.id}
                    seats={trimmedSeats}
                    backdrops={currentBackdrops}
                    {...currentRegion}
                    settings={this.props.settings}
                    editorId={this.props.editorId}
                    onRequestSelectMember={this.props.onRequestSelectMember}
                    onRequestNewSection={this.props.onRequestNewSection} />
            );
        }

        if (this.props.settings.downstageTop)
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

export default SeatingRenderer;
