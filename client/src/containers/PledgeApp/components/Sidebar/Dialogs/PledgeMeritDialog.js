// @flow

import '../../MyMerits/MyMerits.css';
import { getDate, invalidSafariVersion } from 'helpers/functions.js';
import { SpinnerDialog } from 'helpers/loaders.js';
import API from 'api/API.js';
import type { User } from 'api/models';

import React, { PureComponent } from 'react';
import Dialog from 'material-ui/Dialog';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import DatePicker from 'material-ui/DatePicker';
import TextField from 'material-ui/TextField';
import Slider from 'material-ui/Slider';
import FlatButton from 'material-ui/FlatButton';
import Checkbox from 'material-ui/Checkbox';

const checkboxStyle = {
  left: '50%',
  width: 'max-content',
  marginTop: '20px',
  transform: 'translateX(-130px)'
};

type Props = {
  state: User,
  open: boolean,
  handleMeritClose: () => void,
  handleRequestOpen: () => void
};

type State = {
  actives: Array<User>,
  selectedActives: Array<Object>,
  description: string,
  date: Date,
  isAlumni: boolean,
  isChalkboard: boolean,
  isPCGreet: boolean,
  amount: number,
  openSpinner: boolean,
  activeValidation: boolean,
  descriptionValidation: boolean
};

export default class PledgeMeritDialog extends PureComponent<Props, State> {
  state = {
    actives: [],
    selectedActives: [],
    description: '',
    date: new Date(),
    isAlumni: false,
    isChalkboard: false,
    isPCGreet: false,
    amount: 0,
    openSpinner: false,
    activeValidation: true,
    descriptionValidation: true
  };

  componentWillReceiveProps(nextProps: Props) {
    if (navigator.onLine && this.props !== nextProps) {
      API.getActivesForMerit(nextProps.state.displayName)
      .then((res) => {
        const actives = res.data;

        this.setState({ actives });
      });
    }
  }

  merit = (action: 'merit' | 'demerit') => {
    const { selectedActives } = this.state;
    let { description, amount } = this.state;
    let activeValidation = true;
    let descriptionValidation = true;

    if (typeof description === 'object') {
      description = description.title;
    }

    if (selectedActives.length === 0 || !description || description.length > 50 || amount === 0) {
      if (selectedActives.length === 0) {
        activeValidation = false;
      }
      if (!description || description.length > 50) {
        descriptionValidation = false;
      }
      this.setState({ activeValidation, descriptionValidation });
    } else {
      const {
        displayName,
        name: pledgeName,
        photoURL: pledgePhoto
      } = this.props.state;
      const { isChalkboard, isPCGreet } = this.state;
      let actionText = 'Merited';
      let date = this.formatDate(this.state.date);

      if (invalidSafariVersion()) {
        date = getDate();
      }
      if (action === 'demerit') {
        amount = -amount;
        actionText = 'Demerited';
      }
      if (isChalkboard) {
        description = `Chalkboard: ${description}`;
      }

      const merit = {
        createdBy: displayName,
        pledgeName,
        description,
        amount,
        pledgePhoto,
        date,
        isPCGreet
      };

      const meritInfo = {
        displayName,
        selectedActives,
        merit,
        isChalkboard,
        isPCGreet
      };

      this.openProgressDialog();

      API.meritAsPledge(meritInfo)
      .then(res => {
        const totalAmount = amount * selectedActives.length;
        console.log(res);
        this.handleClose();
        this.closeProgressDialog();

        API.sendPledgeMeritNotification(pledgeName, selectedActives, amount)
        .then(res => {
          this.props.handleRequestOpen(`${actionText} yourself ${totalAmount} merits`);
        })
        .catch(error => console.error(`Error: ${error}`));
      })
      .catch((error) => {
        const active = error.response.data;
        console.error(error)
        console.error(`Not enough merits for ${active}`);
        this.handleClose();
        this.closeProgressDialog();
        this.props.handleRequestOpen(`${active} does not have enough merits`);
      });
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString([], {month: '2-digit', day: '2-digit'});
  }

  disableDates(date: Date): boolean {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), 3, 12);

