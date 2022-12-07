export default function({$axios, store, redirect, req}) {
  function getFriendlySize(size) {
    let i = 0;
    const dec = 2;
    const unit = ['字节', 'K', 'M', 'G', 'T', 'P'];
    const result = Number(size);

    while ((result / 1024 ** i) >= 1024) {
      i++;
    }

    if (result >= 1000 && result < 1024) {
      i += 1;
    }

    if (i >= unit.length) {
      i = unit.length - 1;
    }

    return Math.round(result * 10 ** dec / 1024 ** i) / 10 ** dec + unit[i];
  }

  $axios.onRequest((config) => {
    config.headers.Pragma = 'no-cache';
    config.headers.Expires = '0';
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    if (!config.url.startsWith('/auth/')) {
      const header = store.getters.getAxiosHeader;
      for (const key in header) {
        config.headers[key] = header[key];
      }
    }

    if (process.client) {
      if (!location || !location.origin) {
        config.baseURL = location.protocol + '//' + location.host + store.getters.getAjaxPrefix;
      } else {
        config.baseURL = window.location.origin + store.getters.getAjaxPrefix;
      }
    } else {
      config.baseURL = req.axiosBaseURL;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('before axios.' + config.method + '(' + config.baseURL + config.url + ')');
      config.startTick = new Date().getTime();
    }

    return config;
  });

  $axios.onResponse((response) => {
    try {
      if (response.status === 401) {
        redirect('/login');
      }
      if (process.env.NODE_ENV === 'development') {
        const tick = new Date().getTime() - response.config.startTick;
        if (process.client) {
          let size = '';
          if (response.request.responseType === '' || response.request.responseType === 'text') {
            size = getFriendlySize(response.request.responseText.length);
          } else if (response.request.responseType === 'blob') {
            size = getFriendlySize(response.request.size);
          }

          if (response.config.params) {
            console.log('after axios.' + response.config.method + '(' + response.config.url + ') - ' + tick + '毫秒[' + size + ']', response.config.params);
          }

          if (response.config.data) {
            console.log('after axios.' + response.config.method + '(' + response.config.url + ') - ' + tick + '毫秒[' + size + ']', response.config.data);
          }

          if (!response.config.params && !response.config.data) {
            console.log('after axios.' + response.config.method + '(' + response.config.url + ') - ' + tick + '毫秒[' + size + ']');
          }

          console.log(response);
        } else {
          console.log('after axios.' + response.config.method + '(' + response.config.url + ') - ' + tick + '毫秒');
          // console.log(response.data);
        }
      }
    } catch (err) {
      console.error(err);
      console.log(response);
    }
  });

  $axios.onError((err) => {
    if (err && err.config) {
      console.log('axios error: [' + err.config.url + ']');
    }

    if (err && err.response && (err.response.status === 401 || err.response.status === 403)) {
      redirect('/login');
      return;
    }

    if (err.response && err.response.data) {
      console.error(err.response.data);
    }

    console.error(err);
    // const code = parseInt(error.response && error.response.status);
    // if (code === 400) {
    //   // redirect('/400');
    // }
  });
}
