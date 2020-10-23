/**
 * Created by Administrator on 2020/9/9.
 */
/*
*
* ��������֤ ��Ч�Ե�ģ��
* */


const  sha1 = require("sha1");
const config = require('../config');
//����tool
const {getUserDataAsync} = require('../utils/tool');


module.exports = () =>{


    return async (req,res,next) => {
        //΢�ŷ���������
        console.log(req.query);

        /*
         *
         * { signature: 'e3da83cd14417ec2b619125667977948e6944a9f',
         echostr: '8732109152779763133',
         timestamp: '1599700264',
         nonce: '822297294' }
         * */
        const {signature,echostr,timestamp,nonce}=req.query;
        const {token}=config;

        //1���ֵ�����2��sha1 ����
        //const  arr =[timestamp,nonce,token];
        const  sha1Str = sha1([timestamp,nonce,token].sort().join(''));
        //3�������������һ��signatrue ��΢�ŷ��͹����Ľ��жԱ�
        if(req.method ==='GET'){
            if(sha1Str===signature){
                res.send(echostr)
            }else{
                res.end('error');
            }
        }else if(req.method ==='POST'){
            //΢�ŷ��������û����͵�������post ת�����߷�����
            //��֤��Ϣ������΢�ŷ�����

            if(sha1Str !==signature){
                res.end('error');
            }
            console.log(req.query);
            const openid = await req.query.openid;
            global.openid = openid;
            //return Promise.resolve(openid);

            //module.exports.openid = openid;
            console.log("three openid:"+openid);
            const xmlData = await getUserDataAsync(req);
            console.log('xmldata:'+xmlData);
            res.end('');
        }else{
            res.end('error');
        }


    }
};
