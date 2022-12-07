import axios from 'axios';
import conf from '../../configs';

const CancelToken = axios.CancelToken;

const BasicAxios = axios.create({
  baseURL: `http://${conf.backend.host}:${conf.backend.port}${conf.backend.path}`,
  timeout: 15 * 1000
});

const axiosBasic = axios;
export default BasicAxios;
export { BasicAxios, CancelToken, axiosBasic };
