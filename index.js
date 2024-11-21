const { Telegraf } = require('telegraf');
const express = require('express');
const app = express();

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

// إعداد Webhook للبوت باستخدام Express
const port = 3000; // البورت الذي ترغب في تشغيل الخادم عليه
const url = 'https://yourdomain.com/webhook'; // استبدل هذا بالرابط الفعلي الذي يعمل عليه خادمك

// إعداد Webhook
bot.telegram.setWebhook(url);

// إعداد تطبيق Express
app.use(bot.webhookCallback('/webhook'));

// بدء خادم Express على بورت معين
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

console.log("البوت يعمل الآن...");
