import Client from 'ssh2-sftp-client';

/**
 * sftp工具
 */

export class SftpUtil {
  config: Client.ConnectOptions;

  constructor(config: Client.ConnectOptions) {
    this.config = config;
  }

  /**
   * 上传数据
   *
   * @param data
   * data参数是一个字符串，它将被解释为用于传输数据的本地文件路径。
   * data参数是一个缓冲区，则缓冲区的内容被复制到远程文件，
   * data是一个可读的流，则该流的内容通过管道传输到服务器上的remotePath。
   * @param remotePath
   * @param options
   */
  uploadFile(data: string | Buffer | NodeJS.ReadableStream, remotePath: string, options?: Client.TransferOptions | undefined) {
    return new Promise((resolve, reject) => {
      const sftp = new Client();
      sftp.connect(this.config).then(() => {
          console.log(`sftp连接[${this.config.host}]成功`);
          return sftp.put(data, remotePath, options);
        }).then(() => {
          console.log(`上传[${remotePath}]成功`);
          sftp.end();
          resolve(true);
        }).catch((err) => {
          console.log(`上传[${remotePath}]失败`);
          reject(err);
      });
    });
  }

  /**
   * 获取数据
   *
   * @param path
   * @param dst
   * @param options
   */
  getFile(path: string, dst?: string | NodeJS.WritableStream | undefined, options?: Client.TransferOptions | undefined) {
    return new Promise((resolve, reject) => {
      const sftp = new Client();
      sftp.connect(this.config).then(async () => {
        console.log(`sftp连接[${this.config.host}]成功`);
        const isExists = await sftp.exists(path);
        if (!isExists) {
          console.log(`[${path}]不存在`);
          return null;
        }
        return sftp.get(path, dst, options);
      }).then((data) => {
        data && console.log(`获取[${path}]成功`);
        sftp.end();
        resolve(data);
      }).catch((err) => {
        console.log(`获取[${path}]失败`);
        reject(err);
      });
    });
  }

  deleteFile(path:string) {
    return new Promise((resolve, reject) => {
      const sftp = new Client();
      sftp.connect(this.config).then(() => {
        console.log(`sftp连接[${this.config.host}]成功`);
        return sftp.delete(path, true);
      }).then((data) => {
        data && console.log(`删除[${path}]成功`);
        sftp.end();
        resolve(data);
      }).catch((err) => {
        console.log(`删除[${path}]失败`);
        reject(err);
      });
    });
  }
}
