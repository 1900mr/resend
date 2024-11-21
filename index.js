const TelegramBot = require('node-telegram-bot-api');
const ExcelJS = require('exceljs'); // استيراد مكتبة exceljs
require('dotenv').config(); // إذا كنت تستخدم متغيرات بيئية
const express = require('express'); // إضافة Express لتشغيل السيرفر

// إعداد سيرفر Express (لتشغيل التطبيق على Render أو في بيئة محلية)
const app = express();
const port = process.env.PORT || 4000; // المنفذ الافتراضي
app.get('/', (req, res) => {
    res.send('The server is running successfully.');
});

// استبدل بالتوكن الخاص بك
const token = process.env.TELEGRAM_BOT_TOKEN || '7203035834:AAEaT5eaKIKYnbD7jtlEijifCr7z7t1ZBL0';

// إنشاء البوت
const bot = new TelegramBot(token, { polling: true });

// تخزين البيانات من Excel
let data = [];

// دالة لتحميل البيانات من Excel
async function loadDataFromExcel() {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('gas18-11-2024.xlsx'); // اسم الملف
        const worksheet = workbook.worksheets[0]; // أول ورقة عمل

        worksheet.eachRow((row, rowNumber) => {
            const idNumber = row.getCell(1).value?.toString().trim(); // رقم الهوية
            const name = row.getCell(2).value?.toString().trim(); // اسم المواطن
            const province = row.getCell(3).value?.toString().trim(); // المحافظة
            const district = row.getCell(4).value?.toString().trim(); // المدينة
            const area = row.getCell(5).value?.toString().trim(); // الحي/المنطقة
            const distributorId = row.getCell(6).value?.toString().trim(); // هوية الموزع
            const distributorName = row.getCell(7).value?.toString().trim(); // اسم الموزع
            const distributorPhone = row.getCell(8).value?.toString().trim(); // رقم جوال الموزع
            const status = row.getCell(9).value?.toString().trim(); // الحالة
            const orderDate = row.getCell(12).value?.toString().trim(); // تاريخ الطلب

            if (idNumber && name) {
                data.push({
                    idNumber,
                    name,
                    province: province || "غير متوفر",
                    district: district || "غير متوفر",
                    area: area || "غير متوفر",
                    distributorId: distributorId || "غير متوفر",
                    distributorName: distributorName || "غير متوفر",
                    distributorPhone: distributorPhone || "غير متوفر",
                    status: status || "غير متوفر",
                    orderDate: orderDate || "غير متوفر",
                });
            }
        });

        console.log('تم تحميل البيانات بنجاح.');
    } catch (error) {
        console.error('حدث خطأ أثناء قراءة ملف Excel:', error.message);
    }
}

// تحميل البيانات عند بدء التشغيل
loadDataFromExcel();

// الرد على أوامر البوت
bot.onText(/\/start/, (msg) => {
    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🔍 البحث برقم الهوية أو الاسم", callback_data: 'search' }],
                [{ text: "📋 قائمة الأوامر", callback_data: 'help' }],
                [{ text: "📖 معلومات عن البوت", callback_data: 'about' }],
                [{ text: "📞 معلومات الاتصال للمزيد من الدعم", callback_data: 'contact' }],
            ],
        },
    };
    bot.sendMessage(msg.chat.id, "مرحبًا بك! اختر أحد الخيارات التالية:", options);
});

bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;

    if (query.data === 'search') {
        bot.sendMessage(chatId, "📝 أدخل رقم الهوية أو الاسم للبحث:");
    } else if (query.data === 'help') {
        const helpMessage = `
🤖 **قائمة الأوامر:**
/start - بدء المحادثة
/search - البحث باستخدام رقم الهوية أو الاسم
/help - عرض قائمة الأوامر
/contact - معلومات الاتصال للمزيد من الدعم
/about - معلومات عن البوت
     
        `;
        bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    } else if (query.data === 'about') {
        const aboutMessage = `
🤖 **معلومات عن البوت:**
هذا البوت يتيح لك البحث عن المواطنين باستخدام رقم الهوية أو الاسم

- يمكنك البحث باستخدام رقم الهوية أو الاسم.
- يتم عرض تفاصيل المواطن بما في ذلك بيانات الموزع وحالة الطلب.

هدفنا هو تسهيل الوصول إلى البيانات من خلال هذه الخدمة.
هذه الخدمة ليست حكومية وانما خدمة من جهد شخصي

🔧 **التطوير والصيانة**: تم تطوير هذا البوت بواسطة [احمد محمد ابو غرقود].
        `;
        bot.sendMessage(chatId, aboutMessage, { parse_mode: 'Markdown' });
    } else if (query.data === 'contact') {
        const contactMessage = `
📞 **معلومات الاتصال:**
للمزيد من الدعم أو الاستفسار، يمكنك التواصل معنا عبر:

- 📧 البريد الإلكتروني: [mrahel1991@gmail.com]
- 📱 جوال : [0598550144]
- 💬 تلغرام : [https://t.me/AhmedGarqoud]

نحن هنا للمساعدة!
        `;
        bot.sendMessage(chatId, contactMessage, { parse_mode: 'Markdown' });
    }
});

// إضافة الكود للتعامل مع /about مباشرة
bot.onText(/\/about/, (msg) => {
    const aboutMessage = `
🤖 **معلومات عن البوت:**
هذا البوت يتيح لك البحث عن المواطنين باستخدام رقم الهوية أو الاسم.

- يمكنك البحث باستخدام رقم الهوية أو الاسم.
- يتم عرض تفاصيل المواطن بما في ذلك بيانات الموزع وحالة الطلب.

هدفنا هو تسهيل الوصول إلى البيانات من خلال هذه الخدمة.
هذه الخدمة ليست حكومية وإنما خدمة من جهد شخصي.

🔧 **التطوير والصيانة**: تم تطوير هذا البوت بواسطة [احمد محمد ابو غرقود].
    `;
    bot.sendMessage(msg.chat.id, aboutMessage, { parse_mode: 'Markdown' });
});

// إضافة الكود للتعامل مع /contact مباشرة
bot.onText(/\/contact/, (msg) => {
    const contactMessage = `
📞 **معلومات الاتصال:**
للمزيد من الدعم أو الاستفسار، يمكنك التواصل معنا عبر:

- 📧 البريد الإلكتروني: [mrahel1991@gmail.com]
- 📱 جوال : [0598550144]
- 📱 تليجرام: [@ahmed_abou_ghrqa]
    `;
    bot.sendMessage(msg.chat.id, contactMessage, { parse_mode: 'Markdown' });
});


bot.onText(/\/search/, (msg) => {
    bot.sendMessage(msg.chat.id, "📝 أدخل رقم الهوية أو الاسم للبحث:");
});

bot.onText(/\/list/, (msg) => {
    bot.sendMessage(msg.chat.id, "📍 أدخل اسم المحافظة أو الحي لعرض الطلبات:");
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const input = msg.text.trim(); // مدخل المستخدم

    if (input === '/start' || input.startsWith('/')) return; // تجاهل الأوامر الأخرى

    const user = data.find((entry) => entry.idNumber === input || entry.name === input);

    if (user) {
        const response = `
🔍 **تفاصيل الطلب:**

👤 **الاسم**: ${user.name}
📍 **المحافظة**: ${user.province}
🏙️ **المدينة**: ${user.district}
🏘️ **الحي / المنطقة**: ${user.area}

🆔 **هوية الموزع**: ${user.distributorId}  
📛 **اسم الموزع**: ${user.distributorName}
📞 **رقم جوال الموزع**: ${user.distributorPhone}

📜 **الحالة**: ${user.status}
📅 **تاريخ الطلب**: ${user.orderDate}
        `;
        bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } else {
        bot.sendMessage(chatId, "⚠️ لم أتمكن من العثور على بيانات للمدخل المقدم.");
    }
});

// تشغيل السيرفر
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
