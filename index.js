const TelegramBot = require('node-telegram-bot-api');
const ExcelJS = require('exceljs'); // استيراد مكتبة exceljs
const axios = require('axios'); // استيراد مكتبة axios لجلب البيانات من API
require('dotenv').config(); // إذا كنت تستخدم متغيرات بيئية
const express = require('express'); // إضافة Express لتشغيل السيرفر

// إعداد سيرفر Express (لتشغيل التطبيق على Render أو في بيئة محلية)
const app = express();
const port = process.env.PORT || 4000; // المنفذ الافتراضي
app.get('/', (req, res) => {
    res.send('The server is running successfully.');
});

// استبدل بالتوكن الخاص بك
const token = process.env.TELEGRAM_BOT_TOKEN || '7859625373:AAEFlMbm3Sfagj4S9rx5ixbfqItE1jNpDos';

// إنشاء البوت
const bot = new TelegramBot(token, { polling: true });

// تخزين البيانات من Excel
let data = [];

// حفظ معرفات المستخدمين الذين يتفاعلون مع البوت
let userIds = new Set(); // Set للحفاظ على المعرفات الفريدة للمستخدمين

// دالة لتحميل البيانات من عدة ملفات Excel
async function loadDataFromExcelFiles(filePaths) {
    data = []; // إعادة تعيين المصفوفة لتجنب التكرار
    try {
        for (const filePath of filePaths) {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(filePath); // قراءة الملف الحالي
            const worksheet = workbook.worksheets[0]; // أول ورقة عمل

            // الحصول على تاريخ آخر تعديل للملف
            const fileStats = require('fs').statSync(filePath); // قراءة بيانات الملف للحصول على تاريخ آخر تعديل
            const lastModifiedDate = fileStats.mtime.toISOString().split('T')[0]; // استخراج تاريخ آخر تعديل (YYYY-MM-DD)

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

                // إضافة البيانات مع تاريخ آخر تعديل كـ "تاريخ تسليم الجرة"
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

// قائمة معرفات المسؤولين
const adminIds = process.env.ADMIN_IDS?.split(',') || ['7719756994']; // إضافة المعرفات الفعلية للمسؤولين

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

// التعامل مع الرسائل المختلفة
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const input = msg.text.trim(); // مدخل المستخدم

    if (input === '/start' || input.startsWith('/')) return; // تجاهل الأوامر الأخرى

    if (input === "🔍 البحث برقم الهوية أو الاسم") {
        bot.sendMessage(chatId, "📝 أدخل رقم الهوية أو الاسم للبحث:");

    } else if (input === "📞 معلومات الاتصال") {
        const contactMessage = `
📞 **معلومات الاتصال:**
للمزيد من الدعم أو الاستفسار، يمكنك التواصل معنا عبر:

- 📧 البريد الإلكتروني: [mrahel1991@gmail.com]
- 📱 جوال : [0598550144]
- 💬 تلغرام : [https://t.me/AhmedGarqoud]
        `;
        bot.sendMessage(chatId, contactMessage, { parse_mode: 'Markdown' });

    } else else if (input === "💱 أسعار العملات") {
    try {
        // تضمين مفتاح API في الرابط بشكل صحيح
        const apiKey = "623c6034a8105de8e9768c5b"; // مفتاح API الخاص بك
        const currencyUrl = `https://api.exchangerate-api.com/v4/${apiKey}/latest/USD`;

        const response = await axios.get(currencyUrl);
        const rates = response.data.rates;

        // جلب أسعار العملات
        const usdToIls = rates.ILS || "غير متوفر"; // سعر الدولار مقابل الشيكل
        const usdToJod = rates.JOD || "غير متوفر"; // سعر الدولار مقابل الدينار الأردني
        const usdToEgp = rates.EGP || "غير متوفر"; // سعر الدولار مقابل الجنيه المصري

        // حساب تحويل الدينار الأردني والجنيه المصري إلى الشيكل
        const jodToIls = (usdToIls / usdToJod).toFixed(2) || "غير متوفر"; // سعر الدينار الأردني مقابل الشيكل
        const egpToIls = (usdToIls / usdToEgp).toFixed(2) || "غير متوفر"; // سعر الجنيه المصري مقابل الشيكل

        // رسالة العملات
        const currencyMessage = `
💱 **أسعار العملات:**
- 1 دولار أمريكي = ${usdToIls} شيكل
- 1 دينار أردني = ${jodToIls} شيكل
- 1 جنيه مصري = ${egpToIls} شيكل
        `;

        bot.sendMessage(chatId, currencyMessage, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error("⚠️ حدث خطأ أثناء جلب أسعار العملات:", error.message);
        bot.sendMessage(chatId, "⚠️ حدث خطأ أثناء جلب أسعار العملات.");
    }
}


    } else if (input === "🌤 أحوال الطقس") {
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

    } else if (input === "📖 معلومات عن البوت") {
        const aboutMessage = `
🤖 **معلومات عن البوت:**
هذا البوت يتيح لك البحث عن المواطنين باستخدام رقم الهوية أو الاسم.

- يتم عرض تفاصيل المواطن بما في ذلك بيانات الموزع وحالة الطلب.
- هدفنا هو تسهيل الوصول إلى البيانات.

🔧 **التطوير والصيانة**: تم تطوير هذا البوت بواسطة [احمد محمد ابو غرقود].
        `;
        bot.sendMessage(chatId, aboutMessage, { parse_mode: 'Markdown' });

    } else if (input === "📢 إرسال رسالة للجميع" && adminIds.includes(chatId.toString())) {
        bot.sendMessage(chatId, "✉️ اكتب الرسالة التي تريد إرسالها لجميع المستخدمين:");
        bot.once('message', (broadcastMsg) => {
            const broadcastText = broadcastMsg.text;
            sendBroadcastMessage(broadcastText, chatId);
        });

    } else {
        const user = data.find((entry) => 
            entry.idNumber?.toLowerCase() === input.toLowerCase() || 
            entry.name?.toLowerCase() === input.toLowerCase()
        );

        if (user) {
            const userMessage = `
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
            bot.sendMessage(chatId, userMessage, { parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, "⚠️ لم يتم العثور على نتائج للبحث الخاص بك.");
        }
    }
});

// دالة لإرسال الرسائل لجميع المستخدمين
function sendBroadcastMessage(message, adminChatId) {
    if (userIds.size === 0) {
        bot.sendMessage(adminChatId, "⚠️ لا توجد معرفات للمستخدمين.");
        return;
    }

    userIds.forEach((userId) => {
        bot.sendMessage(userId, message).catch((error) => {
            console.error(`❌ خطأ أثناء إرسال الرسالة للمستخدم ${userId}:`, error.message);
        });
    });

    bot.sendMessage(adminChatId, "✅ تم إرسال الرسالة لجميع المستخدمين.");
}

// تشغيل السيرفر
app.listen(port, () => {
    console.log(`🚀 السيرفر يعمل على المنفذ ${port}`);
});
