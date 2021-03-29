const { Telegraf } = require('telegraf') //подключаем библеотеку telegraf
const mongoose = require("mongoose") 
const Schema = mongoose.Schema
const bot = new Telegraf('1605384579:AAFNYO0xVdUx8F5pIlhLbN8GswIvwlyK_Zo') //сюда помещается токен, который дал botFather
const db = "mongodb://localhost:27017/checklistdb"; //токен базы данных
const session = require('telegraf/session.js') 
mongoose.connect(db, { useUnifiedTopology: true, useNewUrlParser: true })
bot.use(session())
const { buttons } = require('./buttons.js')

const userScheme = new Schema({ //создаем схемы для юзеров и тасков
    name: String,
    chatid: Number,
    role: String,
    leave: Boolean,
    where: String,
    much: String
})

const User = mongoose.model("User", userScheme)

async function HyAdmin(){
    let admin = await User.find({role: 'admin'})
    for(let i = 0; i < admin.length; i++){
        bot.telegram.sendMessage(admin[i].chatid, 'Добрый день создатель', buttons.button_clear)
    }
}

async function Timer(){
    let timerId = setInterval(async function(){ //таймер для отправления отчета
        now = new Date();
        //пользователь сможет отправить отчет о приходе на работу только после истечения рабочего времени
        if (now.getHours() == 18 && now.getMinutes() == 00 && now.getSeconds() == 0){
            let allusers = await User.find({role: 'user'})
            for(let i = 0; i < allusers.length; i++){
                bot.telegram.sendMessage(allusers[i].chatid, 'Рабочее время истекло, вы можете идти', buttons.button_Goodbye)
            }
        }
    }, 5000)
}

bot.start(async ctx => { //ответ бота а команду /start
    ctx.reply('Hi ' + ctx.message.from.first_name, buttons.button_Goodmorning)
    const user = await User.findOne({chatid:ctx.message.chat.id})
    if(!user){ //сохраняем пользователей в базу данных, если пользователь есть в базе данных, то не сохраняет
        const newuser = new User({ name: ctx.message.from.first_name, chatid: ctx.message.from.id, role: 'user', leave: false, where: 'non', much: 'non'})
        newuser.save((err,saved)=>{
            if (err) console.log(err)
            if (saved) console.log('Пользователь сохранен')
            ctx.session.step = 0
        })
    } else {
        console.log('Такой пользователь уже существует')
    }
})

bot.command('admin', async ctx => { //ответ бота а команду /start
    ctx.reply('Hi ' + ctx.message.from.first_name)
    const user = await User.findOne({chatid:ctx.message.chat.id})
    if(!user){ //сохраняем пользователей в базу данных, если пользователь есть в базе данных, то не сохраняет
        const newuser = new User({ name: ctx.message.from.first_name, chatid: ctx.message.from.id, role: 'admin', leave: false, where: 'non', much: 'non'})
        newuser.save((err,saved)=>{
            if (err) console.log(err)
            if (saved) console.log('Пользователь сохранен')
            ctx.session.step = 0
        })
    } else {
        console.log('Такой пользователь уже существует')
    }
})

bot.hears('Доброе утро', async ctx => {
    ctx.reply('Доброе утро и приятного вам дня, отправьте фотоотчет о приходе на работу:', buttons.button_clear)
    ctx.session.step = 1
})
bot.hears('Отпроситься', async ctx => {
    ctx.reply('Напишите пожалуйста причину вашего отсутсвия на работе:', buttons.button_clear)
    ctx.session.step = 2
})
bot.hears('Я Вернулся', async ctx => {
    ctx.reply('Отправьте фотоотчет о приходе на работу:', buttons.button_clear)
    ctx.session.step = 4
})
bot.hears('Добрый вечер', async ctx => {
    ctx.reply('Добрый вечер, есть что-то что не устривало бы вас на работе? Опишите одним сообщением если они есть: ', buttons.button_clear)
    ctx.session.step = 5
})

bot.on('photo', async ctx => {
    let admin = await User.find({role: 'admin'})
    switch(ctx.session.step){
        case 1:
            let usercome = ctx.update.message.photo[0].file_id
            for(let i = 0; i < admin.length; i++){
                await bot.telegram.sendPhoto(admin[i].chatid, usercome)
                await bot.telegram.sendMessage(admin[i].chatid, 'Сотрудник ' + ctx.message.from.first_name + ' прибыл на работу')
            }
            ctx.reply('Ваш отчет принят', buttons.button_taketime)
            ctx.session.step = 0
            break
        case 4:
            let usercomeagain = ctx.update.message.photo[0].file_id
            for(let i = 0; i < admin.length; i++){
                await bot.telegram.sendPhoto(admin[i].chatid, usercomeagain)
                await bot.telegram.sendMessage(admin[i].chatid, 'Сотрудник ' + ctx.message.from.first_name + ' вернулся на работу после отсутсвия')
            }
            ctx.reply('Ваш отчет принят', buttons.button_taketime)
            ctx.session.step = 0
            break
        case 6:
            let usergohome = ctx.update.message.photo[0].file_id
            for(let i = 0; i < admin.length; i++){
                await bot.telegram.sendPhoto(admin.chatid, usergohome)
                await bot.telegram.sendMessage(admin.chatid, 'Сотрудник ' + ctx.message.from.first_name + ' ушел домой')
            }
            ctx.reply('Ваш отчет принят', buttons.button_Goodmorning)
            ctx.session.step = 0
            break
        default:
            ctx.reply('Извините, но у вас нет возможности отправлять фото на данный момент')
    }
})

bot.on('text', async ctx => {
    switch(ctx.session.step){
        case 2:
            await User.updateOne({chatid: ctx.message.from.id}, {leave: true, where: ctx.update.message.text})
            ctx.reply('Напишите пожалуйста время вашего отсутсвия на работе:')
            ctx.session.step = 3
            break
        case 3:
            await User.updateOne({chatid: ctx.message.from.id}, {much: ctx.update.message.text})
            ctx.reply('Вы точно хотите отпроситься?', buttons.button_yesno)
            ctx.session.step = 0
            break
        case 5:
            ctx.reply('Ваш ответ учтен, спасибо за отклик, ваше мнение важен для нас')
            ctx.reply('Отправьте пожалуйста фотоотчет:')
            let admin = await User.find({role: 'admin'})
            for(let i = 0; i < admin.length; i++){
                bot.telegram.sendMessage(admin[i].chatid, 'Сотрудник ' + ctx.update.message.from.first_name + ' оставил отзыв: ' + ctx.update.message.text)
            }
            ctx.session.step = 6
            break
        default:
            ctx.reply('Извините, но у вас нет возможности на данный момент писать')
    }
})

bot.on('callback_query', async ctx => {
    let admin = await User.find({role: 'admin'})
    if(ctx.update.callback_query.data == 'yes'){
        let ctx_user = await User.findOne({chatid: ctx.update.callback_query.from.id})
        ctx.deleteMessage()
        ctx.reply('Ваш ответ принят и отправлен руководителю, вы можете идти', buttons.button_timeon)
        for(let i = 0; i < admin.length; i++){
            bot.telegram.sendMessage(admin[i].chatid, 'Сотрудник ' + ctx_user.name + ' отпросился с работы по причине: "' + ctx_user.where + '" на ' + ctx_user.much + ' времени')
        }
    } else if (ctx.update.callback_query.data == 'no'){
        ctx.deleteMessage()
        ctx.reply('Ваша заявка успешно отменена', buttons.button_taketime)
    }
})

Timer()
HyAdmin()
bot.launch() // запуск бота