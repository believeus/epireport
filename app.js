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
var exec = require('child_process').exec;
const formidable = require('formidable');
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
app.set('host', "http://localhost:3000")
app.use("/public", express.static(path.join(__dirname, 'public')));
app.use("/BQvnRcT01J.txt", express.static(path.join(__dirname, '/BQvnRcT01J.txt')));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

//设置全局的变量url供模板ejs引用
//app.locals会在整个生命周期中起作用；而res.locals只会有当前请求中起作用
app.locals["url"] = "http://localhost:3000"

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
//3.根据规则创建集合实例UserInfo
let UserInfo = mongoose.model('UserInfo', UserInfoSchema)


//2.创建生物学年龄UserInfoEpiage集合规则
let UserInfoEpiageSchema = new mongoose.Schema({
  sampleid: { type: String, trim: true },
  username: { type: String, trim: true },
  chroage: { type: Number, trim: true },
  epiage: { type: Number, trim: true },
  accuracy: { type: Number, trim: true },
  pdf: String,
  tel: String,
  date: String,
  htmlpage: String,
  reportPage: String
})
//3.根据规则创建集合实例UserInfoEpiage
let UserInfoEpiage = mongoose.model('UserInfoEpiage', UserInfoEpiageSchema)

//肝癌根据样本id查询报告
app.get("/admin/reportliver/", (req, res) => {
  //req.query获取的是通过链接地址传递过来的数据
  let id = req.query.id//根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
  UserInfo.findOne({ _id: id }, function (err, result) {
    if (err) throw err
    //如果result.reportPage没有值返回undefined，但result.reportPage有值返回已经保存的页面
    //!result.reportPage表示result.reportPage有值，返回数据库中的页面
    if (result && result.hasOwnProperty("reportPage")) { // true false 0 1 undefind=false 有值=true 
      let html = result.reportPage
      //et dvalue = html.replace("/range1tu[0-5]{1}/g", "range1tu<%=data.dnaval%>").replace(/scroe:[0-5]{1}/,"range1tu<%=data.dnaval%>")
      //res.render(dvalue, { "data": result })//render如何把字符串输出到页面
      res.send(result.reportPage)
    } else {
      //如果没值返回页面
      res.render('reportLiver2', { "data": result })
    }
  })
})
//生物学年龄根据样本id查询报告
app.get("/admin/reportepiage/", (req, res) => {
  (async () => {
    let id = req.query.id//根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
    let result = await UserInfoEpiage.findOne({ _id: id })
    if (result && result.hasOwnProperty("reportPage")) { // true false 0 1 undefind=false 有值=true 
      let html = result.reportPage
      //et dvalue = html.replace("/range1tu[0-5]{1}/g", "range1tu<%=data.dnaval%>").replace(/scroe:[0-5]{1}/,"range1tu<%=data.dnaval%>")
      //res.render(dvalue, { "data": result })//render如何把字符串输出到页面
      res.send(html)
    } else {
      let ntrGtBioUsers = JSON.stringify(await UserInfoEpiage.findOne({"$where": "this.chroage > this.epiage" }).select('chroage epiage'));
      let ntrLtBioUsers = JSON.stringify(await UserInfoEpiage.findOne({"$where": "this.chroage < this.epiage"  }).select('chroage epiage'));
      // let ddd = JSON.stringify(await UserInfoEpiage.find({ "$where": "this.chroage > this.epiage" }).select('chroage epiage'));
      // console.info(ntrGtBioUsers + "------->" + ntrLtBioUsers)
      res.render("reportepiage", { "data": result, "expectedChro": Math.abs((parseFloat(result.epiage - 8.9657)).toFixed(2)), "ntrLtBioUsers": ntrLtBioUsers, "ntrGtBioUsers": ntrGtBioUsers })
    }
  })();
  //req.query获取的是通过链接地址传递过来的数据
  // let id = req.query.id//根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
  // UserInfoEpiage.find({ _id: id }, function (err, result) {
  //   if (err) throw err
  //   //如果result.reportPage没有值返回undefined，但result.reportPage有值返回已经保存的页面
  //   //!result.reportPage表示result.reportPage有值，返回数据库中的页面
  //   if (result && result.hasOwnProperty("reportPage")) { // true false 0 1 undefind=false 有值=true 
  //     let html = result.reportPage
  //     //et dvalue = html.replace("/range1tu[0-5]{1}/g", "range1tu<%=data.dnaval%>").replace(/scroe:[0-5]{1}/,"range1tu<%=data.dnaval%>")
  //     //res.render(dvalue, { "data": result })//render如何把字符串输出到页面
  //     res.send(html)
  //   } else {
  //     //如果没值返回页面
  //     //查询mongodb数据库naturally > biological and biological > 0 
  //     var ntrLtBioData = []
  //     // var ntrGtBioData = []
  //     UserInfoEpiage.find({ chroage: { $gt: result.epiage } }, function (err, v1) {

  //       UserInfoEpiage.find({ chroage: { $gt: result.epiage } }, function (err, v2) {

  //       })
  //       console.info(result)
  //     })




  //     res.render('reportEpiage', { "data": result, "expectedChro": Math.abs((parseFloat(result.epiage - 8.9657)).toFixed(2)) })
  //   }
  // })
})

