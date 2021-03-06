// @flow

import { rusheeInfo} from '../data.js';

import React from 'react';
import { List, ListItem } from 'material-ui/List';
import Divider from 'material-ui/Divider';

export function RusheeInfo(props: { rushee: Object }) {
  return (
    <List className="garnett-list">
      {rusheeInfo.map((info, i) => (
        <div key={i}>
          <Divider />
          <ListItem
            className="garnett-list-item rushee long"
            primaryText={info.label}
            secondaryText={props.rushee[info.value]}
          />
          <Divider />
        </div>
      ))}
    </List>
  )
}
