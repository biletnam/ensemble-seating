import React from 'react';

import { Button } from '@rmwc/button';
import '@material/button/dist/mdc.button.min.css';

import Seat from './seat.jsx';
import { getLayoutDimensions } from '../helpers/stage.js';

import './region.css';

const Region = props => {
    function handleClickedNewSectionButton() {
        if (typeof props.onRequestNewSection === 'function')
            props.onRequestNewSection(props.regionId);
    }

    function handleMemberSelected(memberId) {
        if (typeof props.onRequestSelectMember === 'function')
            props.onRequestSelectMember(memberId);
    }

    function handleDroppedMemberOnSeat(memberId, sectionId, index) {
        props.onRequestMoveMember && props.onRequestMoveMember(memberId, sectionId, index);
    }

    if (props.seats.length === 0) {
        return <div className='stage__region'>
            <p>No seats to display</p>
            <div>
                <Button raised onClick={handleClickedNewSectionButton}>Create a section</Button>
            </div>
        </div>;
    }
    else {
        /**
         * @type Array<import('../helpers/stage').SeatData>
         */
        const positionedSeats = props.seats;
        const [layoutWidth, layoutHeight] = getLayoutDimensions(positionedSeats)
            .map(dimension => dimension + props.settings.seatSize);

        return <div className='stage__region' style={{ width: `${layoutWidth}px`, height: `${layoutHeight}px` }}>
            {positionedSeats.map((currentSeat, seatIndex) => {
                const member = props.members[currentSeat.member];
                return <Seat key={currentSeat.id}
                    member={member}
                    memberId={currentSeat.member}
                    implicit={currentSeat.implicit}
                    implicitSeatsVisible={props.settings.implicitSeatsVisible}
                    seatNameLabels={props.settings.seatNameLabels}
                    seatNumber={currentSeat.seat}
                    color={currentSeat.color}
                    selected={member && props.editorId === currentSeat.member}
                    x={currentSeat.x}
                    y={currentSeat.y}
                    downstageTop={props.settings.downstageTop}
                    onRequestSelectMember={handleMemberSelected}
                    onDropMember={droppedId => handleDroppedMemberOnSeat(droppedId, currentSeat.section, currentSeat.seat)} />
            })}
        </div>
    }
}

export default Region;