//肝癌后台页面分页
app.post("/admin/pagenation", (req, res) => {

  let index = parseInt(req.body.current) - 1
  let vdata = {}
  UserInfo.findOne(vdata, function (err, result) {
    res.send(result) //把数据传递给客户端页面
  }).sort({ "_id": -1 }).skip(50 * index).limit(50 * index + 49)
  // res.render('back/member-list', { "data": result })
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
//生物学年龄后台页面分页
app.post("/admin/pagenationEpiage", (req, res) => {

  let index = parseInt(req.body.current) - 1
  let vdata = {}
  UserInfoEpiage.findOne(vdata, function (err, result) {
    res.send(result) //把数据传递给客户端页面
  }).sort({ "_id": -1 }).skip(50 * index).limit(50 * index + 49)
})

//肝癌后台生成pdf报告
app.post("/admin/buildliverpdf", (req, res) => {
  let id = req.body.id//根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
  console.log(req.body.sampleid)
  wkhtmltopdf.command = __dirname + "\\wkhtmltopdf.exe --javascript-delay 20000"
  //wkhtmltopdf('http://localhost:3000/admin/reportliver?id=' + id, { output: __dirname+'/public/pdffile/xx.pdf'});

  UserInfo.findOne({ "_id": id }, function (err, result) {
    if (err) { throw err }
    else if (result && result.reportPage){// true false 0 1 undefind=false 有值=true
      let html = result.reportPage
      var spath = __dirname + '/public/pdffile/' + result.sampleid + '.pdf'
      wkhtmltopdf(html.replace(/block/g, "none"), { output: spath })
      // result.pdf=result.sampleid + '.pdf'
      UserInfo.update({ "_id": id }, { $set: { pdf: result.sampleid + '.pdf' } }, function (err, status) {
        if (err) throw err
        console.log(status)
        res.send("success")
      })
    }
  })
})
//生物学年龄后台生成pdf报告
app.post("/admin/buildepiagepdf", (req, res) => {
  let id = req.body.id//根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
  console.log("this is the sampid " + req.body.sampleid)
  wkhtmltopdf.command = __dirname + "\\wkhtmltopdf.exe"
  // wkhtmltopdf('http://localhost:3000/admin/reportepiage?id=' + id, { output: __dirname+'/public/pdffile/xx.pdf'});
  UserInfoEpiage.findOne({ "_id": id }, function (err, result) {
    // console.info(result)
    // console.info(result.reportPage !== undefined)
    if (err) { throw err }
    else if (result && result.reportPage)// true false 0 1 undefind=false 有值=true
    {
      let html = result.reportPage
      var spath = __dirname + '/public/pdffile/' + result.sampleid + '.pdf'
      wkhtmltopdf(html.replace(/block/g, "none"), { output: spath })
      // result.pdf=result.sampleid + '.pdf'
      UserInfoEpiage.updateOne({ "_id": id }, { $set: { pdf: result.sampleid + '.pdf' } }, function (err, status) {
        if (err) throw err
        console.log(status)
        res.send("success")
      })
    }

  })
})
//front pages
//肝癌知情同意签名
app.get('/indexLiver', (req, res) => {
  var url = req.originalUrl
  console.log("index URL:" + url)
  res.render('indexLiver')
})
//生物学年龄预约同意书
app.get('/indexEpiage', (req, res) => {
  var url = req.originalUrl
  console.log("index URL:" + url)
  res.render('indexEpiage')
})
//肝癌检测客户信息信息收集
app.all('/userDataLiver', (req, res) => {

  //微信验证信息 
  //获取上一个页面链接传过来的openid
  console.info("dee--" + req.query.id)
  UserInfo.findOne({ _id: req.query.id }, function (err, result) {
    if (err) throw err
    if (result.length != 0) {
      var html = result.htmlpage.replace(/readonly="readonly"/g, "").replace(/display: none;/g, "display: block;")
      res.send(html)
    } else {
      res.render('userFormLiver')

    }
  })
  //根据openid数据库,如果没有这条记录返回userFrom
  //如果有这条记录返回存储在数据库的HTML页面

})
//生物学年龄检测客户信息信息收集
app.all('/userDataEpiage', (req, res) => {

  console.info("dee" + req.query.id)
  //用户提交信息录入表格后，判断是否数据库已有该条数据，如果没有就保存到数据库
  //如果有就先查询数据库，并替换原有的不可编辑为可编辑
  UserInfoEpiage.findOne({ _id: req.query.id }, function (err, result) {
    if (err) throw err
    if (result.length != 0) {
      var html = result.htmlpage.replace(/readonly="readonly"/g, "").replace(/display: none;/g, "display: block;")
      res.send(html)
    } else {
      res.render('userFormEpiage')

    }
  })
})
app.get('/reserveLiver', (req, res) => res.render('reserveLiver'))
app.get('/reserveCervix', (req, res) => res.render('reserveCervix'))
app.get('/maintaining', (req, res) => res.render('maintaining'))
app.get('/reserveEpiage', (req, res) => res.render('reserveEpiage'))
app.get('/checkLiverReport', (req, res) => res.render('checkLiverReport'))
app.get('/reportLiver', (req, res) => res.render('reportLiver'))
app.get('/reportLiver2', (req, res) => res.render('reportLiver2'))
app.get('/reportEpiage', (req, res) => {
  res.render('reportEpiage')
})
app.get('/reserveLiver_success', (req, res) => res.render('reserveLiver_success'))
app.get('/reserveEpiage_success', (req, res) => res.render('reserveEpiage_success'))
//接受知情同意书签名页面的数据（肝癌，生物学年龄用户）
app.post("/users", function (req, res) {
  new User(req.body).save((err, data) => {
    if (err) throw err
    res.send("success")

  })

})
//接收肝癌筛查客户端保信息收集页面数据并返回状态
app.post("/saveformLiver", function (req, res) {
  new UserInfo(req.body).save((err, data) => {
    if (err) throw err
    res.send("success");
  })

});
//接收生物学年龄客户端保信息收集页面数据并返回状态
app.post("/saveformEpiage", function (req, res) {
  // console.info(req.body)
  //保存生物学年龄的用户数据表到saveformEpiage数据
  new UserInfoEpiage(req.body).save((err, data) => {
    if (err) throw err
    res.send("success");
  })

});
//肝癌筛查客户收集信息表单的保存与更新
app.post("/upload", function (req, res) {
  //创建表单解析对象formidable
  const form = new formidable.IncomingForm();
  //设置客户端上传文件的路径
  form.uploadDir = __dirname + '\\public\\uploads\\'
  console.log(form.uploadDir)
  form.keepExtensions = true;
  //解析客户端传递到服务端的formDate对象
  form.parse(req, function (err, fields, files) {
    if (err) { throw err }
    else {
      console.log(files);
      console.log(files.path);
      res.send("success")
    }
  })

});
// app.post('/upload', (req, res, next) => {
//   const form = new formidable.IncomingForm();
//   form.uploadDir =__dirname+'\\public\\uploads\\'
//   form.keepExtensions = true;
//   form.parse(req, (err, fields, files) => {
//     if (err) {
//       next(err);
//       return;
//     }
//     res.json({ fields, files });
//     res.send("ok")
//   });
// });


//肝癌查询pdf报告
app.all("/testre", function (req, res) {
  console.info("身份证：" + req.body.identity)
  let identity = req.body.identity;
  UserInfo.findOne({ identity: identity }, function (err, result) {
    if (result && result.hasOwnProperty("pdf")) {
      var pdf = result.pdf
      console.info(pdf);
      //是在浏览器输出字符串，还是让浏览器跳转
      res.send("pdf");
    } else {
      res.send('error')
    }
  })


})


//登录拦截器，必须放在静态资源声明之后、路由导航之前
// app.use(function (req, res, next) {
//   const { signature, echostr, timestamp, nonce } = req.query;
//   const { token } = config;

//   //1、字典排序2、sha1 加密
//   //const  arr =[timestamp,nonce,token];
//   const sha1Str = sha1([timestamp, nonce, token].sort().join(''));
//   var url = req.url
//   var user = req.session.user  //记录登录的信息
//   console.log("backend app.js:" + url)
//   // if (url.split("?")[0] == "/" || url.split("%")[0] == "/") {
//   //   if (sha1Str === signature) {
//   //     res.send(echostr) //返回微信验证字符串
//   //     //openid
//   //     //直接查数据库 如果数据库没有就去读取文件中的html页面，有就返回数据库的html页面
//   //   }
//   //   next()

//   // } else
//     if (user || url.split("?")[0] == "/") {
//     next()
//   }else if (url == "/BQvnRcT01J.txt") {
//     next()
//   }else if (url == "/admin/loginview") {
//     next()
//   } else if (url == "/admin/login") {
//     fs.readFile(__dirname + '/account.txt', 'utf-8', function (err, data) {
//       if (err) throw err
//       var username = data.slice(0, 5)
//       var password = data.slice(5, 16)
//       if (req.body.username == username && req.body.password == password) {
//         var user = {}
//         user.username = username
//         user.password = password
//         req.session.user = user
//         next()
//       } else {
//         return res.redirect('/admin/loginview')
//       }
//     });
//   } else if (url != "/admin/loginview" && !user) {
//     return res.redirect("/admin/loginview")
//   } else if (url == "/admin/loginview" && user) {
//     next()
//   }
// });
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

//肝癌筛查左边栏
app.get("/admin/memberLiver", (req, res) => {
  //查询数据库数据
  let vdata = {}
  UserInfo.find(vdata, function (err, result) {
    console.info(result.length)
    res.render('back/member-list-liver', { "data": result, "count": result.length }) //把数据传递给客户端页面
  }).sort({ "_id": -1 }).skip(0).limit(50)

})

//生物学年龄检测左边栏，点击查询UserInfoEpiage数据库并返回生物学年龄的数据
app.get("/admin/memberEpiage", (req, res) => {
  //查询数据库数据
  let vdata = {}
  UserInfoEpiage.find(vdata, function (err, result) {
    res.render('back/member-list-epiage', { "data": result, "count": result.length }) //把数据传递给客户端页面
  }).sort({ "_id": -1 }).skip(0).limit(50)

})
//肝癌筛查左边下拉栏
app.get("/admin/member-show", (req, res) => {
  let id = req.query.id
  //查询数据库数据
  UserInfo.findOne({ _id: id }, function (err, result) {
    // res.render('back/member-list', { "data": result }) //把数据传递给客户端页面
  })
})
//生物学年龄检测左边下拉栏
app.get("/admin/member-show", (req, res) => {
  let id = req.query.id
  //查询数据库数据
  UserInfo.findOne({ _id: id }, function (err, result) {
    // res.render('back/member-list', { "data": result }) //把数据传递给客户端页面
  })
})
//肝癌报告查询
app.post("/admin/saveReport", (req, res) => {
  //根据客户端传来的id查询并更新、插入对应数据
  console.log("这是报告里面的id??" + req.body.id)
  UserInfo.findOne({ _id: req.body.id }, function (err, result) {
    if (err) throw err
    result.sampleid = req.body.sampleid
    result.reportPage = req.body.reportPage
    result.dnaval = req.body.dnaval
    console.info("saveReport:");
    UserInfo.update({ _id: req.body.id }, { $set: { "sampleid": result.sampleid, "reportPage": result.reportPage, "dnaval": result.dnaval } }, function (err, status) {
      if (err) throw err
      res.send("success")
    })
  })
})
//生物学年龄报告查询
app.post("/admin/saveEpiageReport", (req, res) => {
  //根据客户端传来的id查询并更新、插入对应数据
  console.log("这是报告里面的id??" + req.body.id)
  UserInfoEpiage.findOne({ _id: req.body.id }, function (err, result) {
    if (err) throw err
      let parm = {}
      parm.sampleid = req.body.sampleid
      parm.chroage = req.body.chroage
      parm.epiage = req.body.epiage
      parm.reportPage = req.body.reportPage
      parm.accuracy = req.body.accuracy
      parm.dnaval = req.body.dnaval
     // let parm= { "sampleid": sampleid, "chroage":  chroage, "epiage":  epiage, "accuracy": accuracy, "reportPage":reportPage, "dnaval": dnaval } 
    console.info(result.chroage + "---------------- " + req.body.epiage);
    UserInfoEpiage.update({ _id: req.body.id }, { $set:parm}, function (err, status) {
      if (err) throw err
      res.send("success")
    })
  })
})
//肝癌报告输入结果后gnegxing更新报告
app.post("/admin/updateform", (req, res) => {
  console.info(req.body.sampleid)
  UserInfo.findOne({ sampleid: req.body.sampleid }, function (err, result) {
    if (err) throw err
    if (result.length == 0 || result.length == 1) {
      //根据客户端传来的id查询并更新、插入对应数据
      UserInfo.findOne({ _id: req.body.id }, function (err, result) {
        if (err) throw err
        // result.sampleid = req.body.sampleid
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
//生物学年龄报告输入结果后更新报告
app.post("/admin/updateEpiageform", (req, res) => {
  //1.输入sampleid时查询数据库是否有相同的smaplid，如果有就提示不能使用相同sampleid
  //2.如果没有就保存输入的sampleid到userinfos的数据库对应客户信息表里。

  UserInfoEpiage.findOne({ sampleid: req.body.sampleid }, function (err, result) {
    console.info("这是报告页面输入的sampleid" + req.body.sampleid)
    if (err) throw err
    // console.info(result.length)
    console.info(result==undefined)
    if (result.length == 0) {
      //根据客户端传来的id查询并更新、插入对应数据
      UserInfoEpiage.findOne({ _id: req.body.id }, function (err, result) {
        if (err) throw err
        // result.sampleid = req.body.sampleid
        UserInfoEpiage.update({ _id: req.body.id }, { $set: { "sampleid": req.body.sampleid } }, function (err, status) {
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
//更新后台输入chro age 跟 epiage
app.post("/admin/updateChro", (req, res) => {
  //根据客户端传来的id查询并更新、插入对应数据
  UserInfoEpiage.findOne({ _id: req.body.id }, function (err, result) {
    console.info("epiage输入时间为 " + req.body.inputEpiDate)
    if (err) throw err
    // result.sampleid = req.body.sampleid
    UserInfoEpiage.update({ _id: req.body.id }, { $set: { "chroage": req.body.chroage, "epiage": req.body.epiage, "accuracy": req.body.accuracy, "date": req.body.inputEpiDate } }, function (err, status) {
      if (err) throw err
      console.log(status)
      res.send("success")
    })
  })
})

//肝癌删除数据库一行
app.post("/admin/delete", (req, res) => {
  console.log("删除的id是： " + req.body.id)
  UserInfo.deleteOne({ _id: req.body.id }, function (err, data) {
    if (err) throw err
    res.send("success")

  })
})
//生物学年龄删除数据库一行
app.post("/admin/deleteEpiage", (req, res) => {
  console.log("删除的id是： " + req.body.id)
  UserInfoEpiage.deleteOne({ _id: req.body.id }, function (err, data) {
    if (err) throw err
    res.send("success")

  })
})
//肝癌查看用户填写信息页面
app.get("/admin/detail", (req, res) => {
  //req.query获取的是通过链接地址传递过来的数据
  // let htmlpage=req.query.htmlpage//("<html>"+req.body.htmlpage+"</html>")
  let id = req.query.id//根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
  UserInfo.findOne({ _id: id }, function (err, result) {
    if (err) { throw err }
    else if (result && result.hasOwnProperty("htmlpage")) {
      //result返回的是当前id获取到的哪一行的数据
      // console.info(result)
      var htmlpage = result.htmlpage
      res.send(htmlpage)
    }
  })
})
//后台查看生物学年龄用户填写信息页面
app.get("/admin/detailEpiage", (req, res) => {
  //req.query获取的是通过链接地址传递过来的数据
  // let htmlpage=req.query.htmlpage//("<html>"+req.body.htmlpage+"</html>")
  //根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
  let id = req.query.id
  UserInfoEpiage.findOne({ _id: id }, function (err, result) {
    if (err) { throw err }
    //判断UserInfoEpiage数据库是否已经有"htmlpage"这条数据，有就展现到页面
    else if (result && result.htmlpage) {
      //result返回的是当前id获取到的哪一行的数据
      var htmlpage = result.htmlpage
      res.send(htmlpage)
    }
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
  app.listen(3000, () => {
    let html = []
    let hello = 10
    html.push('<a id="detail" style="text-decoration:underline" onclick="article_edit("Detail information","/admin/detail?id=' + hello + ' ","10002")" title="Detail">Detail</a>')
    console.info(html.join(""))
    console.log('Server listening on port 3000!')
  })

})

module.exports = app;