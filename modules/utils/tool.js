/**
 * Created by Administrator on 2020/9/10.
 */


/*
* ���ߺ�����
* */


module .exports={

    getUserDataAsync(req){

        return new Promise((resolve,reject) =>{
            let xmlData ='';

            req
               .on('data',data =>{
                xmlData +=data.toString();
            })
               .on('end',() =>{
                    resolve(xmlData);
                })


        })


    }
}