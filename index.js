const { Telegraf } = require('telegraf');

// استبدل هذا بـ التوكن الخاص بك
const bot = new Telegraf('7859625373:AAEFlMbm3Sfagj4S9rx5ixbfqItE1jNpDos');

// معرف المجموعات
const sourceGroupId = 'SOURCE_GROUP_ID'; // ID المجموعة التي يتم استقبال الرسائل منها
const targetGroupId = 'TARGET_GROUP_ID'; // ID المجموعة التي يتم إرسال الرسائل إليها

// عندما يتلقى البوت رسالة من مجموعة معينة
bot.on('message', (ctx) => {
  if (ctx.chat.id.toString() === sourceGroupId) {
    // إرسال الرسالة إلى المجموعة الأخرى
    bot.telegram.sendMessage(targetGroupId, ctx.message.text);
  }
});

// بدء البوت
bot.launch();

console.log("البوت يعمل الآن...");
