const TelegramBot = require('node-telegram-bot-api');
const ExcelJS = require('exceljs'); // استيراد مكتبة exceljs
require('dotenv').config(); // إذا كنت تستخدم متغيرات بيئية
const express = require('express'); // إضافة Express لتشغيل السيرفر
const axios = require('axios'); // مكتبة للتعامل مع API

// إعداد سيرفر Express
const app = express();
const port = process.env.PORT || 4000; // المنفذ الافتراضي
app.get('/', (req, res) => {
    res.send('The server is running successfully.');
});

// استبدل بالتوكن الخاص بك
const token = process.env.TELEGRAM_BOT_TOKEN || '7201507244:AAFmUzJTZ0CuhWxTE_BjwQJ-XB3RXlYMKYU';

// إنشاء البوت
const bot = new TelegramBot(token, { polling: true });

// تخزين البيانات من Excel
let data = [];

// حفظ معرفات المستخدمين الذين يتفاعلون مع البوت
let userIds = new Set(); // Set للحفاظ على المعرفات الفريدة للمستخدمين

// قائمة معرفات المسؤولين
const adminIds = process.env.ADMIN_IDS?.split(',') || ['7719756994'];

// دالة لتحميل البيانات من ملفات Excel
async function loadDataFromExcelFiles(filePaths) {
    data = [];
    try {
        for (const filePath of filePaths) {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(filePath);
            const worksheet = workbook.worksheets[0];

            const fileStats = require('fs').statSync(filePath);
            const lastModifiedDate = fileStats.mtime.toISOString().split('T')[0];

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
                        deliveryDate: lastModifiedDate, // تاريخ تسليم الجرة بناءً على تاريخ تعديل الملف
                    });
                }
            });
        }

        console.log('📁 تم تحميل البيانات من جميع الملفات بنجاح.');

        // إرسال تنبيه للمسؤولين
        sendMessageToAdmins("📢 تم تحديث البيانات من جميع الملفات بنجاح! يمكنك الآن البحث في البيانات المحدثة.");
    } catch (error) {
        console.error('❌ حدث خطأ أثناء قراءة ملفات Excel:', error.message);
    }
}

// استدعاء الدالة مع ملفات متعددة
const excelFiles = ['bur.xlsx', 'kan.xlsx', 'rfh.xlsx']; // استبدل بأسماء ملفاتك
loadDataFromExcelFiles(excelFiles);

// الرد على أوامر البوت
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userIds.add(chatId); // حفظ معرف المستخدم

    const options = {
        reply_markup: {
            keyboard: [
                [{ text: "🔍 البحث برقم الهوية أو الاسم" }],
                [{ text: "🌤 أحوال الطقس" }, { text: "💱 أسعار العملات" }],
                [{ text: "📞 معلومات الاتصال" }, { text: "📖 معلومات عن البوت" }],
            ],
            resize_keyboard: true,
            one_time_keyboard: false,
        },
    };

    if (adminIds.includes(chatId.toString())) {
        options.reply_markup.keyboard.push([{ text: "📢 إرسال رسالة للجميع" }]);
    }

    bot.sendMessage(chatId, "مرحبًا بك! اختر أحد الخيارات التالية:", options);
});

// التعامل مع الضغط على الأزرار
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const input = msg.text.trim();

    if (input === "🌤 أحوال الطقس") {
        const city = "غزة"; // يمكنك السماح للمستخدم باختيار مدينة
        const apiKey = "2fb04804fafc0c123fe58778ef5d878b"; // أدخل مفتاح API الخاص بـ OpenWeather
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=ar&appid=${apiKey}`;

        try {
            const response = await axios.get(weatherUrl);
            const weather = response.data;
            const weatherMessage = `
🌤 **أحوال الطقس في ${city}:**
- الحالة: ${weather.weather[0].description}
- درجة الحرارة: ${weather.main.temp}°C
- الرطوبة: ${weather.main.humidity}%
- الرياح: ${weather.wind.speed} م/ث
            `;
            bot.sendMessage(chatId, weatherMessage, { parse_mode: 'Markdown' });
        } catch (error) {
            bot.sendMessage(chatId, "⚠️ حدث خطأ أثناء جلب معلومات الطقس.");
        }
    } else if (input === "💱 أسعار العملات") {
        const currencyUrl = "https://api.exchangerate-api.com/v4/623c6034a8105de8e9768c5b/latest/USD"; // مثال على API لأسعار العملات

        try {
            const response = await axios.get(currencyUrl);
            const rates = response.data.rates;
            const usdToIls = rates.ILS || "غير متوفر"; // سعر الدولار مقابل الشيكل
            const usdToJod = rates.JOD || "غير متوفر"; // سعر الدولار مقابل الدينار الأردني
            const usdToEgp = rates.EGP || "غير متوفر"; // سعر الدولار مقابل الجنيه المصري

            const currencyMessage =
                - 1 دولار أمريكي = ${usdToIls} شيكل
                - 1 دولار أمريكي = ${usdToJod} دينار أردني
                - 1 دولار أمريكي = ${usdToEgp} جنيه مصري
            `;
            bot.sendMessage(chatId, currencyMessage, { parse_mode: 'Markdown' });
        } catch (error) {
            bot.sendMessage(chatId, "⚠️ حدث خطأ أثناء جلب أسعار العملات.");
        }
    } else if (input === "🔍 البحث برقم الهوية أو الاسم") {
        bot.sendMessage(chatId, "📝 أدخل رقم الهوية أو الاسم للبحث:");
    } else {
        const user = data.find((entry) => entry.idNumber === input || entry.name === input);

        if (user) {
            const response = `
🔍 **تفاصيل الطلب:**

👤 **الاسم**: ${user.name}
🏘️ **الحي / المنطقة**: ${user.area}
🏙️ **المدينة**: ${user.district}
📍 **المحافظة**: ${user.province}

📛 **اسم الموزع**: ${user.distributorName}
📞 **رقم جوال الموزع**: ${user.distributorPhone}
🆔 **هوية الموزع**: ${user.distributorId}

📜 **الحالة**: ${user.status}
📅 **تاريخ تسليم الجرة**: ${user.deliveryDate}
            `;
            bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, "⚠️ لم أتمكن من العثور على بيانات للمدخل المقدم.");
        }
    }
});

// تشغيل السيرفر
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
