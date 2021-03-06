// @flow

import API from 'api/API.js';
import { PLEDGING_START_DATE, PLEDGING_END_DATE } from 'helpers/constants';
import { formatDate } from 'helpers/functions';
import { MeritDialogList, SelectedUsersChips } from 'components';
import type { User, MeritType } from 'api/models';

import React, { Component, type Node } from 'react';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';

type Props = {
  state: User,
  type: MeritType,
  initialUser: ?User,
  description: string,
  setUsers: (Array<User>) => void,
  setDescription: (string) => void,
  setDate: (string) => void,
  handleRequestOpen: () => void
};

type State = {
  users: ?Array<User>,
  filteredUsers: ?Array<User>,
  selectedUsers: Array<User>,
  name: string,
  description: string,
  date: Date,
  showAlumni: boolean
};

export class SelectUsers extends Component<Props, State> {
  state = {
    users: null,
    filteredUsers: null,
    selectedUsers: [],
    name: '',
    description: '',
    date: new Date(),
    showAlumni: false
  };

  componentDidMount() {
    const { status, firstName, lastName } = this.props.state;
    const fullName = `${firstName} ${lastName}`;
    let description = '';

    if (this.props.type === 'interview') {
      description = '🤗';
    }

    if (status === 'pledge') {
      API.getActivesForMerit(fullName)
      .then((res) => {
        const user = res.data;
        this.props.setDescription(description);
        this.setInitialUser(user, description);
      });
    } else {
      API.getPledgesForMerit(fullName, status)
      .then((res) => {
        const user = res.data;
        this.props.setDescription(description);
        this.setInitialUser(user, description);
      });
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { description } = this.props;
    if (description !== prevProps.description) {
      this.props.setDescription(description);
      this.setState({ description });
    }
  }

  get header(): Node {
    const { status } = this.props.state;
    const { selectedUsers, name, description } = this.state;
    const isPledge = status === 'pledge';
    return (
      <div
        id="select-users-header"
        className={`${selectedUsers.length > 0 ? 'selected-users' : ''}`}
      >
        <SelectedUsersChips
          selectedUsers={selectedUsers}
          deselectUser={this.deselectUser}
        />
        <div id="select-name-container">
          <input
            className="select-users-input name"
            type="text"
            placeholder="Name"
            autoComplete="off"
            value={this.state.name}
            onChange={this.setName}
            onKeyDown={this.onNameKeyDown}
          />
          {!isPledge && !name && (selectedUsers.length === 0) && (
            <span id="select-all-pledges" onClick={this.selectAllPledges}>
              Select all pledges
            </span>
          )}
        </div>
        <label htmlFor="description" className="select-users-input description">
          { this.descriptionLabel }
          <input
            id="description"
            type="text"
            placeholder="Description"
            autoComplete="off"
            value={description}
            disabled={this.props.type === 'standardized'}
            onChange={this.setDescription}
          />
        </label>
        <DayPickerInput
          value={this.state.date}
          formatDate={formatDate}
          onDayChange={this.setDate}
          inputProps={{ readOnly: true }}
          dayPickerProps={{
            selectedDays: this.state.date,
            fromMonth: PLEDGING_START_DATE,
            toMonth: PLEDGING_END_DATE,
            disabledDays: [{
              after: new Date(),
              before: PLEDGING_START_DATE
            }]
          }}
        />
      </div>
    )
  }

  get descriptionLabel(): string {
    switch (this.props.type) {
      case 'interview':
        return 'Interview:\xa0';
      case 'chalkboard':
        return 'Chalkboard:\xa0';
      default:
        return '';
    }
  }

  get remainingUsers(): Array<User> {
    const { users, selectedUsers } = this.state;
    if (!users) {
      return;
    } else if (selectedUsers.length === 0) {
      return users;
    } else {
      const remainingUsers = users.filter((user) => {
        const isIncluded = selectedUsers.some((selectedUser) => (
          selectedUser.displayName === user.displayName
        ));
        return !isIncluded;
      });
      return remainingUsers;
    }
  }

  setInitialUser = (users: Array<User>) => {
    const { initialUser } = this.props;
    let filteredUsers = users;
    let selectedUsers = []

    if (initialUser) {
      filteredUsers = users.filter((user) => {
        const userName = user.firstName + user.lastName;
        const initialUserName = initialUser.firstName + initialUser.lastName;
        return userName !== initialUserName;
      });
      selectedUsers = [initialUser];
    }

    this.setState({ users, filteredUsers, selectedUsers });
  }

  setName = (event: SyntheticEvent<>) => {
    const name = event.target.value;
    let result = [];

    // If searched name is empty, return the remaining users
    if (name === '') {
      result = this.remainingUsers;
    } else {
      this.remainingUsers.forEach((user) => {
        const userName = `${user.firstName} ${user.lastName}`.toLowerCase();
        if (userName.startsWith(name.trim().toLowerCase())) {
          result.push(user);
        }
      });
    }

    this.setState({ filteredUsers: result, name });
  }

  setDescription = (event: SyntheticEvent<>) => {
    const description = event.target.value;
    this.props.setDescription(description);
    this.setState({ description });
  }

  onNameKeyDown = (event: SyntheticEvent<>) => {
    const { selectedUsers, name } = this.state;
    const { keyCode } = event;
    // Remove last selected active if no name input exists and
    // there are selected users
    if ((keyCode === 8 || keyCode === 46) && !name && selectedUsers.length > 0) {
      const removedUser = selectedUsers.pop();
      const filteredUsers = this.addAndSortDeselectedUser(removedUser);
      this.props.setUsers(selectedUsers);
      this.setState({ filteredUsers, selectedUsers });
    }
  }

  setDate = (date: Date) => {
    this.props.setDate(date);
    this.setState({ date });
  }

  selectUser = (user: User) => {
    const { selectedUsers } = this.state;
    const filteredUsers = this.remainingUsers.filter((currentUser) => {
      return user.displayName !== currentUser.displayName;
    });
    selectedUsers.push(user);
    this.props.setUsers(selectedUsers);
    this.setState({ filteredUsers, selectedUsers, name: '' });
  }

  selectAllPledges = () => {
    const { users } = this.state;
    if (this.props.state.status !== 'pledge' && users) {
      this.props.setUsers(users);
      this.setState({ selectedUsers: users, filteredUsers: [] });
    }
  }

  deselectUser = (user: User) => {
    const filteredUsers = this.addAndSortDeselectedUser(user);
    let { selectedUsers } = this.state;

    selectedUsers = selectedUsers.filter((currentUser) => {
      return currentUser !== user;
    });

    this.props.setUsers(selectedUsers);
    this.setState({ filteredUsers, selectedUsers });
  }

  // Add the deselected user to the list if their name matches searched name
  addAndSortDeselectedUser(user: User): Array<Users> {
    const { filteredUsers, name } = this.state;
    const userName = `${user.firstName} ${user.lastName}`.toLowerCase();
    if (userName.startsWith(name.trim().toLowerCase())) {
      filteredUsers.push(user);
      filteredUsers.sort((a, b) => a.firstName.localeCompare(b.firstName));
    }
    return filteredUsers;
  }

  toggleAlumniView = () => {
    const { firstName, lastName } = this.props.state;
    const { showAlumni } = this.state;
    const fullName = `${firstName} ${lastName}`;

    // Show spinner while loading users
    this.setState({ filteredUsers: null });

    API.getActivesForMerit(fullName, !showAlumni)
    .then((res) => {
      const users = res.data;
      this.props.setUsers([]);
      this.setState({
        users,
        filteredUsers: users,
        selectedUsers: [],
        showAlumni: !showAlumni
      });
    });
  }

  render() {
    const { status } = this.props.state;
    const { filteredUsers, showAlumni } = this.state;
    const isPledge = status === 'pledge';
    return (
      <div id="merit-select-users-container">
        { this.header }
        <div id="merit-dialog-list-container">
          <MeritDialogList
            users={filteredUsers}
            isPledge={isPledge}
            showAlumni={isPledge && showAlumni}
            selectUser={this.selectUser}
            toggleAlumniView={this.toggleAlumniView}
          />
        </div>
      </div>
    )
  }
}
