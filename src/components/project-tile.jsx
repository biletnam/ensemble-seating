import React, {PureComponent} from 'react';
import ProjectThumbnail from './project-thumbnail.jsx';

import './project-tile.css';

class ProjectTile extends PureComponent {
    render() {
        const regionData = JSON.parse(JSON.stringify(this.props.data.regions));
        const regionEntries = Object.entries(regionData);
        if (!this.props.data.settings.downstageTop)
            regionEntries.reverse();
        
        return <button type='button' {...this.props}
            className='project-tile'>
            <ProjectThumbnail data={Object.assign({}, this.props.data, {regions: Object.fromEntries(regionEntries)})} />
            <span>{this.props.title}</span>
        </button>;
    }
}

export default ProjectTile;
