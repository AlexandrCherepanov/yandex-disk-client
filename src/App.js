import React from 'react';
import './App.css';
import { Switch, Route, Link } from 'react-router-dom'
import Button from '@material/react-button';
import '@material/react-button/dist/button.css';
import List, { ListItem, ListItemText, ListItemGraphic } from '@material/react-list';
import '@material/react-list/dist/list.css';
import MaterialIcon from '@material/react-material-icon';

const appId = "58d159d75dca404e89e361291e0ce147";
const urlToGetAuthToken = "https://oauth.yandex.ru/authorize?response_type=token&client_id=" + appId;
const API_FOLDERS = "https://cloud-api.yandex.net/v1/disk/resources?path=";
const API_FILES = "https://cloud-api.yandex.net/v1/disk/resources/download?path=";

const Home = () => (
  <div>
    <h2>Добро пожаловать в Yandex Диск Client</h2>
    <p>Yandex Диск — это сервис хранения, редактирования и синхронизации файлов.</p>
    <p>Для получения доступа к файлам на Диске нажмите <a href={urlToGetAuthToken}>Получить доступ</a> и пройдите авторизацию.</p>
  </div>
)

class LoginButton extends React.Component {
  render() {
    return (
      <a href={urlToGetAuthToken} role="button">
        <Button raised className='button-alternate'>
          Получить доступ
        </Button>
      </a>
    )
  }
}

class Header extends React.Component {
  constructor(props) {
    super();
  }

  render() {
    return (
      <header>
        <nav>
          <Link to='/'>Главная</Link>
          <Link to='/client-disk'>Диск</Link>
          <LoginButton />
        </nav>
      </header>
    )
  }
}

class FolderPath extends React.Component {
  render() {
    return (
      <div>
        <h3>Файлы:</h3>
        {this.props.folder.map((item, index) =>
          (item && <span key={item}><MaterialIcon icon='keyboard_arrow_right' />
            <a href={this.props.folder.slice(0, index + 1).join('/')} onClick={this.props.link}>{item}</a>
          </span>))}
      </div>
    );
  }
}

const ItemsList = (props) => {
  return props.disk.map((item) => (
    <div key={item.name}>
      {item.type === 'dir' ?
        <ListItem onClick={() => props.folder(item.name)}>
          <ListItemGraphic graphic={<MaterialIcon icon='folder' />} />
          <ListItemText primaryText={item.name} />
        </ListItem> :
        <ListItem onClick={() => props.file(item.name)}>
          <ListItemGraphic graphic={<MaterialIcon icon='insert_drive_file' />} />
          <ListItemText primaryText={item.name} />
        </ListItem>
      }
    </div >
  ));
}

class Client extends React.Component {
  constructor() {
    super();
    this.state = {
      folder: [],
      disk: []
    };
    this.arrayDisk = [];
  }

  getFolder(folder_name = '') {
    this.arrayDisk.length = 0;
    const folder_path = this.state.folder.join('/').replace('disk:/', '') + '/';

    const FOLDER_URL = API_FOLDERS + folder_path + folder_name + "&limit=10000";
    const headers = new Headers({
      'Authorization': `OAuth ` + this.props.token
    });
    const init = {
      headers: headers
    };

    const fetchFolder = async () => {
      const response = await fetch(FOLDER_URL, init);
      const json = await response.json();
      json._embedded.items.forEach((item, index) => { this.arrayDisk[index] = item; });
      const arrayFolders = json._embedded.path.split("/");
      this.setState({ disk: this.arrayDisk, folder: arrayFolders });
    }

    fetchFolder();
  }

  changeFolders(event) {
    event.preventDefault();
    const arrayFolders = event.target.href.split("/");
    this.setState({
      folder: arrayFolders
    }, () => this.getFolder(''));
  }

  getFile(file_name) {
    const folder_path = this.state.folder.join('/').replace('disk:/', '') + '/';
    const FILE_URL = API_FILES + folder_path + file_name;
    const headers = new Headers({
      'Authorization': `OAuth ` + this.props.token
    });
    const init = {
      headers: headers
    };

    const fetchFile = async () => {
      const response = await fetch(FILE_URL, init);
      const json = await response.json();
      window.location = json.href;
      this.setState({ download: json.href })
    }
    fetchFile();
  }

  componentDidMount() {
    this.setState({
      folder: ['disk:/']
    }, () => this.getFolder(''));
  }

  render() {
    if (this.props.token === "") {
      return (
        <div>
          Вы не прошли авторизацию. Необходимо получить доступ к Диску.
        </div>
      )
    }
    else {
      return (
        <div>
          <FolderPath
            folder={this.state.folder}
            link={this.changeFolders.bind(this)} />
          <List>
            <ItemsList
              disk={this.state.disk}
              folder={this.getFolder.bind(this)}
              file={this.getFile.bind(this)}
            />
          </List>
        </div>
      )
    }
  }
}

class App extends React.Component {
  constructor() {
    super();
    this.state = { token: "" };
  }

  componentDidMount() {
    const tokenData = /access_token=([^&]+)/.exec(document.location.hash);
    const token = tokenData ? tokenData[1] : null;
    if (token) {
      this.setState({ token: token });
      this.setCookie("token", token);
    }
    else {
      const cookie_token = this.getCookie("token");
      if (cookie_token) {
        this.setState({ token: cookie_token });
        return;
      }
    }
  }

  setCookie(name, token) {
    var date = new Date();
    date.setDate(date.getDate() + 365);
    const collectCookie = name + "=" + token + "; path=/; expires=" + date;
    document.cookie = collectCookie;
  }

  getCookie(name) {
    var matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"));
    return matches ? decodeURIComponent(matches[1]) : undefined;
  }

  render() {
    const token = this.state.token;
    return (
      <div>
        <Header />
        <Switch>
          <Route exact path='/' render={() => <Home token={token} />} />
          <Route path='/client-disk' render={() => {
            if (token !== "")
              return <Client token={token} />
            else
              return <div>Вы не прошли авторизацию. Необходимо получить доступ к Диску.</div>
          }} />
        </Switch>
      </div>
    )
  }
}

export default App;
