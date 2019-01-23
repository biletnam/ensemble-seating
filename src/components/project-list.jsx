import React, { PureComponent } from 'react';

import { ListItem, ListGroup } from '@rmwc/list';
import '@material/list/dist/mdc.list.css';

import { listProjects } from '../helpers/project-helpers.js';

class ProjectList extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            projects: []
        }
        this.handleListItemClick = this.handleListItemClick.bind(this);
    }

    componentDidMount() {
        this.updateProjectList();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.lastUpdated !== prevProps.lastUpdated) {
            console.log("Updating project list...");
            this.updateProjectList();
        }
            
    }

    updateProjectList() {
        if (this.props.user) {
            listProjects(this.props.user).then(projects => {
                if (projects)
                    this.setState({projects});
            });
        }
    }

    handleListItemClick (event) {
        this.props.onProjectItemClick(event.target.dataset.project);
    }

    render() {
        return <ListGroup>
            {this.state.projects.map(project => (
                <ListItem key={project}
                    data-project={project}
                    onClick={this.handleListItemClick}>
                        {project}
                    </ListItem>
            ))}
        </ListGroup>
    }
} 

export default ProjectList;
