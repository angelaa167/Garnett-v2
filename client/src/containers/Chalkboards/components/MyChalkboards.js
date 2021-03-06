import sortChalkboards from './helpers/sortChalkboards.js';
import { FilterHeader } from 'components';

import React from 'react';
import Avatar from 'material-ui/Avatar';
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import IconButton from 'material-ui/IconButton';
import Subheader from 'material-ui/Subheader';

export default function MyChalkboards({
  myHostingChalkboards,
  myAttendingChalkboards,
  myCompletedChalkboards,
  state,
  reverse,
  filter,
  openPopover,
  reverseChalkboards,
  handleOpen,
  filterCount
}) {
  let myHostingChalkboards = sortChalkboards(myHostingChalkboards, filter);
  let myAttendingChalkboards = sortChalkboards(myAttendingChalkboards, filter);
  let myCompletedChalkboards = sortChalkboards(myCompletedChalkboards, filter);
  let label;

  if (reverse) {
    myHostingChalkboards = myHostingChalkboards.slice().reverse();
    myAttendingChalkboards = myAttendingChalkboards.slice().reverse();
    myCompletedChalkboards = myCompletedChalkboards.slice().reverse();
  }

  if (filter === 'amount') {
    label = 'merits';
  }
  else if (filter === 'attendees') {
    label = 'attendees';
  }

  return (
    <div id="my-chalkboards" className="active">
      {state.status !== 'pledge' && (
        <div>
          <FilterHeader
            title="Hosting"
            openPopover={openPopover}
            isReversed={reverse}
            reverse={reverseChalkboards}
          />

          <List className="garnett-list">
            {myHostingChalkboards.map((chalkboard, i) => (
              <div key={i}>
                <Divider className="garnett-divider large" inset={true} />
                <ListItem
                  className="garnett-list-item large"
                  leftAvatar={<Avatar className="garnett-image large" size={70} src={chalkboard.photoURL} />}
                  primaryText={
                    <p className="garnett-name"> {chalkboard.title} </p>
                  }
                  secondaryText={
                    <p className="garnett-description">
                      {chalkboard.description}
                    </p>
                  }
                  secondaryTextLines={2}
                  onClick={() => handleOpen(chalkboard, 'hosting')}
                >
                  <p className="garnett-date">
                    {filterCount(chalkboard, filter)} {label}
                  </p>
                </ListItem>
                <Divider className="garnett-divider large" inset={true} />
              </div>
            ))}
          </List>

          <Divider className="garnett-subheader" />
        </div>
      )}

      <FilterHeader
        title="Attending"
        openPopover={state.status === 'pledge' && openPopover}
        isReversed={state.status === 'pledge' && reverse}
        reverse={state.status === 'pledge' && reverseChalkboards}
      />
      
      <List className="garnett-list">
        {myAttendingChalkboards.map((chalkboard, i) => (
          <div key={i}>
            <Divider className="garnett-divider large" inset={true} />
            <ListItem
              className="garnett-list-item large"
              leftAvatar={<Avatar className="garnett-image large" size={70} src={chalkboard.photoURL} />}
              primaryText={
                <p className="garnett-name"> {chalkboard.title} </p>
              }
              secondaryText={
                <p className="garnett-description">
                  {chalkboard.description}
                </p>
              }
              secondaryTextLines={2}
              onClick={() => handleOpen(chalkboard, 'attending')}
            >
              <p className="garnett-date">
                {filterCount(chalkboard, filter)} {label}
              </p>
            </ListItem>
            <Divider className="garnett-divider large" inset={true} />
          </div>
        ))}
      </List>

      <Divider className="garnett-subheader" />

      <Subheader className="garnett-subheader"> Completed </Subheader>
      <List className="garnett-list">
        {myCompletedChalkboards.map((chalkboard, i) => (
          <div key={i}>
            <Divider className="garnett-divider large" inset={true} />
            <ListItem
              className="garnett-list-item large"
              leftAvatar={<Avatar className="garnett-image large" size={70} src={chalkboard.photoURL} />}
              primaryText={
                <p className="garnett-name"> {chalkboard.title} </p>
              }
              secondaryText={
                <p className="garnett-description">
                  {chalkboard.description}
                </p>
              }
              secondaryTextLines={2}
              onClick={() => handleOpen(chalkboard, 'attending')}
            >
              <p className="garnett-date">
                {filterCount(chalkboard, filter)} {label}
              </p>
            </ListItem>
            <Divider className="garnett-divider large" inset={true} />
          </div>
        ))}
      </List>
    </div>
  )
}
