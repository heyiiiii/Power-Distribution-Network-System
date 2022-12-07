import urlencode from 'urlencode';
import conf from '../configs';
/*
PC:
 Chrome浏览器：
 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36
 Safari浏览器：
 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/604.5.6 (KHTML, like Gecko) Version/11.0.3 Safari/604.5.6
 Firefox浏览器：
 Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:58.0) Gecko/20100101 Firefox/58.0
 QQ浏览器：
 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36 QQBrowser/4.3.4986.400
 Edge浏览器：
 Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/13.10586
 IE11：
 Mozilla/5.0 (Windows NT 6.3; Win64, x64; Trident/7.0; rv:11.0) like Gecko
 IE10：
 Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Win64; x64; Trident/6.0)
MOBILE:
 Safari浏览器：
 Mozilla/5.0 (iPhone; CPU iPhone OS 11_2_6 like Mac OS X) AppleWebKit/604.5.6 (KHTML, like Gecko) Version/11.0 Mobile/15D100 Safari/604.1
 Chrome浏览器：
 Mozilla/5.0 (iPhone; CPU iPhone OS 11_2_6 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) CriOS/64.0.3282.112 Mobile/15D100 Safari/604.1
 QQ内置浏览器：
 Mozilla/5.0 (iPhone; CPU iPhone OS 11_2_6 like Mac OS X) AppleWebKit/604.5.6 (KHTML, like Gecko) Mobile/15D100 QQ/7.5.0.407 V1_IPH_SQ_7.5.0_1_APP_A Pixel/750 Core/UIWebView Device/Apple(iPhone 7) NetType/WIFI QBWebViewType/1
 QQ浏览器：
 Mozilla/5.0 (iPhone 91; CPU iPhone OS 11_2_6 like Mac OS X) AppleWebKit/604.5.6 (KHTML, like Gecko) Version/11.0 MQQBrowser/8.0.2 Mobile/15D100 Safari/8536.25 MttCustomUA/2 QBWebViewType/1 WKType/1
 UC浏览器：
 Mozilla/5.0 (iPhone; CPU iPhone OS 11_2_6 like Mac OS X; zh-CN) AppleWebKit/537.51.1 (KHTML, like Gecko) Mobile/15D100 UCBrowser/11.8.8.1060 Mobile AliApp(TUnionSDK/0.1.20.2)
 WeChat内置浏览器：
 Mozilla/5.0 (iPhone; CPU iPhone OS 11_2_6 like Mac OS X) AppleWebKit/604.5.6 (KHTML, like Gecko) Mobile/15D100 MicroMessenger/6.6.3 NetType/WIFI Language/zh_CN
 Baidu浏览器：
 Mozilla/5.0 (iPhone; CPU iPhone OS 11_2_6 like Mac OS X) AppleWebKit/604.5.6 (KHTML, like Gecko) Version/11. Mobile/15D100 Safari/600.1.4 baidubrowser/4.13.0.16 (Baidu; P2 11.2.6)
 Sougou浏览器：
 Mozilla/5.0 (iPhone; CPU iPhone OS 11_2_6 like Mac OS X) AppleWebKit/604.5.6 (KHTML, like Gecko) Mobile/15D100 SogouMobileBrowser/5.11.10
 Weibo内置浏览器：
 Mozilla/5.0 (iPhone; CPU iPhone OS 11_2_6 like Mac OS X) AppleWebKit/604.5.6 (KHTML, like Gecko) Mobile/15D100 Weibo (iPhone9,1__weibo__8.2.0__iphone__os11.2.6)
*/
const pcBrowserMatches = [
  {
    message: 'Chrome浏版本不可低于49',
    minVersion: 49,
    matcher: /Chrome\/(\d+)/i
  },
  {
    message: 'Safari版本不可低于534',
    minVersion: 534,
    matcher: /Safari\/(\d+)/i
  },
  {
    message: 'Safari版本不可低于52',
    minVersion: 52,
    matcher: /Firefox\/(\d+)/i
  },
  {
    message: 'Opera版本不可低于36',
    minVersion: 36,
    matcher: /Opera\/(\d+)/i
  },
  {
    message: 'IE版本不可低于11',
    minVersion: 7,
    matcher: /Trident\/(\d+)/i
  },
  {
    message: 'IE版本不可低于11',
    minVersion: 11,
    matcher: /MSIE (\d+)/i
  }
];

export default function({req, redirect}) {
  if (process.server && req) {
    const host = req.headers.host || `${conf.service.host}:${conf.service.port}`;
    const userAgent = req.headers['user-agent'];
    for (const browserMatch of pcBrowserMatches) {
      const matches = userAgent.match(browserMatch.matcher);
      if (matches) {
        const v = Number(matches[1]);
        if (v < browserMatch.minVersion) {
          console.warn('浏览器版本过低: ' + browserMatch.message);
          const location = `${conf.service.prefix}${host}`;
          const url = `${location}/download/compatible/error.html?referrer=` + urlencode.encode(location + conf.service.routerBase) + '&message=' + urlencode.encode(browserMatch.message + '，当前版本为: ' + v);
          console.log('重定向到: ' + url);
          redirect(url);
          return false;
        }
      }
    }
  }

  return true;
}
