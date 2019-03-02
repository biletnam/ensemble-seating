import React, { PureComponent } from 'react';

import Seat from './seat.jsx';

import { Button } from '@rmwc/button';
import '@material/button/dist/mdc.button.css';

import {
    getLayoutDimensions,
    calculateSeatPositions
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
            const positionedSeats = calculateSeatPositions([this.props.region], this.props.sections, this.props.members);
            const [layoutWidth, layoutHeight] = getLayoutDimensions(positionedSeats);

            return <div className='rendering-area__stage' style={{ width: `${layoutWidth}px`, height: `${layoutHeight}px` }}>
                {positionedSeats.map((currentSeat, seatIndex) => {
                    const member = currentSeat.member;
                    return <Seat key={currentSeat.id}
                        member={member}
                        implicit={currentSeat.implicit}
                        implicitSeatsVisible={this.props.implicitSeatsVisible}
                        seatNameLabels={this.props.seatNameLabels}
                        seatNumber={currentSeat.seat + 1}
                        color={currentSeat.color}
                        selected={member && this.props.editorId === member.id}
                        x={currentSeat.x}
                        y={currentSeat.y}
                        downstageTop={this.props.downstageTop}
                        onRequestSelectMember={this.handleMemberSelected} />
                })}
            </div>
        }
    }
}

export default Region;
