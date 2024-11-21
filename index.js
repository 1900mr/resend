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

        worksheet.eachRow((row) => {
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

        console.log('✅ تم تحميل البيانات بنجاح.');
    } catch (error) {
        console.error('❌ حدث خطأ أثناء قراءة ملف Excel:', error.message);
    }
}

// تحميل البيانات عند بدء التشغيل
loadDataFromExcel();

// الرد على /start
bot.onText(/\/start/, (msg) => {
    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🔍 البحث برقم الهوية", callback_data: 'search_by_id' }],
                [{ text: "🔍 البحث بالاسم", callback_data: 'search_by_name' }],
                [{ text: "🔍 البحث بالاسم ورقم الهوية", callback_data: 'search_by_both' }],
                [{ text: "🤖 معلومات عن البوت", callback_data: 'about' }],
                [{ text: "📞 معلومات الاتصال", callback_data: 'contact' }]
            ],
        },
    };
    bot.sendMessage(msg.chat.id, "مرحبًا بك! اختر أحد الخيارات التالية:", options);
});

// التعامل مع الخيارات
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;

    if (query.data === 'search_by_id') {
        bot.sendMessage(chatId, "📝 أدخل *رقم الهوية* للبحث:", { parse_mode: 'Markdown' });
        bot.once('message', (msg) => {
            const idNumber = msg.text.trim();
            const user = data.find((entry) => entry.idNumber === idNumber);

            if (user) {
                const response = formatUserDetails(user);
                bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
            } else {
                bot.sendMessage(chatId, "⚠️ لم أتمكن من العثور على بيانات برقم الهوية المدخل.");
            }
        });
    } else if (query.data === 'search_by_name') {
        bot.sendMessage(chatId, "📝 أدخل *الاسم الكامل* أو جزءًا منه للبحث:", { parse_mode: 'Markdown' });
        bot.once('message', (msg) => {
            const name = msg.text.trim();
            const users = data.filter((entry) => entry.name.includes(name));

            if (users.length > 0) {
                users.forEach((user) => {
                    const response = formatUserDetails(user);
                    bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
                });
            } else {
                bot.sendMessage(chatId, "⚠️ لم أتمكن من العثور على بيانات بالاسم المدخل.");
            }
        });
    } else if (query.data === 'search_by_both') {
        bot.sendMessage(chatId, "📝 أدخل *رقم الهوية* أو *الاسم* للبحث:", { parse_mode: 'Markdown' });
        bot.once('message', (msg) => {
            const input = msg.text.trim();
            const user =
                data.find((entry) => entry.idNumber === input) ||
                data.find((entry) => entry.name.includes(input));

            if (user) {
                const response = formatUserDetails(user);
                bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
            } else {
                bot.sendMessage(chatId, "⚠️ لم أتمكن من العثور على بيانات للمدخل المقدم.");
            }
        });
    } else if (query.data === 'about') {
        const aboutMessage = `
🤖 **معلومات عن البوت:**
- يتيح لك البحث برقم الهوية أو الاسم أو كليهما.
- يسهل عرض بيانات المواطنين والموزعين.
- الخدمة مقدمة من جهد شخصي للمساعدة.

🔧 **المطور**: أحمد محمد أبو غرقود
        `;
        bot.sendMessage(chatId, aboutMessage, { parse_mode: 'Markdown' });
    } else if (query.data === 'contact') {
        const contactMessage = `
📞 **معلومات الاتصال:**
- 📧 البريد الإلكتروني: [mrahel1991@gmail.com]
- 📱 الجوال: 0598550144
- 💬 تيليجرام: [https://t.me/AhmedGarqoud]
        `;
        bot.sendMessage(chatId, contactMessage, { parse_mode: 'Markdown' });
    }
});

// تنسيق بيانات المستخدم
function formatUserDetails(user) {
    return `
🔍 **تفاصيل الطلب:**

👤 **الاسم**: ${user.name}
📍 **المحافظة**: ${user.province}
🏙️ **المدينة**: ${user.district}
🏘️ **الحي / المنطقة**: ${user.area}

📛 **اسم الموزع**: ${user.distributorName}
🆔 **هوية الموزع**: ${user.distributorId}  
📞 **رقم جوال الموزع**: ${user.distributorPhone}

📜 **الحالة**: ${user.status}
📅 **تاريخ الطلب**: ${user.orderDate}
    `;
}

// تشغيل السيرفر
app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
});
