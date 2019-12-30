import React from 'react';

import './sidebar.css';
import SidebarTitle from './sidebar-title.jsx';
import SidebarToggleButton from './sidebar-toggle-button.jsx';

const Sidebar = props => {
    const { title, onToggleSidebar, onClickedBack, onClickedDelete, expanded, children, scrollableContainerRef, ...rest } = props;
    let className = 'sidebar';

    if (!expanded)
        className += ` sidebar--collapsed`;

    return (
        <aside {...rest} className={className}>
            <div className='sidebar__content'>
                <SidebarTitle onClickedBack={onClickedBack} onClickedDelete={onClickedDelete}>
                    {title || 'Sidebar'}
                </SidebarTitle>
                <div className='sidebar__scrollable-container' ref={scrollableContainerRef}>
                    {children}
                </div>
            </div>
            <SidebarToggleButton offset={expanded} onClick={onToggleSidebar} />
        </aside>
    );
}

export default Sidebar;
