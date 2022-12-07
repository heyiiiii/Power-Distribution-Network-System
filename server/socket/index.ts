import http from 'http';
import {Server, Socket} from 'socket.io';
import conf from '../../configs';
import utils from '../utils';

export interface IClient {
  socket: Socket;
  user: {
    id: string;
    sessionKey: string;
  };
}

export interface IFileLockInfo {
  socketId: string;
  fileId: string;
  userInfo: any;
  locked: boolean;
  timeout?: any;
  lockTime?: Date;
}

export default class WSocket {
  private readonly _socket: Server;
  private readonly _clients: Map<string, IClient>;
  private readonly _fileLockArray: IFileLockInfo[];
  private pdfServiceAxios;

  constructor(server: http.Server) {
    this.pdfServiceAxios = utils.getPDFServiceAxios();
    this._fileLockArray = [];
    this._clients = new Map();
    this._socket = new Server(server, {
      path: '/socket',
      cookie: false,
      allowUpgrades: true
    });
    this._socket.on('connection', socket => {
      this.onConnection(socket);
    });
  }

  public postClientMessage(event: any, message: any) {
    this.clients.forEach((client) => {
      client.socket.emit(event, message);
    });
  }

  public getUserSockets(userId: string): Socket[] {
    const socketArray: Socket[] = [];
    this.clients.forEach((client) => {
      if (client.user.id === userId) {
        socketArray.push(client.socket);
      }
    });
    return socketArray;
  }

  public postNotifyMessage(userId: string, param: any) {
    let count = 0;
    for (const client of this.clients.values()) {
      if (client.user.id === userId) {
        client.socket.emit('$notify', param);
        count++;
      }
    }

    return count;
  }

  public postMultipleNotifyMessage(userIds: string[], event: string, param: any) {
    for (const client of this.clients.values()) {
      if (userIds.includes(client.user.id)) {
        client.socket.emit(event, param);
      }
    }
  }

  private onConnection(socket: Socket) {
    console.log('socket client connect: ' + socket.id);
    this.clients.set(socket.id, {
      user: {
        id: '',
        sessionKey: ''
      },
      socket
    });

    socket.emit('refreshTime', new Date().getTime());
    const interval = setInterval(() => {
      socket.emit('refreshTime', new Date().getTime());
    }, 6000);

    socket.on('disconnect', reason => {
      clearInterval(interval);
      this.onDisconnect(socket, reason);
    });

    socket.on('error', err => {
      console.error('websocket error: ', err);
      clearInterval(interval);
      this.onDisconnect(socket, err.message);
    });

    socket.on('setUserInfo', userInfo => {
      const client = this.clients.get(socket.id);
      if (client) {
        if (userInfo && userInfo.id) {
          console.log('socket client: ' + socket.id + ', 用户id[' + userInfo.id + '], 用户名[' + userInfo.name + '], session[' + userInfo.token + ']登录系统');
          client.user.id = userInfo.id;
          client.user.sessionKey = userInfo.token;
        }
      }
    });

    socket.on('task-page-load', userInfo => {
      this.initFileLock(socket.id, userInfo);
      socket.emit('setSocketId', {
        socketId: socket.id
      });
    });

    socket.on('task-page-unload', userInfo => {
      this.removeFileLock(socket.id);
    });

    socket.on('lock-file', ({socketId, fileId}) => {
      this.lockDzdFile(socketId, fileId);
    });

    socket.on('unlock-file', ({socketId, fileId}) => {
      this.unlockDzdFile(socketId, fileId);
    });
  }

  public onUserLogout(sessionKey: string) {
    console.log(sessionKey);
    for (const c of this.clients.values()) {
      console.log(c.user);
      if (c.user.sessionKey && c.user.sessionKey === sessionKey) {
        c.user.id = '';
        c.user.sessionKey = '';
        c.socket.emit('preferLogout');
      }
    }
  }

  private onDisconnect(socket: Socket, reason: any) {
    console.log('socket client disconnect:' + socket.id + ',' + reason);
    this.removeFileLock(socket.id);
    this.clients.delete(socket.id);
  }

  get socket(): Server {
    return this._socket;
  }

  get clients(): Map<string, IClient> {
    return this._clients;
  }

  get fileLockArray(): IFileLockInfo[] {
    return this._fileLockArray;
  }

  public getFileLocker(fileId: string): string {
    const found = this.fileLockArray.find(x => x.fileId === fileId && x.locked);
    return found ? found.userInfo.name : '';
  }

  public getLockedFiles(): IFileLockInfo[] {
    return this.fileLockArray.filter(x => x.locked);
  }

  private initFileLock(socketId: string, userInfo: any) {
    console.log('initFileLock socketId: ' + socketId + ', username: ' + userInfo.name);
    const found = this.fileLockArray.find(x => x.socketId === socketId);
    if (!found) {
      this.fileLockArray.push({
        socketId,
        fileId: '',
        locked: false,
        userInfo
      });
    } else {
      found.fileId = '';
      found.locked = false;
      found.userInfo = userInfo;
    }
  }

  private removeFileLock(socketId: string) {
    console.log('removeFileLock socketId: ' + socketId);
    const index = this.fileLockArray.findIndex(x => x.socketId === socketId);
    if (index >= 0) {
      const fileLock = this.fileLockArray[index];
      if (fileLock.timeout) {
        clearTimeout(fileLock.timeout);
      }
      this.fileLockArray.splice(index, 1);
    }
  }

  private lockDzdFile(socketId: string, fileId: string) {
    console.log('lockDzdFile(' + socketId + ', ' + fileId + ')');
    const found = this.fileLockArray.find(x => x.socketId === socketId);
    if (found) {
      console.log(found.userInfo.name + ' 锁定定值单: ' + fileId);
      if (found.timeout) {
        clearTimeout(found.timeout);
      }
      found.timeout = setTimeout(() => {
        found.locked = false;
        found.timeout = null;
      }, Number(conf.service.fileLockTimeout));
      found.fileId = fileId;
      found.locked = true;
      found.lockTime = new Date();
    }
  }

  private unlockDzdFile(socketId: string, fileId: string) {
    console.log('unlockDzdFile(' + socketId + ', ' + fileId + ')');
    const found = this.fileLockArray.find(x => x.fileId === fileId && x.socketId === socketId);
    if (found) {
      console.log(found.userInfo.name + ' 解锁定值单: ' + fileId);
      if (found.timeout) {
        clearTimeout(found.timeout);
        found.timeout = false;
      }
      found.locked = false;
    }
  }
}
