// @flow

import './MyData.css';
import '../PledgingData/PledgingData.css';
import API from 'api/API.js';
import { setRefresh } from 'helpers/functions';
import { LoadingComponent } from 'helpers/loaders';

import React, { Fragment, PureComponent } from 'react';
import { ListItem } from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';

const CATEGORIES = ['Merit'];

const cachedMyData = JSON.parse(localStorage.getItem('myData'));

type Props = {
  name: string,
  photoURL: string
};

type State = {
  myData: ?Array<any>
};

export class MyData extends PureComponent<Props, State> {
  state = { myData: cachedMyData };

  componentDidMount() {
    if (navigator.onLine) {
      setRefresh(this.getMyData);
      this.getMyData();
    }
  }

  dataValue(value: { instances: number, amount: number }): Node {
    const { instances, amount } = value;
    let color = '';

    if (amount > 0) {
      color = 'green';
    } else if (amount < 0) {
      color = 'red';
    }

    return (
      <div className="data-value-container">
        <p className="data-instance">{ instances } instances</p>
          <p className={`data-amount ${color}`}>
            { amount > 0 && '+' }{ amount }
          </p>
      </div>
    )
  }

  getMyData = () => {
    API.getMyData(this.props.name)
    .then((res) => {
      const myData = res.data;
      localStorage.setItem('myData', JSON.stringify(myData));
      this.setState({ myData });
    });
  }

  render() {
    if (!this.state.myData) {
      return <LoadingComponent />
    }

    return (
      <Fragment>
        <div className="user-photo-container">
          <img className="user-photo" src={this.props.photoURL} alt="User" />
        </div>
        <h1 className="user-name">{ this.props.name }</h1>

        {CATEGORIES.map((category, i) => (
          <div className="data-card" key={i}>
            <Subheader className="garnett-subheader">
              { category }s
            </Subheader>
            {[...new Map(this.state.myData)].map((data, j) => (
              (data[0].toLowerCase().includes(category.toLowerCase()) && (
                <div key={j}>
                  <Divider className="garnett-divider" />
                  <ListItem
                    className="garnett-list-item my-data"
                    primaryText={
                      <p className="data-key">{ data[0] }</p>
                    }
                  >
                    { this.dataValue(data[1]) }
                  </ListItem>
                  <Divider className="garnett-divider" />
                </div>
              ))
            ))}
          </div>
        ))}
      </Fragment>
    )
  }
}
