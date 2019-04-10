const admin = require('firebase-admin');
const equal = require('deep-equal');
const useragent = require('useragent');

// Get remaining merits for pledge
exports.get_remaining_merits = function(req, res) {
  const { displayName, pledgeName } = req.query;
  const meritsRef = admin.database().ref('/users/' + displayName + '/Pledges/' + pledgeName + '/merits');

  meritsRef.once('value', (merits) => {
    console.log()
    res.json(merits.val());
  });
};

// Gets all the pledges for meriting as active
exports.get_pledges_as_active = function(req, res) {
  const { displayName } = req.query;
  const pledgesRef = admin.database().ref('/users/' + displayName + '/Pledges');

  pledgesRef.once('value', (snapshot) => {
    let pledges;

    if (snapshot.val()) {
      pledges = Object.keys(snapshot.val()).map(function(key) {
        return {
          value: key,
          label: key.replace(/([a-z])([A-Z])/, '$1 $2'),
          remainingMerits: snapshot.val()[key].merits
        };
      });
    }

    res.json(pledges);
  });
};

// Gets all the pledges for meriting as active (MOBILE)
exports.get_pledges_as_active_mobile = function(req, res) {
  const { displayName } = req.query;
  const usersRef = admin.database().ref('/users');
  const userPledgesRef = admin.database().ref('/users/' + displayName + '/Pledges');

  userPledgesRef.once('value', (pledges) => {
    if (pledges.val()) {
      const result = [];
      const promises = [];
      const remainingMerits = new Map();
      pledges.forEach((pledge) => {
        remainingMerits.set(pledge.key, pledge.val().merits);
        promises.push(usersRef.child(pledge.key).once('value'))
      });

      Promise.all(promises).then((results) => {
        results.forEach((user) => {
          const currentPledge = {
            firstName: user.val().firstName,
            lastName: user.val().lastName,
            year: user.val().year,
            major: user.val().major,
            photoURL: user.val().photoURL,
            remainingMerits: remainingMerits.get(user.key)
          };
          result.push(currentPledge);
        })
        res.json(result)
      })
    }
  });
};

// Get Pbros data for pledges
exports.get_pbros_as_pledge = function(req, res) {
  const { displayName } = req.query;
  const usersRef = admin.database().ref('/users');
  let pbros = [];

  usersRef.once('value', (users) => {
    users.forEach((user) => {
      if (user.val().status === 'pledge' && user.key !== displayName) {
        pbros.push(user.val());
      }
    });

    pbros = pbros.length === 0 ? null : pbros;
    res.json(pbros);
  });
};

// Gets all the actives for meriting as pledge
exports.get_actives_as_pledge = function(req, res) {
  const { displayName, showAlumni } = req.query;
  const usersRef = admin.database().ref('/users');

  usersRef.once('value', (users) => {
    const result = [];

    users.forEach((user) => {
      if (user.val().status !== 'pledge') {
        const currentActive = {
          value: user.key,
          label: `${user.val().firstName} ${user.val().lastName}`,
          remainingMerits: user.val().Pledges[displayName].merits
        };

        if (showAlumni === 'true') {
          if (user.val().status === 'alumni') {
            result.push(currentActive);
          }
        }
        else if (user.val().status !== 'alumni') {
          result.push(currentActive);
        }
      }
    });

    res.json(result);
  });
};

// Gets all the actives for meriting as pledge (MOBILE)
exports.get_actives_as_pledge_mobile = function(req, res) {
  const { displayName, showAlumni } = req.query;
  const usersRef = admin.database().ref('/users');

  usersRef.once('value', (users) => {
    const result = [];

    users.forEach((user) => {
      if (user.val().status !== 'pledge') {
        const currentActive = {
          firstName: user.val().firstName,
          lastName: user.val().lastName,
          year: user.val().year,
          major: user.val().major,
          photoURL: user.val().photoURL,
          remainingMerits: user.val().Pledges[displayName].merits
        };

        if (showAlumni === 'true') {
          if (user.val().status === 'alumni') {
            result.push(currentActive);
          }
        } else if (user.val().status !== 'alumni') {
          result.push(currentActive);
        }
      }
    });

    res.json(result);
  });
};

