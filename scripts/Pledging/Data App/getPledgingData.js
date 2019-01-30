const admin = require("firebase-admin");
var fs = require('fs');
require('dotenv').config({ path: `${process.env.HOME}/Projects/React/Garnett/.env` });

admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL
})

const meritsRef = admin.database().ref('/merits');
// let usersRef = admin.database().ref('/users');
// let chalkboardsRef = admin.database().ref('/chalkboards');
// let complaintsRef = admin.database().ref('/approvedComplaints');

meritsRef.once('value', (merits) => {
  // User map to check status for chalkboard attendees
  // let users = new Map();
  let totalMeritInstances = new Map();
  let mostMeritInstances = new Map();
  let mostDemeritInstances = new Map();
  let totalMeritAmount = new Map();
  let mostMeritAmount = new Map();
  let mostDemeritAmount = new Map();

  merits.forEach((merit) => {
    // users.set(user.key, user.val().status);
    let totalInstanceCounter = totalMeritInstances.get(merit.val().activeName) || 0;
    let meritInstanceCounter = mostMeritInstances.get(merit.val().activeName) || 0;
    let demeritInstanceCounter = mostDemeritInstances.get(merit.val().activeName) || 0;
    let totalMeritAmountCounter = totalMeritAmount.get(merit.val().activeName) || 0;
    let meritAmountCounter = mostMeritAmount.get(merit.val().activeName) || 0;
    let demeritAmountCounter = mostDemeritAmount.get(merit.val().activeName) || 0;

    if (merit.val().amount > 0) {
      mostMeritInstances.set(merit.val().activeName, meritInstanceCounter += 1);
      mostMeritAmount.set(merit.val().activeName, meritAmountCounter += merit.val().amount);
    }
    else {
      mostDemeritInstances.set(merit.val().activeName, demeritInstanceCounter += 1);
      mostDemeritAmount.set(merit.val().activeName, demeritAmountCounter += merit.val().amount);
    }

    totalMeritInstances.set(merit.val().activeName, totalInstanceCounter += 1);
    totalMeritAmount.set(merit.val().activeName, totalMeritAmountCounter += merit.val().amount);
  });

  totalMeritInstances = [...totalMeritInstances.entries()].sort((a,b) => b[1] - a[1]).slice(2, 12);
  mostMeritInstances = [...mostMeritInstances.entries()].sort((a,b) => b[1] - a[1]).slice(1, 11);
  mostDemeritInstances = [...mostDemeritInstances.entries()].sort((a,b) => b[1] - a[1]).slice(1, 11);
  totalMeritAmount = [...totalMeritAmount.entries()].sort((a,b) => b[1] - a[1]).slice(1, 11);
  mostMeritAmount = [...mostMeritAmount.entries()].sort((a,b) => b[1] - a[1]).slice(3, 13);
  mostDemeritAmount = [...mostDemeritAmount.entries()].sort((a,b) => a[1] - b[1]).slice(1, 11);

  console.log('Most Instances: ', totalMeritInstances);
  console.log('Most Merit Instances: ', mostMeritInstances);
  console.log('Most Demerit Instances: ', mostDemeritInstances);
  console.log('Total Amount: ', totalMeritAmount);
  console.log('Most Merit Amount: ', mostMeritAmount);
  console.log('Most Demerit Amount: ', mostDemeritAmount);

  let jsonData = [
    ['Total Merit Instances', totalMeritInstances],
    ['Most Merit Instances', mostMeritInstances],
    ['Most Demerit Instances', mostDemeritInstances],
    ['Total Merit Amount', totalMeritAmount],
    ['Most Merit Amount', mostMeritAmount],
    ['Most Demerit Amount', mostDemeritAmount]
  ];

  fs.writeFile("pledgeData.json", JSON.stringify(jsonData), function(err) {
    if (err) {
      console.log(err);
    }
  });

  // chalkboardsRef.once('value', (snapshot) => {
  //   let mostChalkboardsCreated = new Map();
  //   let mostChalkboardsAttendedOverall = new Map();
  //   let mostChalkboardsAttendedActive = new Map();
  //   let mostChalkboardsAttendedPledge = new Map();

  //   snapshot.forEach((chalkboard) => {
  //     let mostCreatedCounter = mostChalkboardsCreated.get(chalkboard.val().activeName) || 0;
  //     let attendees = Object.keys(chalkboard.val().attendees).map(function(key) {
  //       return chalkboard.val().attendees[key];
  //     });

  //     mostChalkboardsCreated.set(chalkboard.val().activeName, mostCreatedCounter += 1);

  //     attendees.forEach((attendee) => {
  //       let overallCounter = mostChalkboardsAttendedOverall.get(attendee.name) || 0;
  //       let activeCounter = mostChalkboardsAttendedActive.get(attendee.name) || 0;
  //       let pledgeCounter = mostChalkboardsAttendedPledge.get(attendee.name) || 0;
      
  //       mostChalkboardsAttendedOverall.set(attendee.name, overallCounter += 1);

  //       if (users.get(attendee.name.replace(/ /g,'')) === 'pledge') {
  //         mostChalkboardsAttendedPledge.set(attendee.name, pledgeCounter += 1);
  //       }
  //       else {
  //         mostChalkboardsAttendedActive.set(attendee.name, activeCounter += 1);
  //       }
  //     });
  //   });

  //   mostChalkboardsCreated = [...mostChalkboardsCreated.entries()].sort((a,b) => b[1] - a[1]).slice(0, 10);
  //   mostChalkboardsAttendedOverall = [...mostChalkboardsAttendedOverall.entries()].sort((a,b) => b[1] - a[1]).slice(0, 20);
  //   mostChalkboardsAttendedActive = [...mostChalkboardsAttendedActive.entries()].sort((a,b) => b[1] - a[1]).slice(0, 10);
  //   mostChalkboardsAttendedPledge = [...mostChalkboardsAttendedPledge.entries()].sort((a,b) => b[1] - a[1]).slice(0, 5);

  //   console.log('Most Chalkboards Created: ', mostChalkboardsCreated);
  //   console.log('Most Chalkboards Attended (Actives + Pledges): ', mostChalkboardsAttendedOverall);
  //   console.log('Most Chalkboards Attended (Actives): ', mostChalkboardsAttendedActive);
  //   console.log('Most Chalkboards Attended (Pledges): ', mostChalkboardsAttendedPledge);
    
  //   let jsonData = [
  //     ['Total Merit Instances', totalMeritInstances],
  //     ['Most Merit Instances', mostMeritInstances],
  //     ['Most Demerit Instances', mostDemeritInstances],
  //     ['Total Merit Amount', totalMeritAmount],
  //     ['Most Merit Amount', mostMeritAmount],
  //     ['Most Demerit Amount', mostDemeritAmount],
  //     ['Most Chalkboards Created', mostChalkboardsCreated],
  //     ['Most Chalkboards Attended (Active)', mostChalkboardsAttendedActive],
  //     ['Most Chalkboards Attended (Pledge)', mostChalkboardsAttendedPledge]
  //   ];

  //   fs.writeFile("pledgeData.json", JSON.stringify(jsonData), function(err) {
  //     if (err) {
  //       console.log(err);
  //     }
  //   });
  // });
});
