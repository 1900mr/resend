const TelegramBot = require('node-telegram-bot-api');
const ExcelJS = require('exceljs'); // استيراد مكتبة exceljs
require('dotenv').config(); // إذا كنت تستخدم متغيرات بيئية
const express = require('express'); // إضافة Express لتشغيل السيرفر

// إعداد سيرفر Express
const app = express();
const port = process.env.PORT || 4000; // المنفذ الافتراضي
app.get('/', (req, res) => {
    res.send('The server is running successfully.');
});

// استبدل بالتوكن الخاص بك
const token = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';

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

// الرد على أي رسالة كبحث تلقائي
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const input = msg.text.trim(); // مدخل المستخدم

    if (input === '/start' || input.startsWith('/')) return; // تجاهل الأوامر الأخرى

    const user = data.find(
        (entry) =>
            entry.idNumber === input || // تطابق مع رقم الهوية
            entry.name.includes(input) // تطابق جزئي مع الاسم
    );

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

// الرد على /start برسالة وترتيب الأزرار
bot.onText(/\/start/, (msg) => {
    const options = {
        reply_markup: {
            keyboard: [
                [{ text: "🔍 البحث برقم الهوية والاسم" }],
                [{ text: "📞 معلومات الاتصال" }, { text: "📖 معلومات عن البوت" }],
            ],
            resize_keyboard: true, // لضبط حجم الأزرار بحيث تكون ملائمة للمستخدم
            one_time_keyboard: false, // الأزرار ستظل ظاهرة حتى يتم الضغط عليها
        },
    };
    bot.sendMessage(msg.chat.id, "مرحبًا بك! استخدم الأزرار أدناه للخيارات المتاحة:", options);
});

// تشغيل السيرفر
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