// Gets all the chalkboards for merit
exports.get_chalkboards_merit = function(req, res) {
  const { fullName } = req.query;
  const chalkboardsRef = admin.database().ref('/chalkboards');

  chalkboardsRef.once('value', (snapshot) => {
    const myChalkboards = [];

    if (snapshot.val()) {
      const chalkboards = Object.keys(snapshot.val()).map(function(key) {
        return snapshot.val()[key];
      });

      chalkboards.forEach((chalkboard) => {
        const { title, amount } = chalkboard;
        const currentChalkboard = { title, amount };

        if (chalkboard.activeName === fullName) {
          myChalkboards.push(currentChalkboard);
        } else if (chalkboard.attendees) {
          const attendees = Object.keys(chalkboard.attendees).map(function(key) {
            return chalkboard.attendees[key];
          });

          attendees.forEach((attendee) => {
            if (attendee.name === fullName) {
              myChalkboards.push(currentChalkboard);
            }
          });
        }
      });
    }

    res.json(myChalkboards);
  });
};

// Create merit
exports.create_merit = function(req, res) {
  const {
    displayName,
    selectedUsers,
    merit,
    status
  } = req.body;
  const platform = useragent.parse(req.headers['user-agent']).toString();
  let counter = 0;
  const usersRef = admin.database().ref('/users');
  let activeRef;
  let pledgeRef;

  selectedUsers.forEach((user) => {
    let active;
    let pledge;
    let userStatus;
    if (status === 'pledge') {
      active = user.value;
      pledge = displayName;
      userStatus = user.val().status;
    } else {
      active = displayName;
      pledge = user.value;
      userStatus = status;
    }
    activeRef = usersRef.child(active);
    pledgeRef = usersRef.child(pledge);

    activeRef.once('value', (active) => {
      if (userStatus !== 'pipm' && merit.type === 'personal') {
        const remainingMerits = active.val().Pledges[pledge].merits - merit.amount;
        if (merit.amount > 0 && remainingMerits < 0 && !res.headersSent) {
          res.sendStatus(400).send(user.label);
        } else {
          const activePledgeRef = active.ref.child(`/Pledges/${pledge}`);
          activePledgeRef.update({ merits: remainingMerits });
        }
      }

      pledgeRef.once('value', (pledge) => {
        counter++;

        if (status === 'pledge') {
          merit.activeName = `${active.val().firstName} ${active.val().lastName}`;
          merit.activePhoto = active.val().photoURL;
          merit.platform = platform;
        } else {
          merit.pledgeName = `${pledge.val().firstName} ${pledge.val().lastName}`;
          merit.pledgePhoto = pledge.val().photoURL;
          merit.platform = platform;
        }

        const meritsRef = admin.database().ref('/merits');
        const key = meritsRef.push(merit).getKey();
        pledge.ref.child('Merits').push(key);
        activeRef.child('Merits').push(key);

        if (!res.headersSent && counter === selectedUsers.length) {
          res.sendStatus(200);
        }
      });
    });
  })
};

// Deletes merit
exports.delete_merit = function(req, res) {
  const pledgeName = req.body.merit.pledgeName.replace(/ /g,'');
  const activeName = req.body.merit.activeName.replace(/ /g,'');
  const meritsRef = admin.database().ref('/merits');
  const pledgeRef = admin.database().ref('/users/' + pledgeName);
  const activeRef = admin.database().ref('/users/' + activeName);

  meritsRef.once('value', (merits) => {
    merits.forEach((merit) => {
      // Find the merit in the merits list
      if (equal(merit.val(), req.body.merit)) {
        // Remove the merit from all merits list
        merit.ref.remove(() => {
          pledgeRef.once('value', (pledge) => {
            const pledgeMerits = Object.keys(pledge.val().Merits).map(function(key) {
              return [pledge.val().Merits[key], key];
            });

            // Search for the merit reference in the pledge's merits
            pledgeMerits.forEach((pledgeMerit) => {
              if (pledgeMerit[0] === merit.key) {
                // Remove the merit from the pledge's merits
                pledgeRef.child('Merits').child(pledgeMerit[1]).remove(() => {
                  activeRef.once('value', (active) => {
                    const activeMerits = Object.keys(active.val().Merits).map(function(key) {
                      return [active.val().Merits[key], key];
                    });

                    // Search for the merit reference in the active's merits
                    activeMerits.forEach((activeMerit) => {
                      if (activeMerit[0] === merit.key) {
                        // Remove the merit from the active's merits
                        activeRef.child('Merits').child(activeMerit[1]).remove(() => {
                          // Update the active's remaining merits for the pledge
                          activeRef.child('Pledges').child(pledgeName).update({
                            merits: active.val().Pledges[pledgeName].merits + req.body.merit.amount
                          });

                          res.sendStatus(200);
                        })
                      }
                    })
                  });
                })
              }
            })
          });
        })
      }
    })
  })
};