import { loadFirebase } from 'helpers/functions.js';

import React, { PureComponent } from 'react';
import CountUp from 'react-countup';

export class AccountInfo extends PureComponent {
  state = {
    totalMerits: 0,
    previousTotalMerits: 0,
  }

  componentDidMount() {
    if (navigator.onLine) {
      loadFirebase('database')
      .then(() => {
        const { firebase } = window;
        const { displayName } = this.props.user;
        const userRef = firebase.database().ref('/users/' + displayName);

        userRef.on('value', (user) => {
          const { totalMerits } = user.val();

          localStorage.setItem('totalMerits', totalMerits);
          this.setState({
            totalMerits: totalMerits,
            previousTotalMerits: this.state.totalMerits
          });
        });
      });
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
        <img id="sidebar-photo" src={photoURL} alt="User" />
        <h3 id="account-name">{name}</h3>
        <h4>
          <CountUp
            className="total-merits"
            start={this.state.previousTotalMerits}
            end={this.state.totalMerits}
            useEasing
          />
          merits {status !== 'pledge' && 'merited'}
        </h4>
      </div>
    )
  }
}
