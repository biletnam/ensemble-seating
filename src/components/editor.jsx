import React from 'react';

import RegionEditor from './edit-region.jsx';
import SectionEditor from './edit-section.jsx';
import MemberEditor from './edit-member.jsx';
import Sidebar from './sidebar.jsx';
import { isRegion, isSection, isMember } from '../helpers/project-helpers';

function getEditorType(data) {
    if (data) {
        if (isRegion(data))
            return 'region';
        else if (isSection(data))
            return 'section';
        else if (isMember(data))
            return 'member';
    }
}

const Editor = props => {
    let { data, ...rest } = props;

    const type = getEditorType(data);

    let Control;
    if (type == 'region')
        Control = RegionEditor;
    else if (type == 'section')
        Control = SectionEditor;
    else if (type == 'member')
        Control = MemberEditor;

    function handleEdit(editorId, newData) {
        if (type == 'region')
            props.onEditRegion(editorId, newData);
        else if (type == 'section')
            props.onEditSection(editorId, newData);
        else if (type == 'member')
            props.onEditMember(editorId, newData);
    }

    return <Sidebar {...rest} id='editor' title={type ? `Edit ${type}` : `Editor`}>
        {Control && <Control onRequestEdit={handleEdit} data={data} id='editor__content' />}
        {!Control && <p id='editor__content'>Select a region, section, or section member to edit their details</p>}
    </Sidebar>
}

export default Editor;
