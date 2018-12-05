import React, { Component } from 'react';

import Seat from './seat.jsx';

import { Typography } from '@rmwc/typography';
import { Button, ButtonIcon } from '@rmwc/button';

import '@material/typography/dist/mdc.typography.css';
import '@material/button/dist/mdc.button.css';

import {
    generateRows,
    curveRows,
    seatMembers,
    getLayoutDimensions
} from '../helpers/stage-helpers.js';

class Region extends Component {
    constructor(props) {
        super(props);

        this.handleMemberSelected = this.handleMemberSelected.bind(this);
    }

    handleClickedNewSectionButton() {
        if (typeof this.props.onRequestNewSection === 'function')
            this.props.onRequestNewSection(this.props.id);
    }

    handleMemberSelected(memberId) {
        if (typeof this.props.onRequestSelectMember === 'function')
            this.props.onRequestSelectMember(memberId);
    }

    render() {
        if (this.props.sections.length === 0) {
            return <div className='rendering-area__stage'>
                    <Typography tag='p' use='headline6'>No seats to display</Typography>
                    <div>
                        <Button raised onClick={this.props.onRequestNewSection}>Create a section</Button>
                    </div>
                </div>
        }
        else {
            // Generate a seating grid
            const rows = generateRows(this.props.sections);

            // Build a dictionary of section colors
            const membersBySection = {};
            const colorsBySection = {};
            for (let i = 0; i < this.props.sections.length; i++) {
                const currentSection = this.props.sections[i];
                membersBySection[currentSection.id] = this.props.members.filter(currentMember => currentMember.section == currentSection.id);
                colorsBySection[currentSection.id] = currentSection.color;
            }

            // Seat members and collapse empty, implicit seats
            const seatedRows = seatMembers(membersBySection, rows);

            // Curve rows if necessary, and set container dimensions for scrolling
            let layoutWidth, layoutHeight;
            if (this.props.curvedLayout) {
                curveRows(seatedRows);
                [layoutWidth, layoutHeight] = getLayoutDimensions(seatedRows);
                console.log(`Dimenxions: ${layoutWidth} x ${layoutHeight}`);
            }


            // Transform the rows so they render in the correct order for the current orientation on screen
            if (this.props.downstageTop) {
                for (const currentRow of seatedRows) {
                    currentRow.reverse();

                    for (const currentSeat of currentRow) {
                        currentSeat.y *= -1;
                    }
                }
            }
            else {
                // Reverse row order
                seatedRows.reverse();
                for (const currentRow of seatedRows) {
                    for (const currentSeat of currentRow) {
                        currentSeat.x *= -1;
                    }
                }
            }

            let stageClass = 'rendering-area__stage';
            if (this.props.curvedLayout)
                stageClass += ' rendering-area__stage--curved-layout';
            if (this.props.downstageTop)
                stageClass += ' rendering-area__stage--downstage-top';

            return <div className={stageClass} style={{ width: `${layoutWidth}px`, height: `${layoutHeight}px` }}>
                {
                    seatedRows.map((currentRow, rowIndex) => <div key={rowIndex} className='ensemble-row'>
                        {currentRow.map((currentSeat, seatIndex) => {
                            const member = membersBySection[currentSeat.section][currentSeat.seat];
                            return <Seat key={currentSeat.id}
                                member={member}
                                implicit={currentSeat.implicit}
                                implicitSeatsVisible={this.props.implicitSeatsVisible}
                                seatNameLabels={this.props.seatNameLabels}
                                seatNumber={currentSeat.seat + 1}
                                color={colorsBySection[currentSeat.section]}
                                selected={member && this.props.editorId === member.id}
                                x={currentSeat.x}
                                y={currentSeat.y}
                                onRequestSelectMember={this.handleMemberSelected} />
                        })}
                    </div>)
                }
            </div>
        }
    }
}

export default Region;
