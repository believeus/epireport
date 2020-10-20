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
// const { id } = require('pdfkit/js/reference');
var exec = require('child_process').exec;
//设置views的目录,__dirname全局变量表示当前执行脚本所在的目录
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');  //设置渲染引擎
app.set('host', "http://localhost:3000")
app.use("/public", express.static(path.join(__dirname, 'public'))); //静态目录设置,设置虚拟目录/public
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: "weird sheep",
  resave: false,
  saveUninitialized: true,
  // cookie: { user: "admin", maxAge: 14 * 24 * 60 * 60 * 1000 }

}))
//设置全局的变量url供模板ejs引用
//app.locals会在整个生命周期中起作用；而res.locals只会有当前请求中起作用
app.use(function (req, res, next) {
  app.locals.url = 'http://localhost:3000'
  res.locals.url = 'http://localhost:3000'
  next();
})

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
  openid: String,
  tel: String,
  date: String,
  htmlpage: String,
  reportPage: String
})
//2.根据规则创建集合实例UserInfo
let UserInfo = mongoose.model('UserInfo', UserInfoSchema)
app.get("/admin/report", (req, res) => {
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
      //如果没值返回页面
    } else {
      res.render('reportLiver', { "data": result[0] })
    }
  })
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

    }
  })
})

//front pages
app.get('/', (req, res) => res.render('index'))
app.get('/userdata', (req, res) => {
  //获取上一个页面链接传过来的openid
  UserInfo.find({ openid: req.query.openid }, function (err, result) {
    if (err) throw err
    if (result.length!=0) {
      var html = result[0].htmlpage.replace(/readonly="readonly"/g,"")
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
app.get('/reserveEpiage', (req, res) => res.render('reserveEpiage'))
app.get('/checkLiverReport', (req, res) => res.render('checkLiverReport'))
app.get('/reportLiver', (req, res) => res.render('reportLiver'))
app.get('/reserveLiver_success', (req, res) => res.render('reserveLiver_success'))

app.post("/users", function (req, res) {
  // 通过connection和schema创建model
  new User(req.body).save((err, data) => {
    if (err) throw err
  });

})
app.post("/saveform", function (req, res) {
  //根据客户端传过来的openid查找数据库，没有就保存表单
  //有查到openid就根据openid更新数据库相应的openid字段,并把html页面返回给用户
  UserInfo.find({ openid: req.body.openid }, function (err, result) {
    if (err) throw err
    if (result.length != 0) {
        UserInfo.update({ openid: req.body.openid }, { $set: { "openid": req.body.openid,"username":req.body.username ,"tel":req.body.tel,"htmlpage":req.body.htmlpage,"date":req.body.date} }, function (err, status) {
          if (err) throw err
          console.log(status)
          res.render(result[0].htmlpage)
        })
    } else {
      new UserInfo(req.body).save((err, data) => {
        if (err) throw err
          res.send(data);
      })
    }

   })

});
// app.post("/saveform", function (req, res) {
//   UserInfo.find({ _id: req.body.id }, function (err, result) {
//     if (err) throw err
//     console.log(req.body.id)
//     if (_id) {
//       console.log(req.body.sampleid)
//       UserInfo.update({ _id: req.body.id }, { $set: { "sampleid": result[0].sampleid, "reportPage": result[0].reportPage, "dnaval": result[0].dnaval } }, function (err, status) {
//         if (err) throw err
//         res.send("success")
//       })
//      } else {
//         new UserInfo(req.body).save((err, data) => {
//           if (err) throw err
//           res.send(data);

//         });

//       }
//     })
//   })
//查询数据库是否有样本号相同的数据，有就更新，没有就插入

//  mongoose.collection('UserInfo').update({ sampleid: "sampleid" }, { Docsave }, { upsert: true })

//接受客户端提交的post请求并返回req.body获取的参数给客户端。
// 通过实例化model创建文档
// 将文档插入到数据库，save方法返回一个Promise对象。
// req.body不是nodejs默认提供的，需要载入中间件body-parser中间件才可以使用req.body


//登录拦截器，必须放在静态资源声明之后、路由导航之前
app.use(function (req, res, next) {
  var url = req.originalUrl
  var user = req.session.user  //记录登录的信息
  if (user) {
    next()
  } else if (url == "/admin/loginview") {
    next()
  } else if (url == "/admin/login") {
    fs.readFile(__dirname + '/account.txt', 'utf-8', function (err, data) {
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
  } else if (url != "/admin/loginview" && !user) { //user不存在
    return res.redirect("/admin/loginview");
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
    res.render('back/member-list', { "data": result }) //把数据传递给客户端页面
  })

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
  console.log(req.body.id)
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



  app.listen(3000, () => console.log('Server listening on port 3000!'))


})