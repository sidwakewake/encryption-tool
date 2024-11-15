// 固定キー（パスワードなしの場合に使用）
const defaultKey = CryptoJS.enc.Utf8.parse("DefaultFixedKey12345"); // 16文字固定

// ランダムなパスワードを生成
function generatePassword() {
    const password = Array(12).fill(0).map(() =>
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(
            Math.floor(Math.random() * 62)
        )
    ).join('');
    document.getElementById("password").value = password;
}

// コピー機能
function copyToClipboard(elementId) {
    const textElement = document.getElementById(elementId);
    const textToCopy = textElement.value || textElement.innerText;
    if (!textToCopy) {
        alert(languageContent.alerts.copyError);
        return;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert(languageContent.alerts.copySuccess);
    }).catch(err => {
        alert(languageContent.alerts.copyFailure);
        console.error(err);
    });
}

// 暗号化処理
function encryptText() {
    const text = document.getElementById("inputText").value.trim();
    const passwordInput = document.getElementById("password").value.trim();

    if (!text) {
        alert(languageContent.alerts.noText);
        return;
    }

    const key = passwordInput
        ? CryptoJS.enc.Utf8.parse(CryptoJS.MD5(passwordInput).toString().slice(0, 16))
        : defaultKey;

    const encrypted = CryptoJS.AES.encrypt(text, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    }).toString();

    document.getElementById("resultText").value = encrypted;
    alert(languageContent.alerts.encryptionSuccess);
}

// 復号処理
function decryptText() {
    const encryptedText = document.getElementById("inputText").value.trim();
    const passwordInput = document.getElementById("password").value.trim();

    if (!encryptedText) {
        alert(languageContent.alerts.noEncryptedText);
        return;
    }

    const key = passwordInput
        ? CryptoJS.enc.Utf8.parse(CryptoJS.MD5(passwordInput).toString().slice(0, 16))
        : defaultKey;

    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedText, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }).toString(CryptoJS.enc.Utf8);

        document.getElementById("resultText").value = decrypted;
    } catch (e) {
        document.getElementById("resultText").value = languageContent.alerts.decryptionFailure;
    }
}

// 言語切り替え機能
let currentLanguage = 'zh'; // デフォルト言語は中国語

const languages = {
    zh: {
        title: "加密与解密工具",
        inputLabel: "请输入文本:",
        passwordLabel: "密码 (可选):",
        resultLabel: "结果:",
        placeholders: {
            inputText: "请输入要加密或解密的文本",
            password: "输入密码或自动生成",
            resultText: "加密或解密结果将显示在此"
        },
        buttons: {
            encrypt: "加密",
            decrypt: "解密",
            generatePassword: "生成密码",
            copy: "复制"
        },
        alerts: {
            copyError: "没有内容可复制。",
            copySuccess: "已复制到剪贴板！",
            copyFailure: "复制失败。",
            noText: "请输入要加密的文本。",
            noEncryptedText: "请输入要解密的文本。",
            encryptionSuccess: "加密成功！",
            decryptionFailure: "解密失败，请检查密码。"
        }
    },
    ja: {
        title: "暗号化・復号ツール",
        inputLabel: "テキストを入力:",
        passwordLabel: "パスワード（任意）:",
        resultLabel: "結果:",
        placeholders: {
            inputText: "暗号化または復号化するテキストを入力してください",
            password: "パスワードを入力または自動生成",
            resultText: "暗号化または復号化された結果が表示されます"
        },
        buttons: {
            encrypt: "暗号化",
            decrypt: "復号",
            generatePassword: "パスワード生成",
            copy: "コピー"
        },
        alerts: {
            copyError: "コピーする内容がありません。",
            copySuccess: "クリップボードにコピーしました！",
            copyFailure: "コピーに失敗しました。",
            noText: "暗号化するテキストを入力してください。",
            noEncryptedText: "復号する暗号化テキストを入力してください。",
            encryptionSuccess: "暗号化が成功しました！",
            decryptionFailure: "復号に失敗しました。正しいパスワードを入力してください。"
        }
    },
    en: {
        title: "Encryption and Decryption Tool",
        inputLabel: "Enter Text:",
        passwordLabel: "Password (Optional):",
        resultLabel: "Result:",
        placeholders: {
            inputText: "Enter text to encrypt or decrypt",
            password: "Enter password or generate automatically",
            resultText: "Encrypted or decrypted result will appear here"
        },
        buttons: {
            encrypt: "Encrypt",
            decrypt: "Decrypt",
            generatePassword: "Generate Password",
            copy: "Copy"
        },
        alerts: {
            copyError: "No content to copy.",
            copySuccess: "Copied to clipboard!",
            copyFailure: "Failed to copy.",
            noText: "Please enter text to encrypt.",
            noEncryptedText: "Please enter text to decrypt.",
            encryptionSuccess: "Encryption successful!",
            decryptionFailure: "Decryption failed. Please check your password."
        }
    }
};

function switchLanguage(lang) {
    currentLanguage = lang;
    const content = languages[lang];

    document.getElementById("app-title").innerText = content.title;
    document.getElementById("input-label").innerText = content.inputLabel;
    document.getElementById("password-label").innerText = content.passwordLabel;
    document.getElementById("result-label").innerText = content.resultLabel;
    document.getElementById("encrypt-btn").innerText = content.buttons.encrypt;
    document.getElementById("decrypt-btn").innerText = content.buttons.decrypt;
    document.getElementById("password-generate-btn").innerText = content.buttons.generatePassword;
    document.getElementById("input-copy-btn").innerText = content.buttons.copy;
    document.getElementById("password-copy-btn").innerText = content.buttons.copy;
    document.getElementById("result-copy-btn").innerText = content.buttons.copy;

    // プレースホルダーを設定
    document.getElementById("inputText").placeholder = content.placeholders.inputText;
    document.getElementById("password").placeholder = content.placeholders.password;
    document.getElementById("resultText").placeholder = content.placeholders.resultText;

    languageContent = content;
}

// 初期設定で中国語をロード
let languageContent = languages.zh;
switchLanguage('zh');
