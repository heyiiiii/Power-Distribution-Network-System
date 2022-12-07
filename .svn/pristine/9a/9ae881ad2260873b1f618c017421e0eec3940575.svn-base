import {Server} from 'http';
import WSocket from './socket';

export default class Globals {
  public static socket: WSocket;
  public static server: Server;

  public static initialize(httpServer: Server) : void {
    Globals.server = httpServer;
    Globals.socket = new WSocket(httpServer);
  }
}
