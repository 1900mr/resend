const TelegramBot = require('node-telegram-bot-api');
const ExcelJS = require('exceljs');
require('dotenv').config();
const express = require('express');

// إعداد سيرفر Express
const app = express();
const port = process.env.PORT || 4000;
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
        await workbook.xlsx.readFile('gas18-11-2024.xlsx');
        const worksheet = workbook.worksheets[0];

        worksheet.eachRow((row, rowNumber) => {
            const idNumber = row.getCell(1).value?.toString().trim();
            const name = row.getCell(2).value?.toString().trim();
            const province = row.getCell(3).value?.toString().trim();
            const district = row.getCell(4).value?.toString().trim();
            const area = row.getCell(5).value?.toString().trim();
            const distributorId = row.getCell(6).value?.toString().trim();
            const distributorName = row.getCell(7).value?.toString().trim();
            const distributorPhone = row.getCell(8).value?.toString().trim();
            const status = row.getCell(9).value?.toString().trim();
            const orderDate = row.getCell(12).value?.toString().trim();

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
            keyboard: [
                [{ text: "🔍 البحث برقم الهوية أو الاسم" }],
                [{ text: "📞 معلومات الاتصال" }, { text: "📖 معلومات عن البوت" }],
            ],
            resize_keyboard: true, // ضبط الأزرار لتتناسب مع الحجم
            one_time_keyboard: false, // تجعل الأزرار مرئية دائمًا
        },
    };
    bot.sendMessage(msg.chat.id, "مرحبًا بك! اختر أحد الخيارات التالية:", options);
});

let waitingForInput = false;

// الرد على الضغط على الزر "🔍 البحث برقم الهوية أو الاسم"
bot.onText(/🔍 البحث برقم الهوية أو الاسم/, (msg) => {
    const chatId = msg.chat.id;
    
    // تغيير حالة انتظار المدخل
    waitingForInput = true;

    bot.sendMessage(chatId, '⚡️ من فضلك، أرسل لي رقم الهوية أو الاسم للبحث عن تفاصيل الطلب.');
});

// الرد على الرسائل
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const input = msg.text.trim();

    // التحقق مما إذا كان البوت في حالة انتظار إدخال رقم الهوية أو الاسم
    if (waitingForInput) {
        // البحث في البيانات باستخدام الاسم أو رقم الهوية
        const user = data.find((entry) => entry.idNumber === input || entry.name === input);

        if (user) {
            const response = `
🔍 **تفاصيل الطلب:**

👤 **الاسم**: ${user.name}
📍 **المحافظة**: ${user.province}
🏙️ **المدينة**: ${user.district}
🏘️ **الحي / المنطقة**: ${user.area}

📛 **اسم الموزع**: ${user.distributorName}
📞 **رقم جوال الموزع**: ${user.distributorPhone}
🆔 **هوية الموزع**: ${user.distributorId}  

📜 **الحالة**: ${user.status}
📅 **تاريخ الطلب**: ${user.orderDate}
            `;
            bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, "⚠️ لم أتمكن من العثور على بيانات للمدخل المقدم.");
        }

        // إعادة تعيين الحالة
        waitingForInput = false;
    } else if (input === '/start' || input.startsWith('/')) {
        // إذا كان المستخدم قد بدأ التفاعل مع البوت
        return;
    } else {
        // إذا كانت الرسالة لا تتعلق بالبحث
        bot.sendMessage(chatId, "⚠️ من فضلك، اختر أحد الأوامر أو اضغط على الزر المناسب.");
    }
});

// الرد على زر "📞 معلومات الاتصال"
bot.onText(/📞 معلومات الاتصال/, (msg) => {
    const chatId = msg.chat.id;
    const response = `
📞 **معلومات الاتصال:**
للمزيد من الدعم أو الاستفسار، يمكنك التواصل معنا عبر:

- 📧 البريد الإلكتروني: [mrahel1991@gmail.com]
- 📱 جوال : [0598550144]
- 💬 تلغرام : [https://t.me/AhmedGarqoud]

نحن هنا للمساعدة!
    `;
    bot.sendMessage(chatId, response);
});

// الرد على زر "📖 معلومات عن البوت"
bot.onText(/📖 معلومات عن البوت/, (msg) => {
    const chatId = msg.chat.id;
    const response = `
 🤖 **معلومات عن البوت:**
هذا البوت يتيح لك البحث عن المواطنين باستخدام رقم الهوية أو الاسم

- يمكنك البحث باستخدام رقم الهوية أو الاسم.
- يتم عرض تفاصيل المواطن بما في ذلك بيانات الموزع وحالة الطلب.

هدفنا هو تسهيل الوصول إلى البيانات من خلال هذه الخدمة.
هذه الخدمة ليست حكومية وانما خدمة من جهد شخصي

🔧 **التطوير والصيانة**: تم تطوير هذا البوت بواسطة [احمد محمد ابو غرقود].
    `;
    bot.sendMessage(chatId, response);
});

// تشغيل السيرفر
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