    return date > today || date < startDate;
  }

  handleChange = (label: string, newValue: any) => {
    const validationLabel = [label] + 'Validation';
    let value = newValue;
    let { amount } = this.state;

    switch (label) {
      case 'amount':
        value = parseInt(newValue, 10);
        break;
      case 'isAlumni':
        const { displayName } = this.props.state;
        API.getActivesForMerit(displayName, newValue)
        .then((res) => {
          const actives = res.data;
          this.setState({
            actives,
            selectedActives: []
          });
        });
        break;
      case 'isChalkboard':
        if (newValue === true) {
          const { name } = this.props.state.name;
          API.getChalkboardsForMerit(name)
          .then((res) => {
            const chalkboards = res.data;
            this.setState({
              chalkboards,
              description: '',
              isPCGreet: false
            });
          })
          .catch((error) => {
            console.error(`Error: ${error}`);
          })
        }
        else {
          const maxAmount = 50;

          if (amount > maxAmount) {
            amount = maxAmount;
          }

          this.setState({
            amount,
            description: ''
          });
        }
        break;
      case 'description':
        if (this.state.isChalkboard && newValue.amount) {
          value = newValue;
          amount = newValue.amount;
          this.setState({ amount });
        }
        break;
      case 'isPCGreet':
        this.setState({
          amount: 5,
          isChalkboard: false
        });
        break;
      default:
    }

    this.setState({
      [label]: value,
      [validationLabel]: true
    });
  }

  handleClose = () => {
    this.props.handleMeritClose();
    this.setState({
      selectedActives: [],
      description: '',
      date: new Date(),
      isChalkboard: false,
      amount: 0,
      chalkboards: null,
      activeValidation: true,
      descriptionValidation: true
    });
  }

  openProgressDialog = () => {
    this.setState({
      openSpinner: true,
      spinnerMessage: 'Meriting pledges...'
    });
  }

  closeProgressDialog = () => this.setState({ openSpinner: false });

  render() {
    const maxAmount = 100;
    const selectLabel = this.state.isAlumni ? 'Alumni Name' : 'Active Name';
    const actions = [
      <FlatButton
        label="Demerit"
        primary={true}
        onClick={() => this.merit('demerit')}
      />,
      <FlatButton
        label="Merit"
        primary={true}
        onClick={() => this.merit('merit')}
      />,
    ];

    return (
      <Dialog
        title="Merit"
        titleClassName="garnett-dialog-title"
        actions={actions}
        bodyClassName="garnett-dialog-body"
        contentClassName="garnett-dialog-content"
        open={this.props.open}
        onRequestClose={this.handleClose}
        autoScrollBodyContent={true}
      >
        <SelectField
          className="garnett-input"
          value={this.state.selectedActives}
          floatingLabelText={selectLabel}
          multiple={true}
          onChange={(e, key, newValue) => this.handleChange('selectedActives', newValue)}
          errorText={!this.state.activeValidation && 'Please select an active.'}
        >
          {this.state.actives.map((active, i) => (
            <MenuItem
              key={i}
              value={active}
              primaryText={active.label}
              insetChildren
              checked={
                this.state.selectedActives && 
                this.state.selectedActives.indexOf(active) > -1
              }
            />
          ))}
        </SelectField>

        <Checkbox
          style={checkboxStyle}
          label="Alumni"
          checked={this.state.isAlumni}
          onCheck={(e, newValue) => this.handleChange('isAlumni', newValue)}
        />

        {this.state.isChalkboard ? (
          <SelectField
            className="garnett-input"
            value={this.state.description}
            floatingLabelText="Chalkboard Title"
            maxHeight={345}
            onChange={(e, key, newValue) => this.handleChange('description', newValue)}
            errorText={!this.state.descriptionValidation && 'Please select a chalkboard.'}
          >
            {this.state.chalkboards && this.state.chalkboards.length > 0 ? (
              this.state.chalkboards.map((chalkboard, i) => (
                <MenuItem
                  key={i}
                  value={chalkboard}
                  primaryText={chalkboard.title}
                  insetChildren
                  checked={chalkboard === this.state.description}
                />
              ))
            ) : (
              <MenuItem value="None" primaryText="None" />
            )}
          </SelectField>
        ) : (
          <TextField
            className="garnett-input"
            type="text"
            floatingLabelText="Description"
            multiLine={true}
            rowsMax={3}
            value={this.state.description}
            onChange={(e, newValue) => this.handleChange('description', newValue)}
            errorText={!this.state.descriptionValidation && 'Enter a description less than 50 characters.'}
          />
        )}

        {!invalidSafariVersion() && (
          <DatePicker
            className="garnett-input"
            textFieldStyle={{display:'block',margin:'0 auto'}}
            floatingLabelText="Date"
            value={this.state.date}
            disableYearSelection
            firstDayOfWeek={0}
            formatDate={this.formatDate}
            shouldDisableDate={this.disableDates}
            onChange={(e, newValue) => this.handleChange('date', newValue)}
          />
        )}

        <div style={{width:'256px',margin:'20px auto 0'}}>
          <span style={{ color: 'var(--text-light)' }}>
            Amount: {this.state.amount} merits
          </span>
          <Slider
            sliderStyle={{marginBottom:0}}
            name="Amount"
            min={0}
            max={maxAmount}
            step={5}
            value={this.state.amount}
            disabled={this.state.isPCGreet}
            onChange={(e, newValue) => this.handleChange('amount', newValue)}
          />
        </div>
        {/*<Checkbox
          style={checkboxStyle}
          label="Chalkboard"
          checked={this.state.isChalkboard}
          onCheck={(e, newValue) => this.handleChange('isChalkboard', newValue)}
        />*/}
        <Checkbox
          style={checkboxStyle}
          label="PC Greet"
          checked={this.state.isPCGreet}
          onCheck={(e, newValue) => this.handleChange('isPCGreet', newValue)}
        />

        <div id="remaining-merits">
          {this.state.selectedActives.map((active, i) => (
            <p key={i}> Merits remaining for {active.label}: {active.remainingMerits} </p>
          ))}
        </div>

        <SpinnerDialog
          open={this.state.openSpinner}
          message={this.state.spinnerMessage}
        />
      </Dialog>
    )
  }
}