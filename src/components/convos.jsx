import React from 'react';
import { render } from 'react-dom';
import axios from 'axios';
import toastr from 'toastr';

class DataRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: {},
    };
  }

  render() {
    const record = this.props.parent.state.messages[this.props.message];
    const { data } = record;
    const name = data.name === `${this.props.user.record.firstname} ${this.props.user.record.lastname}`
      ? 'You' : data.name;

    const readOnlyLeft = (
        <div className="card-plain text-left message d-block float-left my-2 w-100 this-is-bg-warning">
        <div className="card-body p-2">
          <div className="bg-dark rounded-circle float-left mr-2">
            <img src="/img/logo.png" height="40px" alt="logo" />
          </div>
          <div id="incoming_message" className="ml-5 rounded">
            <div style={{ fontWeight: '600' }}>{name}</div>
            <div>{data.message}</div>
          </div>
        </div>
        {/*<h4>{name}</h4>
        <p>{data.message}</p>*/}
    </div>
    );

    const readOnlyRight = (
        <div className="card-plain text-right message d-block float-right my-2 w-100 this-is-bg-warning">
        <div className="card-body p-2">
          <div className="bg-dark rounded-circle float-right ml-2">
            <img src="/img/logo.png" height="40px" alt="logo" />
          </div>
          <div id="incoming_message" className="mr-5 p-2 rounded">
            {/*<div style={{ fontWeight: '600' }}>{name}</div>*/}
            <div>{data.message}</div>
          </div>
        </div>
        {/*<h4>{name}</h4>
        <p>{data.message}</p>*/}
    </div>
    );

    return (
      name === 'You' ? readOnlyRight : readOnlyLeft
    );
  }
}

class ConvosComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      passphrase: '',
      name: '',
      password: '',
      messages: [],
      message: '',
      submitted: false,
      update_submitted: false,
      tableData: {},
      querying: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.createRecord = this.createRecord.bind(this);
  }

  componentDidMount() {
    this.loadTableData();
  }

  resetRecords(newData) {
    this.setState({
      messages: newData,
    });
  }

  loadTableData() {
    const page = this;
    const config = {
      headers: {
        user_api_key: this.props.user.record.api_key,
        user_public_key: this.props.public_key,
        accessData: this.props.accessData,
      },
    };

    axios.get(`/api/users/${this.props.user.id}/channels`, config)
      .then((response) => {
        console.log(response.data);
        if (response.data.success) {
          page.setState({
            channels: response.data.channels,
          });
          // page.monitorData();
          for (let x = 0; x < response.data.channels.length; x += 1) {
            const thisChannel = response.data.channels[x];

            if (thisChannel.id === this.props.channelId) {
              this.setState({
                tableData: thisChannel.channel_record,
              }, () => {
                console.log('this is the state');
                console.log(page.state.tableData);
                page.loadData();
              });
            }
          }
        } else {
          toastr.error('No record history');
        }
      })
      .catch((error) => {
        console.log(error);
        toastr.error('There was an error');
      });
  }

  loadData() {
    const page = this;
    this.setState({
      querying: true,
    });

    const config = {
      headers: {
        user_api_key: this.props.user.record.api_key,
        user_public_key: this.props.public_key,
        accessdata: this.props.accessData,
        channelaccess: this.state.tableData.passphrase,
        channeladdress: this.state.tableData.account,
        channelkey: this.state.tableData.password,
        channelpublic: this.state.tableData.publicKey,
      },
    };

    axios.get('/data/messages', config)
      .then((response) => {
        console.log(response.data);
        if (response.data.success) {
          page.setState({
            messages: response.data.messages,
            querying: false,
          });
          page.monitorData();
        } else {
          toastr.error('No record history');
        }
      })
      .catch((error) => {
        console.log(error);
        toastr.error('There was an error');
      });
  }

  checkUpdates() {
    const self = this;
    const currentData = JSON.stringify(this.state.messages);
    const config = {
      headers: {
        user_api_key: this.props.user.record.api_key,
        user_public_key: this.props.public_key,
        accessdata: this.props.accessData,
        channelaccess: this.state.tableData.passphrase,
        channeladdress: this.state.tableData.account,
        channelkey: this.state.tableData.password,
        channelpublic: this.state.tableData.publicKey,
      },
    };

    axios.get('/data/messages', config)
      .then((response) => {
        console.log(response.data);
        if (response.data.success) {
          const responseData = JSON.stringify(response.data.messages);

          if (currentData !== responseData) {
            self.resetRecords(responseData);
          }
        }
      })
      .catch((error) => {
        console.log(error);
        toastr.error("Could not connect to server. Unable to check and update page's records.");
      });
  }

  monitorData() {
    const self = this;

    setInterval(() => {
      if (!(self.state.submitted || self.state.update_submitted)) {
        self.checkUpdates();
      }
    }, 3000);
  }


  handleChange(aField, event) {
    if (aField === 'message') {
      this.setState({ message: event.target.value });
    }
  }

  createRecord(event) {
    event.preventDefault();
    this.setState({
      submitted: true,
    });

    const page = this;

    const record = {
      name: `${this.props.user.record.firstname} ${this.props.user.record.lastname}`,
      message: this.state.message,
      sender: this.props.user.record.account,
    };

    axios.post('/data/messages', {
      data: record,
      user: this.props.accessData,
      tableData: this.state.tableData,
    })
      .then((response) => {
        if (response.data.success) {
          page.setState({
            passphrase: '',
            name: '',
            password: '',
            submitted: false,
            message: '',
          });
          toastr.success('Message sent');
        } else {
          response.data.validations.messages.map((message) => {
            toastr.error(message);
            return null;
          });
        }
      })
      .catch((error) => {
        console.log(error);
        toastr.error('There was an error');
      });
  }


  render() {
    const self = this;
    const Channel = this.state.tableData || {};

    const recordList = (
      this.state.messages.map((channel, index) => <DataRow
        parent={self}
        message={index}
        user={self.props.user}
        public_key={self.props.public_key}
        key={`row${(channel.signature)}`}
        />)
    );

    const messageContainer = (
      <div>
        <div className="page-title">{this.state.messages[0] ? Channel.name : <div className="text-center"><div className="fa fa-spinner fa-pulse" style={{ fontSize: '33px' }} /></div>}</div>
        <div style={{ position: 'relative', overflow: 'hidden', height: 'calc(100vh - 190px)', width: '100%', border: '0px solid #ccc' }}>
          <div className="this-is-bg-info" style={{ overflowY: 'scroll', height: '100%', width: '100%', position: 'absolute' }}>{this.state.messages[0] ? recordList : ''}</div>
          {/*
          <h1 className="page-title">{Channel.name}</h1>
          <h2 className="page-title">{Channel.account}</h2>
          {recordList}
          <div className="bg-warning">
            <div className="">
              <div className="">
                <div className="">
                  <div className="">
                    <div className="">
                      <input placeholder="" value={this.state.message} className="form-control" onChange={this.handleChange.bind(this, 'message')} /><br />
                    </div>
                  </div>
                  <div className="">
                    <div className="">
                      <button type="button" className="btn btn-outline btn-default" disabled={this.state.submitted} onClick={this.createRecord.bind(this)}><i className="glyphicon glyphicon-edit"></i>  {this.state.submitted ? 'Saving...' : 'Send'}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          */}
        </div>
        <div>
          <form className="" style={{ display: 'flex', boxSizing: 'border-box', height: '60px', margin: '10px' }}>
            <input style={{ width: '100%', padding: '15px 10px', border: 'none', margin: '0' }} type="text" className="" placeholder="Enter your message here..." required="required" />
            <button type="submit" className="btn btn-primary">SEND</button>
          </form>
        </div>
      </div>
    );

    const loadingContainer = (
      <div className="text-center mt-5 pt-5"><div className="fa fa-spinner fa-pulse" style={{ fontSize: '60px' }} /></div>
    );

    return (
      this.state.messages[0] ? messageContainer : loadingContainer
    );
  }
}

const ConvosExport = () => {
  if (document.getElementById('convosComponent') != null) {
    const element = document.getElementById('props');
    const props = JSON.parse(element.getAttribute('data-props'));

    render(
      <ConvosComponent
      user={props.user}
      validation={props.validation}
      public_key={props.public_key}
      accessData = {props.accessData}
      channelId = {props.channelId}
      />,
      document.getElementById('convosComponent'),
    );
  }
};

module.exports = ConvosExport();
