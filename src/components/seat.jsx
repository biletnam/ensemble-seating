import React from 'react';
import tinycolor from 'tinycolor2';
import { useDrag, useDrop } from 'react-dnd';

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

    const isOccupied = props.children && props.children.length > 0;

    const style = {
        backgroundColor: props.selected ? '#fff' : props.color,
        color: tinycolor(props.color).isLight() ? '#333' : '#fff',
        visibility: props.visible ? '' : 'hidden',
        left: typeof props.x === 'number' && !isNaN(props.x) ? Math.round(props.x) : 'unset',
        bottom: typeof props.y === 'number' && !isNaN(props.y) ? Math.round(props.y) : 'unset'
    };

    let className = 'seat';
    if (props.implicit) {
        className += ' seat--implicit';
    }
    if (isOccupied) {
        className += ' seat--occupied';
    }
    else if (isOver && dragInProgress) {
        className += ' seat--drop-hover';
    }

    const seatNumberDisplay = props.seatNumber > -1 ? props.seatNumber + 1 : null;

    return <span className={className}
        ref={isOccupied ? dragRef : dropRef}
        data-seat-number={seatNumberDisplay}
        style={style} onClick={props.onClick}>
        {props.children}
    </span>
}

export default Seat;
