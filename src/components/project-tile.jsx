import React, {PureComponent} from 'react';
import ProjectThumbnail from './project-thumbnail.jsx';

import './project-tile.css';

class ProjectTile extends PureComponent {
    render() {
        const regionData = JSON.parse(JSON.stringify(this.props.data.regions));
        if (this.props.data.settings.downstageTop)
            regionData.reverse();
        
        return <button type='button' {...this.props}
            className='project-tile'>
            <ProjectThumbnail data={Object.assign({}, this.props.data, {regions: regionData})} />
            <span>{this.props.title}</span>
        </button>;
    }
}

export default ProjectTile;
