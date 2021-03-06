// @flow

import './AccountInfo.css';
import type { User } from 'api/models';

import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import CountUp from 'react-countup';

type Props = {
  user: User
};

type State = {
  totalMerits: number,
  previousTotalMerits: number
};

export class AccountInfo extends Component<Props, State> {
  state = {
    totalMerits: 0,
    previousTotalMerits: 0
  }

  componentDidMount() {
    if (navigator.onLine) {
      const { firebase } = window;
      const { firstName, lastName, status } = this.props.user;
      const fullName = `${firstName} ${lastName}`;
      const meritsRef = firebase.database().ref('/merits');
      let queriedName = 'activeName';

      if (status === 'pledge') {
        queriedName = 'pledgeName';
      }

      const myMeritsRef = meritsRef.orderByChild(queriedName).equalTo(fullName);

      myMeritsRef.once('value', (merits) => {
        let totalMerits = 0;
        if (merits.val()) {
          merits.forEach((merit) => {
            totalMerits += merit.val().amount;
          });
        }

        localStorage.setItem('totalMerits', totalMerits);
        this.setState({
          totalMerits,
          previousTotalMerits: this.state.totalMerits
        });
      });

      myMeritsRef.on('child_added', (merit) => {
        let { totalMerits } = this.state;
        totalMerits += merit.val().amount;

        localStorage.setItem('totalMerits', totalMerits);
        this.setState({
          totalMerits,
          previousTotalMerits: this.state.totalMerits
        });
      });

      myMeritsRef.on('child_removed', (merit) => {
        let { totalMerits } = this.state;
        totalMerits -= merit.val().amount;

        localStorage.setItem('totalMerits', totalMerits);
        this.setState({
          totalMerits,
          previousTotalMerits: this.state.totalMerits
        });
      });
    } else {
      const totalMerits = localStorage.getItem('totalMerits');
      this.setState({ totalMerits, previousTotalMerits: 0 });
    }
  }

  componentWillUnmount() {
    const { firebase } = window;
    if (navigator.onLine && firebase) {
      const meritsRef = firebase.database().ref('/merits');
      meritsRef.off('child_added');
      meritsRef.off('child_removed');
    }
  }

  render() {
    const {
      name,
      status,
      photoURL
    } = this.props.user;
    return (
      <div id="account-info">
        <NavLink id="sidebar-photo-container" to="/pledge-app/settings" exact>
          <img id="sidebar-photo" src={photoURL} alt="User" />
        </NavLink>
        <h3 id="account-name">{ name }</h3>
        <h4 id="merit-count">
          <CountUp
            className="total-merits"
            start={this.state.previousTotalMerits}
            end={this.state.totalMerits}
            useEasing
          />
          merits { status !== 'pledge' && 'merited' }
        </h4>
      </div>
    )
  }
}
