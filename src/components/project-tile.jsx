import React, {PureComponent} from 'react';
import ProjectThumbnail from './project-thumbnail.jsx';

import './project-tile.css';

class ProjectTile extends PureComponent {
    render() {
        const {title, data, ...rest} = this.props;
        
        return <button type='button' {...rest}
            className='project-tile'>
            <ProjectThumbnail data={data} />
            <span>{title}</span>
        </button>;
    }
}

export default ProjectTile;
