import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';

import Seat from './seat.jsx';
import { getInitials } from '../helpers/stage.js';
import { Drag as DragTypes, Member } from '../types';

import './stage.css';

const Stage = props => {
    const [{ isOver }, dropRef] = useDrop({
        accept: DragTypes.SEAT,
        drop: (item, monitor) => {
            if (monitor.isOver() && monitor.isOver({ shallow: false })) {
                const dropOffset = monitor.getClientOffset();
                const initialSourceClientOffset = monitor.getInitialSourceClientOffset();
                const initialClientOffset = monitor.getInitialClientOffset();

                const xOffset = initialClientOffset.x - initialSourceClientOffset.x;
                const yOffset = initialClientOffset.y - initialSourceClientOffset.y;

                const originRect = innerRef.current.getBoundingClientRect();
                const modifier = props.settings.downstageTop ? -1 : 1;
                const innerCenterX = originRect.left + (props.origin.x);
                const innerBottomY = originRect.top + (props.settings.downstageTop ? 0 : originRect.height);
                const relativeX = Math.round((dropOffset.x - innerCenterX) * modifier) - xOffset;
                const relativeY = Math.round((innerBottomY - dropOffset.y) * modifier) - yOffset;
                console.log(`${relativeX}, ${relativeY}`);
                if (props.onRequestMoveMemberToCoordinates) {
                    props.onRequestMoveMemberToCoordinates(item.id, relativeX, relativeY);
                }
            }
        },
        collect: monitor => ({
            isOver: monitor.isOver() && monitor.isOver({ shallow: true })
        })
    });

    const innerRef = useRef(null);

    function handleMemberSelected(memberId) {
        if (typeof props.onRequestSelectMember === 'function')
            props.onRequestSelectMember(memberId);
    }

    function handleDroppedMemberOnSeat(memberId, sectionId, index) {
        props.onRequestMoveMember && props.onRequestMoveMember(memberId, sectionId, index);
    }

    const seatElements = props.seats.map(seat => {
        /** @type {Member} */
        let memberId = seat.member,
            memberData = props.members[memberId];

        if (!(memberId && memberData)) {
            [memberId, memberData] = Object.entries(props.members)
                .find(([id, data]) => {
                    return (data.order === seat.seat) && (data.section === seat.section)
                }) || [];
        }
        
        let label = '';
        if (memberData) {
            switch (props.settings.seatNameLabels) {
                case 'initials':
                    label = getInitials(memberData.name);
                    break;
                case 'full':
                    label = memberData.name;
                    break;
            }
        }

        const key = `${seat.section}-seat-${seat.seat === -1 ? seat.member : seat.seat}`

        return <Seat key={key}
            implicit={seat.implicit}
            visible={(memberId || !seat.implicit) || props.settings.implicitSeatsVisible}
            seatNumber={seat.seat}
            color={seat.color}
            label={memberData && label}
            x={seat.x}
            y={seat.y}
            memberId={memberId}
            selected={props.editorId === memberId}
            onClick={() => handleMemberSelected(memberId)}
            onBlur={() => memberId && (label.length === 0) && props.onRequestDeleteMember(memberId)}
            onTextChange={newText => memberId ? props.onRequestEditMember(memberId, {name: newText}) : props.onRequestNewMember(seat.section, newText, seat.seat)}
            onDropMember={droppedId => handleDroppedMemberOnSeat(droppedId, seat.section, seat.seat)}>
        </Seat>;
    });

    let className = '';
    if (props.expanded) {
        className = `${props.id}--expanded`
    }

    const style = {
        '--seat-size': `${props.settings.seatSize}px`,
        '--seat-label-font-size': `${props.settings.seatLabelFontSize}px`
    };

    const innerStyle = {
        width: `${props.width}px`,
        height: `${props.height}px`
    };

    return <div id={props.id} className={className} style={style} ref={dropRef}>
        <div id='stage__inner' style={innerStyle} ref={innerRef}>
            {seatElements}
        </div>
    </div>;
}

export default Stage;
