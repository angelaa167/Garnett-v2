import sortChalkboards from './helpers/sortChalkboards.js';
import { FilterHeader } from 'components';
import { PlaceholderMerit } from 'components/Placeholders';

import React from 'react';
import LazyLoad from 'react-lazyload';
import Avatar from 'material-ui/Avatar';
import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';
import IconButton from 'material-ui/IconButton';

export default function AllChalkboards({
  upcomingChalkboards,
  completedChalkboards,
  filter,
  openPopover,
  reverse,
  reverseChalkboards,
  handleOpen,
  filterCount
}) {
  let upcomingChalkboards = sortChalkboards(upcomingChalkboards, filter);
  let completedChalkboards = sortChalkboards(completedChalkboards, filter);
  let label;

  if (reverse) {
    upcomingChalkboards = upcomingChalkboards.slice().reverse();
    completedChalkboards = completedChalkboards.slice().reverse();
  }

  if (filter === 'amount') {
    label = 'merits';
  }
  else if (filter === 'attendees') {
    label = 'attendees';
  }

  return (
    <div id="all-chalkboards">
      <FilterHeader
        title="Upcoming"
        openPopover={openPopover}
        isReversed={reverse}
        reverse={reverseChalkboards}
      />

      <List className="garnett-list">
        {upcomingChalkboards.map((chalkboard, i) => (
          <LazyLoad
            height={88}
            offset={window.innerHeight}
            once
            overflow
            key={i}
            placeholder={PlaceholderMerit()}
          >
            <div>
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
                onClick={() => handleOpen(chalkboard, 'upcoming')}
              >
                <p className="garnett-date"> 
                  {filterCount(chalkboard, filter)} {label}
                </p>
              </ListItem>
              <Divider className="garnett-divider large" inset={true} />
            </div>
          </LazyLoad>
        ))}
      </List>

      <Divider className="garnett-subheader" />

      <Subheader className="garnett-subheader"> Completed </Subheader>
      <List className="garnett-list">
        {completedChalkboards.map((chalkboard, i) => (
          <LazyLoad
            height={88}
            offset={window.innerHeight}
            once
            overflow
            key={i}
            placeholder={PlaceholderMerit()}
          >
            <div>
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
                onClick={() => handleOpen(chalkboard, 'completed')}
              >
                <p className="garnett-date">
                  {filterCount(chalkboard, filter)} {label}
                </p>
              </ListItem>
              <Divider className="garnett-divider large" inset={true} />
            </div>
          </LazyLoad>
        ))}
      </List>
    </div>
  )
}
