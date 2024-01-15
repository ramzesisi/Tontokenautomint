const fs = require('fs');
const TonWeb = require("tonweb");
const TonWebMnemonic = require("tonweb-mnemonic");

const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC', {apiKey: '3b23b2837bdfe0b2f2a5c457b8fce416c1054bfb3a74b0bb28928e09261e010b'}));
const WalletClass = tonweb.wallet.all.v4R2;

async function createWalletsFromFile(filePath) {
    const wallets = [];
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const mnemonics = fileContent.split('\n');

    for (let mnemonic of mnemonics) {
        if (mnemonic) {
            const seed = await TonWebMnemonic.mnemonicToSeed(mnemonic.split(" "));
            const keyPair = TonWeb.utils.keyPairFromSeed(seed);
            const wallet = new WalletClass(tonweb.provider, { publicKey: keyPair.publicKey });
            const address = await wallet.getAddress();
            wallets.push({ wallet, keyPair, address });
        }
    }

    return wallets;
}

async function sendTransaction(wallet, keyPair) {
    try {
        // Получаем текущий порядковый номер
        const seqno = await wallet.methods.seqno().call();
        
        // Подготавливаем сообщения
        const messages = [];

        // Добавляем четыре идентичных сообщения
        for (let i = 0; i < 4; i++) {
            messages.push({
                toAddress: "UQDu07dq9TP2sHUnhHtFbO1bMj-DWlF2dqlm0dxz_Cqp5Kay",
                amount: TonWeb.utils.toNano("0"),
                payload:
                    'data:application/json,{"p":"ton-20","op":"mint","tick":"dedust.io","amt":"1000000000"}',
            });
        }

        // Строим объект для передачи
        const transfer = wallet.methods.transfers({
            seqno: seqno,
            secretKey: keyPair.secretKey,
            messages: messages,
        });

        // Отправляем транзакцию
        const result = await transfer.send();
        console.log('\x1b[32m%s\x1b[0m', ' Транзакция отправлена:', result);
    } catch (error) {
        console.error("Ошибка при отправке транзакции:", error);
    }
}

function sendAllTransactions(wallets) {
    wallets.forEach(wallet => {
        sendTransaction(wallet.wallet, wallet.keyPair);
    });
}

async function main() {
    const wallets = await createWalletsFromFile('mnemonics.txt');
    sendAllTransactions(wallets);

    setInterval(() => {
        sendAllTransactions(wallets);
    }, 3000);
}

main().catch(console.error);
