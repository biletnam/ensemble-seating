import React, { PureComponent } from 'react';

import { IconButton } from '@rmwc/icon-button';
import { Button, ButtonIcon } from '@rmwc/button';
import { Elevation } from '@rmwc/elevation';
import { Ripple } from '@rmwc/ripple';

import '@material/icon-button/dist/mdc.icon-button.min.css';
import '@material/button/dist/mdc.button.min.css';
import '@material/elevation/dist/mdc.elevation.min.css';
import '@material/ripple/dist/mdc.ripple.min.css';

import ListActionMenu from './list-action-menu.jsx';
import SectionListItem from './section-list-item.jsx';
import MoreIcon from '../icons/more_vert-24px.svg';
import AddIcon from '../icons/add-24px.svg';

import { Droppable } from 'react-beautiful-dnd';

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
            this.props.onRequestNewSection(this.props.region.id);
    }

    handleActionMenuClick(action) {
        if (action === 'delete' && typeof this.props.onRequestDeleteRegion === 'function')
            this.props.onRequestDeleteRegion(this.props.region.id);
        else if (typeof this.props.onRequestMoveRegion === 'function') {
            const splitAction = action.split('-');
            this.props.onRequestMoveRegion(this.props.region.id, splitAction[splitAction.length - 1]);
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
        return <Droppable droppableId={this.props.region.id} type='section'>
            {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className='roster__droppable-section-area'>
                    {/* Iterate over sections here */}
                    <Ripple>
                    <Elevation z='1'
                        className='roster__region-heading-container'
                        onClick={() => this.props.onRequestSelectMember(this.props.region.id)}>
                        <span className='roster__region-heading-text'>{this.props.region.name}</span>
                        {this.props.showEditAndDeleteControls && <ListActionMenu
                            onSelectAction={this.handleActionMenuClick}
                            open={this.state.actionMenuOpen}
                            onClose={this.handleRequestCloseActionMenu}>
                            <IconButton icon={<MoreIcon />} label='Edit region' onClick={this.handleRequestToggleActionMenu} />
                        </ListActionMenu>}
                    </Elevation></Ripple>
                    {this.props.sections.map((currentSection, currentIndex) => {
                        return <SectionListItem key={currentSection.id}
                            data={currentSection}
                            index={currentIndex}
                            members={this.props.members.filter(currentMember => currentMember.section === currentSection.id)}
                            onRequestNewPerson={this.props.onRequestNewPerson}
                            onRequestBatchAdd={this.props.onRequestBatchAdd}
                            onRequestShuffle={this.props.onRequestShuffleSection}
                            onRequestSelectMember={this.props.onRequestSelectMember} />
                    })}
                    
                    {provided.placeholder}

                    {this.props.forceNewSectionButton && <div className='section-list-item'>
                        <Button onClick={this.handleClickedNewSection} raised><ButtonIcon icon={<AddIcon />} /> New section</Button>
                    </div>}
                </div>
            )}
        </Droppable>
    }
}

export default RegionListItem;
