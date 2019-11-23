import React from 'react';

import './toolbar.css';

import { TopAppBar, TopAppBarRow, TopAppBarSection, TopAppBarTitle, TopAppBarActionItem, TopAppBarNavigationIcon } from '@rmwc/top-app-bar';
import '@material/top-app-bar/dist/mdc.top-app-bar.css';

import TimeAgo from 'react-timeago';

import InlineInput from './inline-input.jsx';
import ToolbarDivider from './toolbar-divider.jsx';
import ToolbarLink from './toolbar-link.jsx';

import MenuIcon from '../icons/menu-24px.svg';
import FeedbackIcon from '../icons/feedback-24px.svg';
import HorizontalSplitIcon from '../icons/horizontal_split-24px.svg';
import RotateIcon from '../icons/rotate_90_degrees_ccw-24px.svg';
import MenuOpenIcon from '../icons/menu_open-24px.svg';
import MoreIcon from '../icons/more_vert-24px.svg';

const MainToolbar = props => (
    <TopAppBar id={props.id} dense>
        <TopAppBarRow>
            <TopAppBarSection alignStart>
                <TopAppBarNavigationIcon tag='button'
                    name='menu'
                    title='Menu'
                    icon={<MenuIcon />}
                    onClick={props.onToolbarButtonClick} />
                <TopAppBarTitle>
                    <InlineInput value={props.projectName} placeholder='Untitled project' onChange={props.onRequestRenameProject} autosaveTimeout={10000} />
                    <div className='toolbar__last-saved'>
                        {props.saving && 'Saving…'}
                        {props.lastSave && !props.saving && <>Saved <TimeAgo date={props.lastSave} minPeriod={10} /></>}
                        {!props.lastSave && !props.saving && 'Not saved'}
                    </div>
                </TopAppBarTitle>
            </TopAppBarSection>

            <TopAppBarSection alignEnd>
                <ToolbarLink href={APP_INFO.FEEDBACK} icon={<FeedbackIcon />}>Send feedback</ToolbarLink>

                <ToolbarDivider />

                <TopAppBarActionItem tag='button'
                    name='region'
                    title='Create new region'
                    icon={<HorizontalSplitIcon />}
                    onClick={props.onToolbarButtonClick} />

                <TopAppBarActionItem tag='button'
                    name='sort'
                    title={props.downstageTop ? 'Downstage top' : 'Downstage bottom'}
                    icon={<RotateIcon />}
                    style={{transform: props.downstageTop ? 'rotate(90deg)' : 'rotateZ(-90deg)'}}
                    onClick={props.onToolbarButtonClick} />

                <TopAppBarActionItem tag='button'
                    name='roster'
                    title={props.rosterOpen ? 'Close roster' : 'Open roster'}
                    icon={<MenuOpenIcon />}
                    style={{transform: props.rosterOpen ? 'rotateZ(180deg)' : ''}}
                    id='toolbar__toggle-roster-button'
                    onClick={props.onToolbarButtonClick}
                     />

                <TopAppBarActionItem tag='button'
                    name='project-settings'
                    title='Project settings'
                    icon={<MoreIcon />}
                    onClick={props.onToolbarButtonClick} />
            </TopAppBarSection>
        </TopAppBarRow>
    </TopAppBar>
);

export default MainToolbar;
