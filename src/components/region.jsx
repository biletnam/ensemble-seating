import React, { PureComponent } from 'react';

import './region.css';

import Seat from './seat.jsx';

import { Button } from '@rmwc/button';
import '@material/button/dist/mdc.button.min.css';

import { getLayoutDimensions } from '../helpers/stage-helpers.js';

class Region extends PureComponent {
    constructor(props) {
        super(props);

        this.handleClickedNewSectionButton = this.handleClickedNewSectionButton.bind(this);
        this.handleMemberSelected = this.handleMemberSelected.bind(this);
    }

    handleClickedNewSectionButton() {
        if (typeof this.props.onRequestNewSection === 'function')
            this.props.onRequestNewSection(this.props.regionId);
    }

    handleMemberSelected(memberId) {
        if (typeof this.props.onRequestSelectMember === 'function')
            this.props.onRequestSelectMember(memberId);
    }

    render() {
        if (this.props.seats.length === 0) {
            return <div className='stage__region'>
                    <p>No seats to display</p>
                    <div>
                        <Button raised onClick={this.handleClickedNewSectionButton}>Create a section</Button>
                    </div>
                </div>
        }
        else {
            const positionedSeats = this.props.seats;
            const [layoutWidth, layoutHeight] = getLayoutDimensions(positionedSeats, this.props.settings);

            return <div className='stage__region' style={{ width: `${layoutWidth}px`, height: `${layoutHeight}px` }}>
                {positionedSeats.map((currentSeat, seatIndex) => {
                    const member = this.props.members[currentSeat.member];
                    return <Seat key={currentSeat.id}
                        member={member}
                        memberId={currentSeat.member}
                        implicit={currentSeat.implicit}
                        implicitSeatsVisible={this.props.settings.implicitSeatsVisible}
                        seatNameLabels={this.props.settings.seatNameLabels}
                        seatNumber={currentSeat.seat + 1}
                        color={currentSeat.color}
                        selected={member && this.props.editorId === currentSeat.member}
                        x={currentSeat.x}
                        y={currentSeat.y}
                        downstageTop={this.props.settings.downstageTop}
                        onRequestSelectMember={this.handleMemberSelected} />
                })}
            </div>
        }
    }
}

export default Region;
