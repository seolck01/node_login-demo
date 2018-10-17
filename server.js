var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
  console.log('请指定端口号好不啦？\n node server.js 8888 这样不会吗？')
  process.exit(1)
}

var server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url
  var queryString = ''
  if (pathWithQuery.indexOf('?') >= 0) { queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 ************/

  console.log('浏览器说：含查询字符串的路径\n' + pathWithQuery)

  if (path === '/') {
    let string = fs.readFileSync('./index.html', 'utf-8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    // console.log(request.headers.cookie)
    let cookies = request.headers.cookie.split(';')
    // console.log(cookies)  [ 'sign_in_email=1@qq.com' ]
    let hash={}
    for(let i=0;i<cookies.length;i++){
      let parts=cookies[i].split("=")
      let key=parts[0]
      let value=parts[1]
      hash[key]=value
    }
    let email=hash.sign_in_email
    let user=fs.readFileSync('./db/user',"utf8")
    user=JSON.parse(user)
    // console.log(user)
    let foundUser=null
    for(let i =0; i<user.length;i++){
      if(user[i].email===email){
        foundUser=user[i]
        console.log(foundUser)
        break;
      }
    }
    if(foundUser){
      string=string.replace("~~password",foundUser.password)
      string=string.replace("~~xxx",foundUser.email)
    }else{
      string=string.replace("~~password","你是谁啊")
      string=string.replace("~~xxx","我管你密码多少")
    }

 
    response.write(string)
    response.end()
  } else if (path === "/loginUp.html" && method === "GET") {
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;utf8')
    let string = fs.readFileSync('./loginUp.html')
    response.write(string)
    response.end()
  } else if (path === "/loginIn.html" && method === "GET") {
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;utf8')
    let string = fs.readFileSync('./loginIn.html')
    response.write(string)
    response.end()
  }
  else if (path === "/name") {
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/css;charset=utf-8')
    response.write("hi")
    response.end()
  } else if (path === '/sign_up' && method === "POST") {
    readBody(request).then((body) => {
      let strings = body.split("&")
      let hash = {}
      strings.forEach(function (string) {
        let parts = string.split("=")
        let key = parts[0]
        let value = parts[1]
        // hash[key] = value
        hash[key] = decodeURIComponent(value)
      })
      let { email, password, password_confirmation } = hash

      if (email.indexOf("@") === -1) {
        response.setHeader("Content-Type", "application/json;charset=utf-8")
        response.statusCode = 400
        response.write(`{"errors":{"email":"invalid"}}`)
      } else if (password !== password_confirmation) {
        response.statusCode = 400
        response.write("password not match")
      } else {
        var user = fs.readFileSync('./db/user', 'utf8')
        try {
          user = JSON.parse(user)
        } catch (exception) {
          user = []
        }
        var inUser = false
        for (let i = 0; i < user.length; i++) {
          let person = user[i];
          if (person.email = email) {
            inUser = true
            break;
          }
        }
        if (inUser) {
          response.statusCode = 400
          response.write('email is used')
        } else {
          user.push({ email: email, password: password })
          var userStr = JSON.stringify(user)
          fs.writeFileSync('./db/user', userStr)
          response.statusCode = 200
        }
      }
      response.end()
    })
  } else if (path === '/sign_in' && method === "POST") {
    readBody(request).then((body) => {
      let strings = body.split("&")
      let hash = {}
      strings.forEach(function (string) {
        let parts = string.split("=")
        let key = parts[0]
        let value = parts[1]
        // hash[key] = value
        hash[key] = decodeURIComponent(value)
      })
      let { email, password } = hash

      if (email.indexOf("@") === -1) {
        response.setHeader("Content-Type", "application/json;charset=utf-8")
        response.statusCode = 400
        response.write(`{"errors":{"email":"invalid"}}`)
      }
      else {
        var user = fs.readFileSync('./db/user', 'utf8')
        try {
          user = JSON.parse(user)
        } catch (exception) {
          user = []
        }
        var inUser = 0
        for (let i = 0; i < user.length; i++) {
          let person = user[i];
          if (person.email === email && person.password === password) {
            inUser = 1
            response.setHeader('Content-Type', 'text/html;charset=utf-8')
            response.setHeader("set-Cookie", `sign_in_email=${email}`)   /* ,sign_in_password=${password} */
            response.write("登录成功")
            response.statusCode = 200
            break;
          }
        }
        if (inUser === false) {
          response.statusCode = 400
          response.write('email is unregistered')
        }
      }
      response.end()
    })
  }
  else {
    response.statusCode = 404
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write('找不到这个路径')
    response.end()
  }

  /******** 代码结束，下面不要看 ************/
})

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = []
    request.on('data', (chunk) => { //监听data事件,因为html每次传给服务器都是一小段的数据
      body.push(chunk)
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      resolve(body)
    })
  })
}

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用浏览器打开 http://localhost:' + port)


