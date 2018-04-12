import './App.css';
import API from '../api/API.js';
import {initializeFirebase, loadFirebase} from '../helpers/functions.js';
import {
  LoadingLogin,
  LoadingHome,
  LoadingPledgeApp,
  LoadingDelibsApp,
  LoadingRusheeProfile
} from '../helpers/loaders.js';

import React, {Component} from 'react';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';
import Loadable from 'react-loadable';
import urlExists from 'url-exists';

const LoadableLogin = Loadable({
  loader: () => import('../containers/Login/Login'),
  render(loaded, props) {
    let Component = loaded.default;
    return <Component {...props} />;
  },
  loading: LoadingLogin
});

const LoadableHome = Loadable({
  loader: () => import('../containers/Home/Home'),
  render(loaded, props) {
    let Component = loaded.default;
    return <Component {...props} />;
  },
  loading: LoadingHome
});

const LoadablePledgeApp = Loadable({
  loader: () => import('../containers/PledgeApp/PledgeApp'),
  render(loaded, props) {
    let Component = loaded.default;
    return <Component {...props} />;
  },
  loading: LoadingPledgeApp
});

const LoadableDelibsApp = Loadable({
  loader: () => import('../containers/DelibsApp/DelibsApp'),
  render(loaded, props) {
    let Component = loaded.default;
    return <Component {...props} />;
  },
  loading: LoadingDelibsApp
});

const LoadableRusheeProfile = Loadable({
  loader: () => import('../containers/DelibsApp/RusheeProfile'),
  render(loaded, props) {
    let Component = loaded.default;
    return <Component {...props} />;
  },
  loading: LoadingRusheeProfile
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isAuthenticated: false,
      loaded: false
    };
  }

  componentWillMount() {
    let data = JSON.parse(localStorage.getItem('data'));
    let firebaseData = JSON.parse(localStorage.getItem('firebaseData'));

    if (navigator.onLine) {
      if (data !== null) {
        initializeFirebase(firebaseData);

        loadFirebase('auth')
        .then(() => {
          let firebase = window.firebase;

          firebase.auth().onAuthStateChanged((user) => {
            if (user) {
              API.getAuthStatus(user)
              .then(res => {
                this.loginCallBack(res.data);
              });
            }
            else {
              this.setState({
                loaded: true
              });
            }
          });
        });
      }
      else {
        this.setState({
          loaded: true
        });
      }
    }
    else {
      if (data !== null) {
        this.setData(data);
      }
      else {
        this.setState({
          loaded: true
        });
      }
    }
  }

  loginCallBack = (user) => {
    let displayName = user.firstName + user.lastName;
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari || process.env.NODE_ENV === 'development') {
      this.checkPhoto(user);
    }
    else {
      navigator.serviceWorker.getRegistration(swUrl)
      .then((registration) => {
        loadFirebase('messaging')
        .then(() => {
          let firebase = window.firebase;
          let messaging = firebase.messaging();
          messaging.useServiceWorker(registration);

          messaging.requestPermission()
          .then(() => {
            console.log('Notification permission granted.');
            // Get Instance ID token. Initially this makes a network call, once retrieved
            // subsequent calls to getToken will return from cache.
            messaging.getToken()
            .then((currentToken) => {
              if (currentToken) {
                localStorage.setItem('registrationToken', currentToken);

                API.saveMessagingToken(displayName, currentToken)
                .then(messageRes => {
                  console.log(messageRes);
                  this.checkPhoto(user);
                })
                .catch(err => console.log(err));
              } 
              else {
                // Show permission request.
                console.log('No Instance ID token available. Request permission to generate one.');
              }
            })
            .catch((err) => {
              console.log('An error occurred while retrieving token. ', err);
              this.checkPhoto(user);
            });
          })
          .catch((err) => {
            console.log('Unable to get permission to notify.', err);
            this.checkPhoto(user);
          });
        });
      });
    }
  }

  checkPhoto = (user) => {
    let displayName = user.firstName + user.lastName;
    const defaultPhoto = 'https://cdn1.iconfinder.com/data/icons/ninja-things-1/720/ninja-background-512.png';

    if (user.photoURL === defaultPhoto && user.status !== 'alumni') {
      loadFirebase('storage')
      .then(() => {
        let firebase = window.firebase;
        let storage = firebase.storage().ref(`${user.key}.jpg`);

        storage.getDownloadURL()
        .then((url) => {
          urlExists(url, function(err, exists) {
            if (exists) {
              API.setPhoto(displayName, url)
              .then((res) => {
                console.log(res.data)

                this.setData(res.data);
              })
              .catch(err => console.log(err));
            }
            else {
              let storage = firebase.storage.ref(`${user.key}.JPG`);

              storage.getDownloadURL()
              .then((url) => {
                urlExists(url, function(err, exists) {
                  if (exists) {
                    API.setPhoto(displayName, url)
                    .then((res) => {
                      console.log(res.data)

                      this.setData(res.data);
                    })
                    .catch(err => console.log(err));
                  }
                })
              });
            }
          });
        })
        .catch((error) => {
          console.log(error);

          this.setData(user);
        });
      });
    }
    else {
      this.setData(user);
    }
  }

  setData = (user) => {
    this.setState({
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.firstName + user.lastName,
      phone: user.phone,
      email: user.email,
      class: user.class,
      major: user.major,
      status: user.status,
      photoURL: user.photoURL,
      isAuthenticated: true
    });
  }

  logoutCallBack = () => {
    localStorage.clear();

    this.setState({
      isAuthenticated: false,
      loaded: true
    });
  }

  render() {
    return (
      <Router>
        <div>
          <Route exact path="/" render={() => (
            this.state.isAuthenticated ? (
              this.state.status === "pledge" ? (
                <Redirect to="/pledge-app" />
              ) : (
                <Redirect to="/home" />
              )
            ) : (
              this.state.loaded ? (
                <LoadableLogin 
                  state={this.state}
                  loginCallBack={this.loginCallBack}
                />
              ) : (
                <LoadingLogin />
              )
            )
          )}/>
          <Route exact path="/home" render={({history}) => (
            this.state.isAuthenticated ? (
              <LoadableHome
                state={this.state}
                history={history}
                logoutCallBack={this.logoutCallBack}
              />
            ) : (
              this.state.loaded ? (
                <Redirect to="/" />
              ) : (
                <LoadingLogin />
              )
            )
          )}/>
          <Route exact path="/pledge-app" render={({history}) => (
            this.state.isAuthenticated ? (
              <LoadablePledgeApp 
                state={this.state} 
                history={history}
                logoutCallBack={this.logoutCallBack}
              />
            ) : (
              this.state.loaded ? (
                <Redirect to="/" />
              ) : (
                <LoadingLogin />
              )
            )
          )}/>
          <Route exact path="/delibs-app" render={({history}) => (
            this.state.isAuthenticated ? (
              <LoadableDelibsApp
                state={this.state} 
                history={history}
              />
            ) : (
              this.state.loaded ? (
                <Redirect to="/" />
              ) : (
                <LoadingLogin />
              )
            )
          )}/>
          <Route exact path="/delibs-app/:id" render={({history}) => (
            this.state.isAuthenticated ? (
              <LoadableRusheeProfile
                state={this.state} 
                history={history}
              />
            ) : (
              this.state.loaded ? (
                <Redirect to="/" />
              ) : (
                <LoadingLogin />
              )
            )
          )}/>
        </div>
      </Router>
    );
  }
}

export default App;
