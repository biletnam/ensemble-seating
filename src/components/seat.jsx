import React, { PureComponent } from 'react';
import tinycolor from 'tinycolor2';

import './seat.css';

import { Ripple } from '@rmwc/ripple';

import '@material/ripple/dist/mdc.ripple.min.css';

import {getInitials} from '../helpers/stage-helpers.js';

class Seat extends PureComponent {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        if (this.props.member && typeof this.props.onRequestSelectMember === 'function') {
            this.props.onRequestSelectMember(this.props.memberId);
        }
    }

    render() {
        const { implicit, implicitSeatsVisible, seatNameLabels, member, seatNumber, color, selected, onRequestSelectMember, x, y, downstageTop, ...props } = this.props;
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

        const style = {
            backgroundColor: selected ? '#fff' : color,
            color: tinycolor(color).isLight() ? '#333' : '#fff',
            visibility: implicit && !implicitSeatsVisible && !member ? 'hidden' : '',
            left: typeof x === 'number' && !isNaN(x) ? Math.round(x) : 'unset',
            bottom: typeof y === 'number' && !isNaN(y) ? Math.round(y) : 'unset'
        };

        const {memberId, ...rest} = props;

        return <span {...rest} className={`seat${implicit ? ' seat--implicit' : ''}${member ? ' seat--occupied' : ''}`}
            title={member ? member.name : '' } 
            data-seat-number={seatNumber + 1}
            style={style} >
            {displayText ? displayText : seatNumber}
            <Ripple><span className='seat__click-surface' onClick={this.handleClick} /></Ripple>
        </span>
    }
}

export default Seat;
