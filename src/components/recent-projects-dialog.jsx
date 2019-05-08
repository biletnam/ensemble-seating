import React, { PureComponent } from 'react';

import ProjectList from './project-list.jsx';

import { SimpleDialog } from '@rmwc/dialog';
import '@material/dialog/dist/mdc.dialog.min.css';

class RecentProjectsDialog extends PureComponent {
    constructor (props) {
        super(props);
        this.state = {
            lastShown: Date.now()
        };
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.open && !prevProps.open)
            this.setState({lastShown: Date.now()});
    }

    render() {
        return <SimpleDialog open={this.props.open} onClose={this.props.onClose}
            title='Recent projects'
            body={<ProjectList user={this.props.user} onProjectItemClick={this.props.onRequestOpenProject} lastUpdated={this.state.lastShown} />}
            acceptLabel={null} />;
    }
    
};

export default RecentProjectsDialog;
