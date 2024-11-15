const defaultKey = CryptoJS.enc.Utf8.parse("DefaultFixedKey12345");

// 语言配置
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
            noText: "请输入要加密的文本！",
            noEncryptedText: "请输入要解密的文本！",
            compressionFailed: "压缩失败！",
            decompressionFailed: "解压失败或密码错误！",
            copySuccess: "复制成功！",
            copyFailure: "复制失败！",
            noContentToCopy: "没有内容可复制！"
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
            noText: "Please enter text to encrypt!",
            noEncryptedText: "Please enter text to decrypt!",
            compressionFailed: "Compression failed!",
            decompressionFailed: "Decompression failed or incorrect password!",
            copySuccess: "Copied successfully!",
            copyFailure: "Copy failed!",
            noContentToCopy: "No content to copy!"
        }
    }
};

// 默认语言为中文
let languageContent = languages.zh;

// 切换语言
function switchLanguage(lang) {
    languageContent = languages[lang];

    // 更新页面文本
    document.getElementById("app-title").innerText = languageContent.title;
    document.getElementById("input-label").innerText = languageContent.inputLabel;
    document.getElementById("password-label").innerText = languageContent.passwordLabel;
    document.getElementById("result-label").innerText = languageContent.resultLabel;

    document.getElementById("inputText").placeholder = languageContent.placeholders.inputText;
    document.getElementById("password").placeholder = languageContent.placeholders.password;
    document.getElementById("resultText").placeholder = languageContent.placeholders.resultText;

    document.getElementById("encrypt-btn").innerText = languageContent.buttons.encrypt;
    document.getElementById("decrypt-btn").innerText = languageContent.buttons.decrypt;
    document.getElementById("password-generate-btn").innerText = languageContent.buttons.generatePassword;
    document.getElementById("input-copy-btn").innerText = languageContent.buttons.copy;
    document.getElementById("password-copy-btn").innerText = languageContent.buttons.copy;
    document.getElementById("result-copy-btn").innerText = languageContent.buttons.copy;
}

// 文本复制功能
function copyToClipboard(elementId) {
    const textElement = document.getElementById(elementId);
    const textToCopy = textElement.value || textElement.innerText;
    if (!textToCopy) {
        alert(languageContent.alerts.noContentToCopy);
        return;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert(languageContent.alerts.copySuccess);
    }).catch(err => {
        alert(languageContent.alerts.copyFailure);
        console.error(err);
    });
}

// 自动调整文本框大小（仅限结果框）
function autoResizeTextArea(elementId) {
    const textarea = document.getElementById(elementId);
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
}

// 加密文本
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
    autoResizeTextArea("resultText");
}

// 解密文本
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
        autoResizeTextArea("resultText");
    } catch (e) {
        document.getElementById("resultText").value = languageContent.alerts.decompressionFailed;
        autoResizeTextArea("resultText");
    }
}

// 生成随机密码
function generatePassword() {
    const password = Array(12)
        .fill(0)
        .map(() =>
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(
                Math.floor(Math.random() * 62)
            )
        )
        .join('');
    document.getElementById("password").value = password;
}
