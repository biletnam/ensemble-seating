import React from 'react';

import RegionEditor from './edit-region.jsx';
import SectionEditor from './edit-section.jsx';
import MemberEditor from './edit-member.jsx';
import Sidebar from './sidebar.jsx';
import { Region, Section, Member } from '../helpers/project-helpers';

const Editor = props => {
    let { 
        data,
        onEditRegion,
        onEditSection,
        onEditMember,
        onRequestDeleteRegion,
        onRequestDeleteSection,
        onRequestDeleteMember,
        ...rest 
    } = props;

    let Control, friendlyName;
    if (data instanceof Region) {
        Control = RegionEditor;
        friendlyName = 'region';
    }
    else if (data instanceof Section) {
        Control = SectionEditor;
        friendlyName = 'section';
    }
    else if (data instanceof Member) {
        Control = MemberEditor;
        friendlyName = 'section member';
    }

    function handleEdit(editorId, newData) {
        if (data instanceof Region)
            onEditRegion(editorId, newData);
        else if (data instanceof Section)
            onEditSection(editorId, newData);
        else if (data instanceof Member)
            onEditMember(editorId, newData);
    }

    function handleDelete() {
        if (data instanceof Region)
            onRequestDeleteRegion(data.id);
        else if (data instanceof Section)
            onRequestDeleteSection(data.id);
        else if (data instanceof Member)
            onRequestDeleteMember(data.id);
    }

    return <Sidebar {...rest} id='editor' title={`Edit ${friendlyName}`} onClickedDelete={!(data instanceof Region && !onRequestDeleteRegion) && handleDelete}>
        {Control && <Control onRequestEdit={handleEdit} data={data} id='editor__content' />}
    </Sidebar>
}

export default Editor;
