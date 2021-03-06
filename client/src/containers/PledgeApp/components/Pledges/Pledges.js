// @flow

import './Pledges.css';

import API from 'api/API.js';
import {
  androidBackOpen,
  androidBackClose,
  iosFullscreenDialogOpen,
  iosFullscreenDialogClose,
  setRefresh
} from 'helpers/functions.js';
import { LoadingComponent } from 'helpers/loaders.js';
import { Filter, FilterHeader, UserRow } from 'components';
import { LoadablePledgeInfoDialog } from './components/Dialogs';
import type { User } from 'api/models';

import React, { PureComponent, type Node } from 'react';
import { List } from 'material-ui/List';

const FILTER_OPTIONS = [
  'Last Name',
  'First Name',
  'Year',
  'Major',
  'Total Merits',
  'Completed Interviews'
];

function sortPledges(pledges: Array<User>, filter: string): Array<User> {
  if (filter === 'totalMerits' || filter === 'completedInterviews') {
    pledges = pledges.sort(function(a, b) {
      return a[filter] < b[filter] ? 1 : -1;
    });
  } else {
    pledges = pledges.sort(function(a, b) {
      return a[filter] >= b[filter] ? 1 : -1;
    });
  }
  return pledges;
}

type Props = {
  state: User,
  handleRequestOpen: () => void
};

type State = {
  pledges: ?Array<User>,
  pledge: ?User,
  filter: string,
  reverse: boolean,
  openPledge: boolean,
  openPopover: boolean,
  anchorEl: ?HTMLDivElement
};

export class Pledges extends PureComponent<Props, State> {
  constructor(props) {
    super(props);
    const pledges = JSON.parse(localStorage.getItem('pledges'));
    const filter = localStorage.getItem('pledgesFilter') || 'lastName';
    this.state = {
      pledges: pledges ? sortPledges(pledges, filter) : null,
      pledge: null,
      filter,
      reverse: false,
      openPledge: false,
      openPopover: false,
      anchorEl: null
    };
  }

  componentDidMount() {
    if (navigator.onLine) {
      setRefresh(this.fetchPledges);
      this.fetchPledges();
    }
  }

  componentWillUnmount() {
    const firebase = window.firebase;
    if (navigator.onLine && firebase) {
      const meritsRef = firebase.database().ref('/merits');
      meritsRef.off('value');
    }
  }

  get pledges(): Node {
    const { pledges, filter } = this.state;
    if (!pledges) {
      return (
        <div className="no-items-container">
          <h1 className="no-items-found">No pledges found</h1>
        </div>
      )
    }
    return (
      <List className="garnett-list">
        {pledges.map((pledge, i) => {
          let pledgeValue;
          if (filter === 'completedInterviews') {
            pledgeValue = pledge.completedInterviews;
          } else {
            pledgeValue = pledge.totalMerits;
          }
          return (
            <UserRow
              key={i}
              user={pledge}
              value={pledgeValue}
              handleOpen={() => this.handleOpen(pledge)}
            />
          )
        })}
      </List>
    )
  }

  get filterLabel(): string {
    switch (this.state.filter) {
      case 'lastName':
        return 'Last Name';
      case 'firstName':
        return 'First Name';
      case 'year':
        return 'Year';
      case 'major':
        return 'Major';
      case 'totalMerits':
        return 'Total Merits';
      case 'completedInterviews':
        return 'Completed Interviews';
      default:
        return ''
    }
  }

  fetchPledges = () => {
    API.getPledges(this.props.state.displayName)
    .then(res => {
      const { filter } = this.state;
      const pledges = sortPledges(res.data, filter);
      localStorage.setItem('pledges', JSON.stringify(pledges));
      this.setState({ pledges });
    })
    .catch(error => {
      console.error(`Error: ${error}`);
      localStorage.setItem('pledges', '[]');
      this.setState({ pledges: [] });
    });
  }

  handleOpen = (pledge: User) => {
    iosFullscreenDialogOpen();
    androidBackOpen(this.handleClose);
    this.setState({ pledge, openPledge: true });
  }

  handleClose = () => {
    androidBackClose();
    this.setState({ openPledge: false }, () => {
      iosFullscreenDialogClose();
    });
  }

  openPopover = (event: SyntheticEvent<>) => {
    // This prevents ghost click.
    event.preventDefault();
    this.setState({
      openPopover: true,
      anchorEl: event.currentTarget
    });
  };

  closePopover = () => this.setState({ openPopover: false });

  setFilter = (filterName: string) => {
    let { pledges } = this.state;
    let filter = filterName.replace(/ /g, '');
    // Convert first letter of filter to be lower cased
    filter = filter[0].toLowerCase() + filter.substr(1);

    pledges = sortPledges(pledges, filter);

    localStorage.setItem('pledgesFilter', filter);
    this.setState({
      pledges,
      filter,
      reverse: false,
      openPopover: false
    });
  }

  reverse = () => {
    const { pledges, reverse } = this.state;
    const reversedPledges = pledges && pledges.reverse();
    this.setState({ pledges: reversedPledges, reverse: !reverse });
  }

  render() {
    const { state } = this.props;
    const {
      pledges,
      pledge,
      reverse,
      openPledge,
      openPopover,
      anchorEl
    } = this.state;

    if (!pledges) {
      return <LoadingComponent />
    }

    return (
      <div className="content animate-in">
        <FilterHeader
          title={state.status === 'pledge' ? 'Pledge Brothers' : 'Pledges'}
          status={state.status}
          openPopover={this.openPopover}
          isReversed={reverse}
          reverse={this.reverse}
        />

        { this.pledges }

        {pledge && (
          <LoadablePledgeInfoDialog
            open={openPledge}
            state={state}
            pledge={pledge}
            handleClose={this.handleClose}
            handleRequestOpen={this.props.handleRequestOpen}
          />
        )}
        <Filter
          open={openPopover}
          anchorEl={anchorEl}
          filters={FILTER_OPTIONS}
          filterName={this.filterLabel}
          closePopover={this.closePopover}
          setFilter={this.setFilter}
        />
      </div>
    )
  }
}
