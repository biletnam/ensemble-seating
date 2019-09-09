import React, {Component} from 'react';

import './toolbar.css';

import { Toolbar, ToolbarRow, ToolbarSection, ToolbarTitle, ToolbarMenuIcon, ToolbarIcon } from '@rmwc/toolbar';
import '@material/toolbar/dist/mdc.toolbar.min.css';

import { Button } from '@rmwc/button';
import '@material/button/dist/mdc.button.css';

import InlineInput from './inline-input.jsx';
import ToolbarDivider from './toolbar-divider.jsx';
import ToolbarLink from './toolbar-link.jsx';

import MenuIcon from '../icons/baseline-menu-24px.jsx';
import FeedbackIcon from '../icons/baseline-feedback-24px.jsx';
import HorizontalSplitIcon from '../icons/baseline-horizontal_split-24px.jsx';
import RotateIcon from '../icons/baseline-rotate_90_degrees_ccw-24px.jsx';
import MenuOpenIcon from '../icons/baseline-menu_open-24px.jsx';
import MoreIcon from '../icons/baseline-more_vert-24px.jsx';

const MainToolbar = props => (
    <Toolbar id={props.id}>
        <ToolbarRow>
            <ToolbarSection alignStart>
                <ToolbarMenuIcon tag='button'
                    name='menu'
                    title='Menu'
                    icon={<MenuIcon />}
                    onClick={props.onToolbarButtonClick} />
                <ToolbarTitle>
                    <InlineInput value={props.projectName} placeholder='Untitled project' onChange={props.onRequestRenameProject} autosaveTimeout={10000} />
                </ToolbarTitle>
            </ToolbarSection>

            <ToolbarSection alignEnd>
                <ToolbarLink href={APP_INFO.FEEDBACK} icon={<FeedbackIcon />}>Send feedback</ToolbarLink>

                <ToolbarDivider />

                <ToolbarIcon tag='button'
                    name='region'
                    title='Create new region'
                    icon={<HorizontalSplitIcon />}
                    onClick={props.onToolbarButtonClick} />

                <ToolbarIcon tag='button'
                    name='sort'
                    title={props.downstageTop ? 'Downstage top' : 'Downstage bottom'}
                    icon={<RotateIcon />}
                    style={{transform: props.downstageTop ? 'rotate(90deg)' : 'rotateZ(-90deg)'}}
                    onClick={props.onToolbarButtonClick} />

                <ToolbarIcon tag='button'
                    name='roster'
                    title={props.rosterOpen ? 'Close roster' : 'Open roster'}
                    icon={<MenuOpenIcon />}
                    style={{transform: props.rosterOpen ? 'rotateZ(180deg)' : ''}}
                    id='toolbar__toggle-roster-button'
                    onClick={props.onToolbarButtonClick}
                     />

                <ToolbarIcon tag='button'
                    name='project-settings'
                    title='Project settings'
                    icon={<MoreIcon />}
                    onClick={props.onToolbarButtonClick} />
            </ToolbarSection>
        </ToolbarRow>
    </Toolbar>
);

export default MainToolbar;
