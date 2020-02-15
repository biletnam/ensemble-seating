import React, { PureComponent } from 'react';

import { IconButton } from '@rmwc/icon-button';
import { Button, ButtonIcon } from '@rmwc/button';
import { Elevation } from '@rmwc/elevation';

import '@material/icon-button/dist/mdc.icon-button.min.css';
import '@material/button/dist/mdc.button.min.css';
import '@material/elevation/dist/mdc.elevation.min.css';

import ListActionMenu from './list-action-menu.jsx';
import SectionListItem from './section-list-item.jsx';
import MoreIcon from '../icons/more_vert-24px.svg';
import AddIcon from '../icons/add-24px.svg';

import { Droppable } from 'react-beautiful-dnd';

import SidebarTitlebarButton from './sidebar-titlebar-button.jsx';

class RegionListItem extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            actionMenuOpen: false
        };

        this.handleClickedNewSection = this.handleClickedNewSection.bind(this);
        this.handleActionMenuClick = this.handleActionMenuClick.bind(this);
        this.handleRequestToggleActionMenu = this.handleRequestToggleActionMenu.bind(this);
        this.handleRequestCloseActionMenu = this.handleRequestCloseActionMenu.bind(this);
    }

    handleClickedNewSection() {
        if (typeof this.props.onRequestNewSection === 'function')
            this.props.onRequestNewSection(this.props.regionId);
    }

    handleActionMenuClick(action) {
        if (action === 'delete' && typeof this.props.onRequestDeleteRegion === 'function')
            this.props.onRequestDeleteRegion(this.props.regionId);
        else if (action === 'settings')
            this.props.onRequestSelectMember(this.props.regionId)
        else if (typeof this.props.onRequestMoveRegion === 'function') {
            const splitAction = action.split('-');
            this.props.onRequestMoveRegion(this.props.regionId, splitAction[splitAction.length - 1]);
        }
        this.setState({actionMenuOpen: false});
    }

    handleRequestToggleActionMenu(event) {
        event.stopPropagation();
        this.setState({actionMenuOpen: !this.state.actionMenuOpen})
    }

    handleRequestCloseActionMenu() {
        this.setState({actionMenuOpen: false});
    }

    render() {
        return <Droppable droppableId={this.props.regionId} type='section'>
            {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className='roster__droppable-section-area'>
                    {/* Iterate over sections here */}
                    <Elevation z='1'
                        className='roster__region-heading-container'>
                        <span className='roster__region-heading-text'>{this.props.region.name}</span>
                        <ListActionMenu
                            moveToTop={this.props.enableMoveAndDeleteControls ? true : null}
                            moveUp={this.props.enableMoveAndDeleteControls ? true : null}
                            moveDown={this.props.enableMoveAndDeleteControls ? true : null}
                            moveToBottom={this.props.enableMoveAndDeleteControls ? true : null}
                            deleteItem={this.props.enableMoveAndDeleteControls ? true : null}
                            settings
                            onSelectAction={this.handleActionMenuClick}
                            open={this.state.actionMenuOpen}
                            onClose={this.handleRequestCloseActionMenu}>
                            <SidebarTitlebarButton icon={<MoreIcon />} label='Edit region' onClick={this.handleRequestToggleActionMenu} />
                        </ListActionMenu>
                    </Elevation>
                    {Object.entries(this.props.sections).map(([sectionId, currentSection], currentIndex) => {
                        return <SectionListItem key={sectionId}
                            data={currentSection}
                            sectionId={sectionId}
                            index={currentIndex}
                            members={Object.fromEntries(
                                Object.entries(this.props.members)
                                .filter(([, currentMember]) => currentMember.section === sectionId)
                            )}
                            onRequestNewPerson={this.props.onRequestNewPerson}
                            onRequestEditPerson={this.props.onRequestEditPerson}
                            onRequestBatchAdd={this.props.onRequestBatchAdd}
                            onRequestDelete={this.props.onRequestDeleteSection}
                            onRequestShuffle={this.props.onRequestShuffleSection}
                            onRequestSelectMember={this.props.onRequestSelectMember}
                            onRequestMoveMember={this.props.onRequestMoveMember}
                            onRequestDeleteMember={this.props.onRequestDeleteMember} />
                    })}
                    
                    {provided.placeholder}

                    <div className='section-list-item'>
                        {Object.keys(this.props.sections).length === 0 && <p>No sections to display</p>}
                        <Button dense onClick={this.handleClickedNewSection} raised><ButtonIcon icon={<AddIcon />} /> New section</Button>
                    </div>
                </div>
            )}
        </Droppable>
    }
}

export default RegionListItem;
