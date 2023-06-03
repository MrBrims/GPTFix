import { unlink } from 'fs/promises'
import { openai } from './openai.js'
import { UserModel } from './models/user.model.js'



const MAX_CONVERSATION_LENGTH = 10

export function normalize() {
  return function (ctx, next) {
    normalizeSession(ctx)
    return next()
  }
}

export async function removeFile(filepath) {
  try {
    await unlink(filepath)
  } catch (e) {
    console.log(`Error while unlinking file: `, e.message)
  }
}

export const gptMessage = (content, role = 'user') => ({
  content,
  role,
})

export const emptySession = () => ({
  messages: [],
  conversations: [],
})

export function initCommand(message) {
  return async function (ctx) {
    ctx.session = emptySession();
    const user = mapContextData(ctx.message.from);
    try {
      const existingUser = await UserModel.findOne({ telegramId: user.telegramId });
      if (!existingUser) {
        await new UserModel({
          telegramId: user.telegramId,
          firstname: user.firstname,
          username: user.username,
        }).save();
        console.log('User added to database');
      } else {
        console.log('User already exists in database');
      }
    } catch (e) {
      console.log('Error while adding user to database', e.message);
    }
    await ctx.reply(message, { parse_mode: 'HTML' });
  };
}

function normalizeSession(ctx) {
  ctx.session ??= emptySession()
  if (ctx.session.messages.length > MAX_CONVERSATION_LENGTH) {
    ctx.session = emptySession()
  }
}

export const mapContextData = (from) => ({
  telegramId: from.id,
  username: from.username,
  firstname: from.first_name,
})

export function printConversation(conversation) {
  if (!conversation) return 'Ошибка при чтении истории. Чуть позже починю'

  return conversation.messages
    .map((m) => {
      if (m.role === openai.roles.USER) {
        return `<b>- ${m.content}</b>\n\r\n\r`
      }
      return `${m.content}\n\r\n\r`
    })
    .join('')
}
