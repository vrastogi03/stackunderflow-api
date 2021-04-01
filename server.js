const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { response } = require('express');
const knex = require('knex')({
    client: 'pg',
    connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
    }
}); 

const app = express();

app.use(express.json());
app.use(cors());


app.get('/',(req,res)=>{
    res.json('success');
})

app.post('/signinstudent',(req,res)=>{
    knex.select('email','hash').from('login')
    .where('email','=',req.body.email)
    .then(data=>{
        const isValid = bcrypt.compareSync(req.body.password,data[0].hash)
        if(isValid){
            return knex.select('*').from('student')
                .where('email','=',req.body.email)
                .then(user =>{
                    res.json(user[0])
                })
                .catch(err => res.status(400).json('unable to get user'))
        }
        else {
            res.status(400).json('wrong credentials1')
        }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/signinteacher',(req,res)=>{
    knex.select('email','hash').from('login')
    .where('email','=',req.body.email)
    .then(data=>{
        const isValid = bcrypt.compareSync(req.body.password,data[0].hash)
        if(isValid){
            return knex.select('*').from('teacher')
                .where('email','=',req.body.email)
                .then(user =>{
                    res.json(user[0])
                })
                .catch(err => res.status(400).json('unable to get user'))
        }
        else {
            res.status(400).json('wrong credentials1')
        }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/registerstudent',(req,res)=>{
    const {email,name,password}=req.body;
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);

    const hash = bcrypt.hashSync(password,salt);
    knex.transaction(trx =>{
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail=>{ 
            return trx('student')
            .returning('*')
            .insert({
                email:loginEmail[0],
                name: name,
                quesasked:0
            })
            .then(user =>{
                res.json(user[0])
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
        .catch(err=>res.status(400).json('unable to register'))
})

app.post('/askques',(req,res)=>{
    const {askedby  , question} = req.body;
    knex.transaction(trx=>{
        return trx('student').where('id',askedby)
        .increment('quesasked',1)
        .returning('*')
        .catch(err=>res.status(400).json('unable to register2'))
        .then(stud_id=>{
           
            return trx('question')
            .returning('*')
            .insert({
                askedby: stud_id[0].id,
                question: question,
                askedbyname: stud_id[0].name
            })
            .then(ques=>{
                res.json(ques[0])
            })
            .catch(err=>console.log(err))
        })
        .then(trx.commit)
        .catch(trx.rollback)})
    .catch(err=>res.status(400).json('unable to register'))
    
})

app.put('/ansques',(req,res)=>{
    const {id,answeredby,answer} =req.body;
    knex.transaction(trx=>{
        return trx('teacher').where('id',answeredby)
        .increment('quesanswered',1)
        .returning('*')
        .catch(err=>res.status(400).json('unable to register2'))
        .then(teach_id=>{
            return trx('question')
            .returning('*')
            .where('id',id)
            .update({
                answeredby: teach_id[0].id,
                answer:answer,
                answeredbyname: teach_id[0].name
            })
            .then(ques=>{
                res.json(ques[0])
            })
            .catch(err=>res.status(400).json('unable to register'))
            })
            .then(trx.commit)
            .catch(trx.rollback)
    })
    .catch(err=>res.status(400).json('unable to register1'))
})

app.get('/getques',(req,res)=>{
    knex.select('*').from('question')
    .then(ques=>{
        res.json(ques);
    })
})

app.get('/getansques',(req,res)=>{
    knex.select('*').from('question').whereNot({
        answer: 'Not Answered'
    })
    .then(ques=>{
        res.json(ques);
    })
})

app.get('/getunansques',(req,res)=>{
    knex.select('*').from('question').where({
        answer: 'Not Answered'
    })
    .then(ques=>{
        res.json(ques);
    })
})

app.post('/registerteacher',(req,res)=>{
    const {email,name,password}=req.body;
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);

    const hash = bcrypt.hashSync(password,salt);
    knex.transaction(trx =>{
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail=>{ 
            return trx('teacher')
            .returning('*')
            .insert({
                email:loginEmail[0],
                name: name,
                quesanswered:0
            })
            .then(user =>{
                res.json(user[0])
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
        .catch(err=>res.status(400).json('unable to register'))
})



app.listen(process.env.PORT||3000,()=>{
    console.log(`app is running on port ${process.env.PORT}`);
})