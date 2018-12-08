import React, {Component} from 'react';
import Region from './region.jsx';
import Seat from './seat.jsx';

import {Typography} from '@rmwc/typography';
import { Button, ButtonIcon } from '@rmwc/button';

import '@material/typography/dist/mdc.typography.css';
import '@material/button/dist/mdc.button.css';

import {
    generateRows,
    curveRows,
    seatMembers,
    getLayoutDimensions
} from '../helpers/stage-helpers.js';

class SeatingRenderer extends Component {
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

        for (let i=0; i< this.props.project.regions.length; i++) {
            const currentRegion =  this.props.project.regions[i];
            const currentSections = this.props.project.sections.filter(section => section.region === currentRegion.id);
            const currentMembers = this.props.project.members.filter(member => currentSections.some(section => member.section === section.id));

            regionsToRender.push(
                <Region key={currentRegion.id}
                    sections={currentSections} 
                    members={currentMembers}
                    region={currentRegion}
                    curvedLayout={currentRegion.curvedLayout}
                    downstageTop={this.props.project.settings.downstageTop}
                    editorId={this.props.editorId}
                    implicitSeatsVisible={this.props.project.settings.implicitSeatsVisible}
                    seatNameLabels={this.props.project.settings.seatNameLabels}
                    onRequestSelectMember={this.props.onRequestSelectMember}
                    onRequestNewSection={this.props.onRequestNewSection} />
            );
        }

        if (this.props.project.settings.downstageTop)
            regionsToRender.reverse();

        return <div id={this.props.id}>{regionsToRender}</div>;
    }
}

export default SeatingRenderer;
