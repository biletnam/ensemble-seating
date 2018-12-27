import React, { PureComponent } from 'react';

import { Ripple } from '@rmwc/ripple';

import '@material/ripple/dist/mdc.ripple.css';

import {getInitials} from '../helpers/stage-helpers.js';

class Seat extends PureComponent {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        if (this.props.member && typeof this.props.onRequestSelectMember === 'function') {
            this.props.onRequestSelectMember(this.props.member.id);
        }
    }

    render() {
        const { implicit, implicitSeatsVisible, seatNameLabels, member, seatNumber, color, selected, onRequestSelectMember, x, y, ...props } = this.props;
        let displayText = null;
        if (member) {
            switch (seatNameLabels) {
                case 'initials':
                    displayText = getInitials(member.name);
                    break;
                case 'full':
                    displayText = member.name;
                    break;
            }
        }
        return <span {...props} className={`seat${implicit ? ' seat--implicit' : ''}${member ? ' seat--occupied' : ''}`}
            title={member ? member.name : '' } 
            data-seat-number={seatNumber + 1}
            style={{
                backgroundColor: selected ? '#fff' : color,
                visibility: implicit && !implicitSeatsVisible && !member ? 'hidden' : '',
                left: typeof x === 'number' && !isNaN(x) ? x : 'unset',
                top: typeof y === 'number' && !isNaN(y) ? y : 'unset'
            }} >
            {displayText ? displayText : seatNumber}
            <Ripple><span className='seat__click-surface' onClick={this.handleClick} /></Ripple>
        </span>
    }
}

export default Seat;
