/**
 * Created by Administrator on 2020/10/16.
 */

const express = require('express');
const router = express.Router();
const request = require('request');
const {appID,appsecret}= require("../config");
const rp = require("request-promise-native");
//
//module.exports = () =>{
//    function wxlogin(){
//
//        return new Promise((resolve, reject) => {
//            const return_uri = 'https://www.baidu.com/';
//            const url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid='+${appID}+'&redirect_uri='+https://www.baidu.com+'&response_type=code&scope='+scope+'&state=STATE#wechat_redirect`
//            rp({method: 'POST', url, json: true}).then(res => {
//                console.log(res);
//                resolve(res)
//            }).catch(err => {
//                console.log(err);
//                reject('xx' + err)
//            })
//        })
//    }
//
//    function getToken(code) {
//        let reqUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?';
//        const AppID = 'wxfc9dec422e602a83';
//        const AppSecret = 'a6f5a2764273d25d282282db5498c633';
//        let params = {
//            appid: AppID,
//            secret: AppSecret,
//            code: code,
//            grant_type: 'authorization_code'
//        };
//
//        let options = {
//            method: 'get',
//            url: reqUrl+qs.stringify(params)
//        };
//        console.log(options.url);
//        return new Promise((resolve, reject) => {
//            request(options, function (err, res, body) {
//                if (res) {
//                    resolve(body);
//                } else {
//                    reject(err);
//                }
//            })
//        })
//    }
//};
///* ΢�ŵ�½ */
const AppID = 'wxfc9dec422e602a83';
const AppSecret = 'a6f5a2764273d25d282282db5498c633';
router.get('/wx_login', function(req,res, next){
    //console.log("oauth - login")

    // ��һ�����û�ͬ����Ȩ����ȡcode
    const router = 'get_wx_access_token';
    // ���Ǳ����ĵ�ַ
    const return_uri = 'https://www.baidu.com/'+router;
    const scope = 'snsapi_userinfo';
    res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?appid='+AppID+'&redirect_uri='+return_uri+'&response_type=code&scope='+scope+'&state=STATE#wechat_redirect');

});


router.get('/get_wx_access_token', function(req,res, next){
    //console.log("get_wx_access_token")
    //console.log("code_return: "+req.query.code)
    // �ڶ�����ͨ��code��ȡ��ҳ��Ȩaccess_token
    const code = req.query.code;
    request.get(
        {
            url:'https://api.weixin.qq.com/sns/oauth2/access_token?appid='+AppID+'&secret='+AppSecret+'&code='+code+'&grant_type=authorization_code'
        },
        function(error, response, body){
            if(response.statusCode == 200){

                // ����������ȡ�û���Ϣ(��scopeΪ snsapi_userinfo)
                //console.log(JSON.parse(body));
                var data = JSON.parse(body);
                var access_token = data.access_token;
                var openid = data.openid;

                request.get(
                    {
                        url:'https://api.weixin.qq.com/sns/userinfo?access_token='+access_token+'&openid='+openid+'&lang=zh_CN',
                    },
                    function(error, response, body){
                        if(response.statusCode == 200){

                            // ���Ĳ������ݻ�ȡ���û���Ϣ���ж�Ӧ����
                            var userinfo = JSON.parse(body);
                            console.log(JSON.parse(body));
                            console.log('��ȡ΢����Ϣ�ɹ���');

                            // С���ԣ�ʵ��Ӧ���У������ɴ˴���һ���ʻ�
                            //res.send("\
                            //    <h1>"+userinfo.nickname+" �ĸ�����Ϣ</h1>\
                            //    <p><img src='"+userinfo.headimgurl+"' /></p>\
                            //    <p>"+userinfo.city+"��"+userinfo.province+"��"+userinfo.country+"</p>\
                            //");

                        }else{
                            console.log(response.statusCode);
                        }
                    }
                );
            }else{
                console.log(response.statusCode);
            }
        }
    );
});
module.exports = router;
