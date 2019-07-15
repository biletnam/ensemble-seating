import React, { PureComponent } from 'react';

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
            this.props.onRequestNewSection(this.props.id);
    }

    handleMemberSelected(memberId) {
        if (typeof this.props.onRequestSelectMember === 'function')
            this.props.onRequestSelectMember(memberId);
    }

    render() {
        if (this.props.seats.length === 0) {
            return <div className='rendering-area__stage'>
                    <p>No seats to display</p>
                    <div>
                        <Button raised onClick={this.handleClickedNewSectionButton}>Create a section</Button>
                    </div>
                </div>
        }
        else {
            const [layoutWidth, layoutHeight] = getLayoutDimensions(this.props.seats, this.props.settings);

            return <div className='rendering-area__stage' style={{ width: `${layoutWidth}px`, height: `${layoutHeight}px` }}>
                {/* SVG backdrops */}
                <svg width={layoutWidth} height={layoutHeight} viewBox={`0 0 ${layoutWidth} ${layoutHeight}`}>
                    {Object.keys(this.props.backdrops).map(sectionId => <g key={sectionId} className='section-backdrop'>
                        {this.props.backdrops[sectionId].map((backdropRow, currentIndex) => <polyline key={`${sectionId}-${currentIndex}`}
                            points={backdropRow.reduce((acc, seatId) => {
                                const seat = this.props.seats.find(seat => seat.id === seatId);
                                return acc + `${acc.length > 0 ? ' ' : ''}${seat.x},${seat.y}`;
                            }, '')} />)}
                    </g>)}
                </svg>

                {/* Seats */}
                {this.props.seats.map((currentSeat, seatIndex) => {
                    const member = currentSeat.member;
                    return <Seat key={currentSeat.id}
                        member={member}
                        implicit={currentSeat.implicit}
                        implicitSeatsVisible={this.props.settings.implicitSeatsVisible}
                        seatNameLabels={this.props.settings.seatNameLabels}
                        seatNumber={currentSeat.seat + 1}
                        color={currentSeat.color}
                        selected={member && this.props.editorId === member.id}
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
