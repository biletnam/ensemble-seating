import React from 'react';
import tinycolor from 'tinycolor2';
import { useDrag, useDrop } from 'react-dnd';

import {getInitials} from '../helpers/stage.js';
import { Drag as DragTypes } from '../types';

import './seat.css';

const Seat = props => {
    const [{isDragging}, dragRef] = useDrag({
        item: { type: DragTypes.SEAT, id: props.memberId },
        collect: monitor => ({
            isDragging: !!monitor.isDragging(),
        }),
    });

    const [{ isOver, dragInProgress }, dropRef] = useDrop({
		accept: DragTypes.SEAT,
		drop: (item, monitor) => props.onDropMember(item.id),
		collect: monitor => ({
            isOver: !!monitor.isOver(),
            dragInProgress: monitor.getItem() && (monitor.getItemType() === DragTypes.SEAT)
		}),
    });

    function handleClick() {
        if (props.member && typeof props.onRequestSelectMember === 'function') {
            props.onRequestSelectMember(props.memberId);
        }
    }

    let displayText = null;
    if (props.member) {
        switch (props.seatNameLabels) {
            case 'initials':
                displayText = getInitials(props.member.name);
                break;
            case 'full':
                displayText = props.member.name;
                break;
        }
    }

    const style = {
        backgroundColor: props.selected ? '#fff' : props.color,
        color: tinycolor(props.color).isLight() ? '#333' : '#fff',
        visibility: props.implicit && !props.implicitSeatsVisible && !props.member ? 'hidden' : '',
        left: typeof props.x === 'number' && !isNaN(props.x) ? Math.round(props.x) : 'unset',
        bottom: typeof props.y === 'number' && !isNaN(props.y) ? Math.round(props.y) : 'unset'
    };

    let className = 'seat';
    if (props.implicit) {
        className += ' seat--implicit';
    }
    if (props.member) {
        className += ' seat--occupied';
    }
    else if (isOver && dragInProgress) {
        className += ' seat--drop-hover';
    }

    return <span className={className}
        ref={props.member ? dragRef : dropRef}
        title={props.member ? props.member.name : '' }
        data-seat-number={props.seatNumber + 1}
        style={style} onClick={handleClick} >
        {displayText}
    </span>
}

export default Seat;
