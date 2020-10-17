const Koa = require('koa')
const router = require('koa-router')()
const static = require('koa-static')
const app = new Koa();
const axios = require('axios')
const querystring = require('querystring')
const jwt = require("jsonwebtoken");
const jwtAuth = require("koa-jwt");
const accessTokens = {}

const secret = "it's a secret";
app.use(static(__dirname + '/'));
const config = {
  client_id: '99bc1b2a029841fb7338',
  client_secret: '339bce8447401c013870ec12d284ab221b095e7f',

}

router.get('/auth/github/login', async (ctx) => {
  var dataStr = (new Date()).valueOf();
  //重定向到认证接口,并配置参数
  var path = `https://github.com/login/oauth/authorize?${querystring.stringify({ client_id: config.client_id })}`;

  //转发到授权服务器
  ctx.redirect(path);
})

// 登录成功后，重定向到 http://localhost:7001/oauth/redirect?code=b52a6f17724687c01a19
router.get('/oauth/redirect', async (ctx) => {
  console.log('callback..')
  const code = ctx.query.code;
  const params = {
    client_id: config.client_id,
    client_secret: config.client_secret,
    code: code
  }

  // 请求令牌
  let res = await axios.post('https://github.com/login/oauth/access_token', params)
  console.log(querystring.parse(res.data))
  const access_token = querystring.parse(res.data).access_token
  const uid = Math.random() * 99999
  accessTokens[uid] = access_token

  const token = jwt.sign(
    {
      data: uid,
      // 设置 token 过期时间，一小时后，秒为单位
      exp: Math.floor(Date.now() / 1000) + 60 * 60
    },
    secret
  )
  ctx.response.type = 'html';
  console.log('token:', token)
  ctx.response.body = ` <script>window.localStorage.setItem("authSuccess","true");window.localStorage.setItem("token","${token}");window.close();</script>`;
})

router.get('/auth/github/userinfo', jwtAuth({
  secret
}), async (ctx) => {
  // 验证通过，state.user
  console.log('jwt playload:', ctx.state.user)
  const access_token = accessTokens[ctx.state.user.data]
  res = await axios.get('https://api.github.com/user?access_token=' + access_token)
  console.log('userAccess:', res.data)
  ctx.body = res.data
})

app.use(router.routes()); /*启动路由*/
app.use(router.allowedMethods());
app.listen(7001);