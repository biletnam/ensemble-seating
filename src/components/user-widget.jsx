import React from 'react'
import './user-widget.css';

const UserWidget = props => {
    return <div className='user-widget'>
        <img className='user-widget__thumbnail' src={props.thumbnail} alt={`${props.displayName} profile picture`} width='50' />
        <span className='user-widget__display-name'>{props.displayName}</span>
        <span className='user-widget__email'>{props.email}</span>
    </div>
}

export default UserWidget;