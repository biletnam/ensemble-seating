import React from 'react';

import './sidebar.css';

import SidebarTitle from './sidebar-title.jsx';

const Sidebar = props => {
    const { title, onClickedBack, children, ...rest } = props;
    let className = 'sidebar';

    if (!props.expanded)
        className += ` sidebar--collapsed`;

    return <aside {...rest} className={className}>
        <SidebarTitle onClickedBack={onClickedBack}>{title || 'Sidebar'}</SidebarTitle>
        <div className='sidebar__scrollable-container'>
            {children}
        </div>
    </aside>
}

export default Sidebar;
