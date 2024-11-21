const { Telegraf } = require('telegraf');
const express = require('express');
const app = express();

// استبدل هذا بـ التوكن الخاص بك
const bot = new Telegraf('YOUR_BOT_TOKEN');

// معرفات المجموعات
let sourceGroupId = null;
let targetGroupId = null;

// إعداد الـ webhook (تحديد البورت)
const PORT = process.env.PORT || 3000;  // يمكنك تحديد أي بورت تريده هنا

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

// استمع لـ webhook على المسار المحدد (مثلاً '/webhook')
app.use(bot.webhookCallback('/webhook'));

// تحديد مسار الـ webhook
bot.telegram.setWebhook(`https://yourdomain.com/webhook`);  // استبدل بـ URL الخاص بك

// بدء الخادم على البورت المحدد
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

console.log("البوت يعمل الآن...");
