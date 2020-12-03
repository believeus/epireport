var express = require('express');
var bodyParser = require("body-parser");
var path = require('path');
var url = require('url');
var mongoose = require('mongoose');
var fs = require('fs');
var pdf = require('html-pdf');
const { parse, dirname } = require('path');
const { userInfo } = require('os');
var app = express();
var wkhtmltopdf = require('wkhtmltopdf');
var url = 'mongodb://localhost:27017/dbtest';
var session = require('express-session');
var http = require('http');
var https = require("https")

// const { id } = require('pdfkit/js/reference');



var exec = require('child_process').exec;
// 创建app应用对象
const sha1 = require("sha1");
//引入tool
const config = require('./modules/config');
const menu = require("./modules/wechat/menu");
app.use(session({
  secret: "weird sheep",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 },

}))
const wechat = require('./modules/wechat/wechat');
const { count, Console } = require('console');
const { send } = require('process');
const { Http2ServerResponse } = require('http2');
// console.info("app.js:"+global.openid)
//设置views的目录,__dirname全局变量表示当前执行脚本所在的目录
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');  //设置渲染引擎
app.set('host', "http://192.168.0.110:3000")
app.use("/public", express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

//设置全局的变量url供模板ejs引用
//app.locals会在整个生命周期中起作用；而res.locals只会有当前请求中起作用
app.locals["url"] = "http://192.168.0.110:3000"
app.get('/BQvnRcT01J.txt', function(req, res) {
    // const txt = fs.readFile(__dirname+"/BQvnRcT01J.txt") 
    
    res.send("d5f3b9a2a5c1a6236aa8b94e72690a74")
  
  
 })
const httpsOption = {
  key : fs.readFileSync(__dirname+"/4832262_www.epireport.beijingepidial.com.key", 'utf8'),
  cert: fs.readFileSync(__dirname+"/4832262_www.epireport.beijingepidial.com.pem", 'utf8'),
}
https.createServer(httpsOption,app).listen(3000)

//1.创建User集合规则
let UserSchema = new mongoose.Schema({
  signname: { type: String, default: '', trim: true },
  signdate: { type: String, default: '', trim: true },
  htmlpage: String
})
//1.根据规则创建集合实例User
let User = mongoose.model('User', UserSchema);

//2.创建UserInfo集合规则
let UserInfoSchema = new mongoose.Schema({
  sampleid: { type: String, trim: true },
  username: { type: String, trim: true },
  pdf: String,
  tel: String,
  identity: String,
  date: String,
  htmlpage: String,
  reportPage: String
})
//2.根据规则创建集合实例UserInfo
let UserInfo = mongoose.model('UserInfo', UserInfoSchema)


app.get("/admin/report/", (req, res) => {
  //req.query获取的是通过链接地址传递过来的数据
  let id = req.query.id//根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
  UserInfo.find({ _id: id }, function (err, result) {
    if (err) throw err
    //如果result[0].reportPage没有值返回undefined，但result[0].reportPage有值返回已经保存的页面
    //!result[0].reportPage表示result[0].reportPage有值，返回数据库中的页面
    let html = result[0].reportPage
    if (html) { // true false 0 1 undefind=false 有值=true 
      //et dvalue = html.replace("/range1tu[0-5]{1}/g", "range1tu<%=data.dnaval%>").replace(/scroe:[0-5]{1}/,"range1tu<%=data.dnaval%>")
      //res.render(dvalue, { "data": result[0] })//render如何把字符串输出到页面
      res.send(result[0].reportPage)
    } else {
      //如果没值返回页面
      res.render('reportLiver2', { "data": result[0] })
    }
  })
})

app.post("/admin/pagenation", (req, res) => {

  let index = parseInt(req.body.current) - 1
  let vdata = {}
  UserInfo.find(vdata, function (err, result) {
    res.send(result) //把数据传递给客户端页面
  }).sort({ "_id": -1 }).skip(50 * index).limit(50 * index + 49)
  // res.render('back/member-list', { "data": result[0] })
  //let curent 
  // x  begin  end
  // 0  0-------49
  // 1  50------99
  // 2  100-----149
  // y=ax+b
  // begin=ax+b (x当前页，y开始的位置)
  // 0=a0+b b=0   50=a+b a=50  y=50x

  //  end=ax+b (x当前页，y结束的位置)
  //  49=a0+b  99=1a+49 a=50 end=50c+49
  // find(user ,50*c,50c+49)
  // var result = UserInfo.FindAll().SetSkip(50*c).SetLimit(50*c+49).SetSortOrder(SortBy.Ascending("amount"))
  // console.log(result)

})
app.post("/admin/buildpdf", (req, res) => {
  let id = req.body.id//根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
  console.log(req.body.sampleid)
  wkhtmltopdf.command = __dirname + "\\wkhtmltopdf.exe"
  //wkhtmltopdf('http://localhost:3000/admin/report?id=' + id, { output: __dirname+'/public/pdffile/xx.pdf'});

  UserInfo.find({ "_id": id }, function (err, result) {
    if (err) throw err
    if (result[0].reportPage) { // true false 0 1 undefind=false 有值=true 
      let html = result[0].reportPage
      let spath = __dirname + '/public/pdffile/' + result[0].sampleid + '.pdf'
      wkhtmltopdf(html.replace(/block/g, "none"), { output: spath })
      // result[0].pdf=result[0].sampleid + '.pdf'
      UserInfo.update({ "_id": id }, { $set: { pdf: result[0].sampleid + '.pdf' } }, function (err, status) {
        if (err) throw err
        console.log(status)
        res.send("success")
      })


    }
  })
})
//front pages
app.get('/index', (req, res) => {
  var url = req.originalUrl
  console.log("index URL:" + url)
  res.render('index')
})

app.all('/userdata', (req, res) => {

  //微信验证信息 
  //获取上一个页面链接传过来的openid
  UserInfo.find({ tel: req.query.tel }, function (err, result) {
    if (err) throw err
    if (result.length != 0) {
      var html = result[0].htmlpage.replace(/readonly="readonly"/g, "").replace(/display: none;/g, "display: block;")
      res.send(html)
    } else {
      res.render('userForm')

    }
  })
  //根据openid数据库,如果没有这条记录返回userFrom
  //如果有这条记录返回存储在数据库的HTML页面

})
app.get('/reserveLiver', (req, res) => res.render('reserveLiver'))
app.get('/reserveCervix', (req, res) => res.render('reserveCervix'))
app.get('/maintaining', (req, res) => res.render('maintaining'))
app.get('/reserveEpiage', (req, res) => res.render('reserveEpiage'))
app.get('/checkLiverReport', (req, res) => res.render('checkLiverReport'))
app.get('/reportLiver', (req, res) => res.render('reportLiver'))
app.get('/reportLiver2', (req, res) => res.render('reportLiver2'))
app.get('/reserveLiver_success', (req, res) => res.render('reserveLiver_success'))

app.post("/users", function (req, res) {
  new User(req.body).save((err, data) => {
    if (err) throw err
    res.send("success")

  })

})
app.post("/saveform", function (req, res) {
  new UserInfo(req.body).save((err, data) => {
    if (err) throw err
    res.send("success");
  })

});

app.all("/testre", function (req, res) {
  console.info("身份证：" + req.body.identity)
  let identity = req.body.identity;
  UserInfo.find({ identity: identity }, function (err, result) {
    if (err) {
      res.send('noid')
    }
    if (result[0].pdf) {
      var pdf = result[0].pdf
      console.info(result[0].pdf);
      res.send(pdf);
    } else {
      res.send('error')

    }
  })


})


//登录拦截器，必须放在静态资源声明之后、路由导航之前
app.use(function (req, res, next) {
  const { signature, echostr, timestamp, nonce } = req.query;
  const { token } = config;

  //1、字典排序2、sha1 加密
  //const  arr =[timestamp,nonce,token];
  const sha1Str = sha1([timestamp, nonce, token].sort().join(''));
  var url = req.url
  var user = req.session.user  //记录登录的信息
  console.log("backend app.js:" + url)
  if (url.split("?")[0] == "/" || url.split("%")[0] == "/") {
    if (sha1Str === signature) {
      res.send(echostr) //返回微信验证字符串
      //openid
      //直接查数据库 如果数据库没有就去读取文件中的html页面，有就返回数据库的html页面
    }
    next()

  } else if (user || url.split("?")[0] == "/") {
    next()
  }else if (url == "/BQvnRcT01J.txt") {
    next()
  }else if (url == "/admin/loginview") {
    next()
  } else if (url == "/admin/login") {
    fs.readFile(__dirname + '/account.txt', 'utf-8', function (err, data) {
      if (err) throw err
      var username = data.slice(0, 5)
      var password = data.slice(5, 16)
      if (req.body.username == username && req.body.password == password) {
        var user = {}
        user.username = username
        user.password = password
        req.session.user = user
        next()
      } else {
        return res.redirect('/admin/loginview')
      }
    });
  } else if (url != "/admin/loginview" && !user) {
    return res.redirect("/admin/loginview")
  } else if (url == "/admin/loginview" && user) {
    next()
  }
});
//back pages
app.get('/admin/loginview', (req, res) => res.render('back/login'))
app.get("/admin", (req, res) => {

  //查数据库获取数据，拼接成json格式传递到客户端
  res.render('back/index-2', { "username": "wuqiwei" })
  //传值到index.jhtml
  //项目路径/
  // res.sendFile(path.join(__dirname, "views/back", 'index.html'), {"username":"wuqiwei"});
})

app.post("/admin/login", (req, res) => { res.redirect('/admin') })
app.get("/admin/welcome", (req, res) => res.render('back/welcome'))
app.get("/admin/article", (req, res) => res.render('back/article-list'))
app.get("/admin/member", (req, res) => {
  //查询数据库数据
  let vdata = {}
  UserInfo.find(vdata, function (err, result) {
    UserInfo.count().then((count) => {
      res.render('back/member-list', { "data": result,"count": count }) //把数据传递给客户端页面
    });
  }).sort({ "_id": -1 }).skip(0).limit(50)

})

app.get("/admin/member-show", (req, res) => {
  let id = req.query.id
  //查询数据库数据
  UserInfo.find({ _id: id }, function (err, result) {
    // res.render('back/member-list', { "data": result }) //把数据传递给客户端页面
  })
})

app.post("/admin/saveReport", (req, res) => {
  //根据客户端传来的id查询并更新、插入对应数据
  console.log("这是报告里面的id??" + req.body.id)
  UserInfo.find({ _id: req.body.id }, function (err, result) {
    if (err) throw err
    result[0].sampleid = req.body.sampleid
    result[0].reportPage = req.body.reportPage
    result[0].dnaval = req.body.dnaval
    UserInfo.update({ _id: req.body.id }, { $set: { "sampleid": result[0].sampleid, "reportPage": result[0].reportPage, "dnaval": result[0].dnaval } }, function (err, status) {
      if (err) throw err
      res.send("success")
    })
  })
})
app.post("/admin/updateform", (req, res) => {
  console.info(req.body.sampleid)
  UserInfo.find({ sampleid: req.body.sampleid }, function (err, result) {
    if (err) throw err
    if (result.length == 0 || result.length == 1) {
      //根据客户端传来的id查询并更新、插入对应数据
      UserInfo.find({ _id: req.body.id }, function (err, result) {
        if (err) throw err
        // result[0].sampleid = req.body.sampleid
        UserInfo.update({ _id: req.body.id }, { $set: { "sampleid": req.body.sampleid } }, function (err, status) {
          if (err) throw err
          console.log(status)
          res.send("success")
        })
      })
    } else {
      res.send("error")
    }

  })

})

//删除数据库一行
app.post("/admin/delete", (req, res) => {
  console.log("删除的id是： " + req.body.id)
  UserInfo.deleteOne({ _id: req.body.id }, function (err, data) {
    if (err) throw err
    res.send("success")

  })
})


app.get("/admin/detail", (req, res) => {
  //req.query获取的是通过链接地址传递过来的数据
  // let htmlpage=req.query.htmlpage//("<html>"+req.body.htmlpage+"</html>")
  let id = req.query.id//根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
  UserInfo.find({ _id: id }, function (err, result) {
    if (err) throw err
    //result返回的是当前id获取到的哪一行的数据
    // console.info(result)
    var htmlpage = result[0].htmlpage
    res.send(htmlpage)
  })
})
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, db) {
  if (err) throw err;
  console.log("Connected to Database");
  //开启自定义菜单
  (async () => {
    const w = new wechat();
    let resule = await w.deleteMenu();
    let muelu = await w.creatMenu(menu);

  })();
  // app.listen(3000, () => {
  //   let html = []
  //   let hello=10
  //   html.push('<a id="detail" style="text-decoration:underline" onclick="article_edit("Detail information","/admin/detail?id='+ hello +' ","10002")" title="Detail">Detail</a>')
  //   console.info(html.join(""))
  //   console.log('Server listening on port 3000!')
  // })

})

module.exports = app;