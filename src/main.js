import { Telegraf, session } from 'telegraf'
import { message } from 'telegraf/filters'
import config from 'config'
import mongoose from 'mongoose'
import { UserModel } from './models/user.model.js'
import {
  proccessVoiceMessage,
  proccessTextMessage,
} from './logic.js'
import { initCommand, normalize } from './utils.js'

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))

bot.telegram.setMyCommands([
  { command: '/start', description: 'Старт бота' },
  { command: '/help', description: 'Помощь' },
  { command: '/advert', description: 'Реклама' },
  { command: '/new', description: 'Новый диалог' },
])

bot.use(session())
bot.use(normalize())

// bot.command(
//   'new',
//   initCommand('Начат новый диалог. Жду голосовое или текстовое сообщение.')
// )

bot.command('new', async (ctx) => {
  ctx.session = emptySession()
  await ctx.reply('Начат новый диалог. Жду голосовое или текстовое сообщение.')
})

// bot.command(
//   'start',
//   initCommand(
//     "Привет{username}!\n\n Этот бот совершенно бесплатно позволяет вам пользоваться ChatGPT.\n\n <b>Чатбот умеет:</b>\n  1. Отвечать на аудио сообщения\n  2. Писать и редактировать тексты\n  3. Переводить с любого языка на любой\n  4. Писать и редактировать код \n  5. Отвечать на вопросы\n\n ✉️ Чтобы получить текстовый ответ, просто напишите в чат ваш вопрос.\n\n 🎤 Что бы задать вопрос голосом, нажмите на микрофон в нижнем правом углу возле чата и запишите свое аудио сообщение.\n\n 🤖 Помните, что ботом вместе с вами пользуются ещё 1.5 млн человек, он может отвечать с задержкой."
//   )
// )

bot.command(
  'start',
  async (ctx) => {
    const username = ctx.message.from.first_name;
    await initCommand(
      `Привет, <b>${username}</b>!\n\nЭтот бот совершенно бесплатно позволяет вам пользоваться ChatGPT.\n\n <b>Чатбот умеет:</b>\n  1. Отвечать на аудио сообщения\n  2. Писать и редактировать тексты\n  3. Переводить с любого языка на любой\n  4. Писать и редактировать код \n  5. Отвечать на вопросы\n\n ✉️ Чтобы получить текстовый ответ, просто напишите в чат ваш вопрос.\n\n 🎤 Что бы задать вопрос голосом, нажмите на микрофон в нижнем правом углу возле чата и запишите свое аудио сообщение.\n\n 🤖 Помните, что ботом вместе с вами пользуются ещё 1.5 млн человек, он может отвечать с задержкой.`
    )(ctx);
  }
);

bot.command('help', async (ctx) => {
  await ctx.reply('Если бот долгое время не отвечает, возможно возникла проблема с серверами openAI. Для решения проблемы попробуйте начать новый диалог (команда /new).')
})

bot.command('advert', async (ctx) => {
  await ctx.reply('По вопросам рекламы стучаться сюда https://t.me/pushkin9999')
})


bot.command('admin', async (ctx) => {
  if (ctx.message.from.id !== config.get('ADMIN_TG_ID')) return
  await ctx.reply('Привет Егор')
})

bot.command('users', async (ctx) => {
  const count = await UserModel.countDocuments()
  await ctx.reply(`Всего пользователей: ${count}`)
})

bot.on(message('voice'), proccessVoiceMessage)

bot.on(message('text'), proccessTextMessage)

async function start() {
  try {
    await mongoose.connect(config.get('MONGO_URI'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    bot.launch()

    console.log('MongoDB Connected and bot started.')

    process.on('uncaughtException', (err) => {
      console.error('Неперехваченное исключение:', err)
      // process.exit(1)
    })

    process.on('unhandledRejection', (reason, promise) => {
      console.error({ unhandledRejection: { reason, promise } })
    })

    // process.once('SIGINT', () => bot.stop('SIGINT'))
    // process.once('SIGTERM', () => bot.stop('SIGTERM'))
  } catch (e) {
    console.log('Server Error Db ebat', e.message)
    process.exit(1)
  }
}

start()
