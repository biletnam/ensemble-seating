import React, {PureComponent} from 'react';
import './project-thumbnail.css';
import {calculateSeatPositions, getLayoutDimensions, seatSize} from '../helpers/stage.js';

class ProjectThumbnail extends PureComponent {
    constructor(props) {
        super(props);

        const {seats, origin} = calculateSeatPositions(props.data.regions, props.data.sections);
        const [layoutWidth, layoutHeight] = getLayoutDimensions(seats)
            .map(dimension => dimension + props.data.settings.seatSize + 1);

        this.state = {
            seats, layoutWidth, layoutHeight
        };
    }

    render() {
        return <svg className='project-thumbnail' width={this.state.layoutWidth} height={this.state.layoutHeight}
            viewBox={`0 0 ${this.state.layoutWidth} ${this.state.layoutHeight}`}>
            {this.state.seats.filter(seat => !(seat.implicit && !this.props.data.settings.implicitSeatsVisible && !seat.member)).map((seat, index) => (
                <rect width={seatSize} height={seatSize} stroke="black" strokeWidth="1" fill={seat.color}
                    x={seat.x}
                    y={this.state.layoutHeight - seat.y}
                    key={`seat-${index}`} />
            ))}
        </svg>
    }
}

export default ProjectThumbnail;
