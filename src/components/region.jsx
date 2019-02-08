import React, { PureComponent } from 'react';

import Seat from './seat.jsx';

import { Button } from '@rmwc/button';
import '@material/button/dist/mdc.button.css';

import {
    seatSize,
    generateRows,
    curveRows,
    seatMembers,
    getLayoutDimensions
} from '../helpers/stage-helpers.js';

class Region extends PureComponent {
    constructor(props) {
        super(props);

        this.handleClickedNewSectionButton = this.handleClickedNewSectionButton.bind(this);
        this.handleMemberSelected = this.handleMemberSelected.bind(this);
    }

    handleClickedNewSectionButton() {
        if (typeof this.props.onRequestNewSection === 'function')
            this.props.onRequestNewSection(this.props.region.id);
    }

    handleMemberSelected(memberId) {
        if (typeof this.props.onRequestSelectMember === 'function')
            this.props.onRequestSelectMember(memberId);
    }

    render() {
        if (this.props.sections.length === 0) {
            return <div className='rendering-area__stage'>
                    <p>No seats to display</p>
                    <div>
                        <Button raised onClick={this.handleClickedNewSectionButton}>Create a section</Button>
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
                }
            }
            else {
                // Reverse row order
                seatedRows.reverse();
                for (const currentRow of seatedRows) {
                    for (const currentSeat of currentRow) {
                        currentSeat.x = (currentSeat.x * -1) - seatSize;
                        currentSeat.y = (currentSeat.y * -1) - seatSize;
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
