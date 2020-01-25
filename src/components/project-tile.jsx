import React, {PureComponent} from 'react';
import ProjectThumbnail from './project-thumbnail.jsx';

import './project-tile.css';

class ProjectTile extends PureComponent {
    render() {
        const {title, id, data, onClick, ...rest} = this.props;
        
        return <button type='button' {...rest}
            className='project-tile' onClick={() => onClick(id)}>
            <ProjectThumbnail data={data} />
            <span>{title}</span>
        </button>;
    }
}

export default ProjectTile;
