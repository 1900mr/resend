const { Telegraf } = require('telegraf');

// استبدل هذا بـ التوكن الخاص بك
const bot = new Telegraf('7859625373:AAEFlMbm3Sfagj4S9rx5ixbfqItE1jNpDos');

// معرفات المجموعات
let sourceGroupId = null;
let targetGroupId = null;

// عندما يتلقى البوت رسالة من أي مجموعة، سيطبع المعرفات في الـ console.
bot.on('message', (ctx) => {
  if (!sourceGroupId && ctx.chat.type === 'supergroup') {
    sourceGroupId = ctx.chat.id;
    console.log(`Source Group ID: ${sourceGroupId}`);
  }

  if (!targetGroupId && ctx.chat.type === 'supergroup' && ctx.chat.id !== sourceGroupId) {
    targetGroupId = ctx.chat.id;
    console.log(`Target Group ID: ${targetGroupId}`);
  }

  // عندما يتم تحديد كلا المعرفين، يقوم البوت بإرسال الرسائل من المصدر إلى الهدف.
  if (sourceGroupId && targetGroupId && ctx.chat.id === sourceGroupId) {
    bot.telegram.sendMessage(targetGroupId, ctx.message.text);
  }
});

// استخدام polling بدلاً من Webhook:
bot.launch();

console.log("البوت يعمل الآن...");
